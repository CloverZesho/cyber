import { TABLES } from '../dynamodb';
import { Asset } from '@/types/database';
import { createItem, getItem, updateItem, deleteItem, scanItems, generateCustomId } from './base';

export async function createAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'customId'>): Promise<Asset> {
  const customId = generateCustomId();
  return createItem<Asset>(TABLES.ASSETS, { ...asset, customId } as Asset);
}

export async function getAsset(id: string): Promise<Asset | null> {
  return getItem<Asset>(TABLES.ASSETS, id);
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
  return updateItem<Asset>(TABLES.ASSETS, id, updates);
}

export async function deleteAsset(id: string): Promise<boolean> {
  return deleteItem(TABLES.ASSETS, id);
}

export async function getAssetsByUser(userId: string): Promise<Asset[]> {
  // Get user-created assets
  const userAssets = await scanItems<Asset>(
    TABLES.ASSETS,
    '#userId = :userId AND #source = :source',
    { ':userId': userId, ':source': 'user' },
    { '#userId': 'userId', '#source': 'source' }
  );

  // Get admin assets that are published or assigned to user
  const adminAssets = await scanItems<Asset>(
    TABLES.ASSETS,
    '#source = :adminSource AND (#status = :published OR contains(#assignedUsers, :userId))',
    { ':adminSource': 'admin', ':published': 'published', ':userId': userId },
    { '#source': 'source', '#status': 'status', '#assignedUsers': 'assignedUsers' }
  );

  return [...userAssets, ...adminAssets];
}

export async function getAllAssets(): Promise<Asset[]> {
  return scanItems<Asset>(TABLES.ASSETS);
}

