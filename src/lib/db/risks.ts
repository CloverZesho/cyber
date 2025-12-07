import { TABLES } from '../dynamodb';
import { Risk } from '@/types/database';
import { createItem, getItem, updateItem, deleteItem, scanItems, generateCustomId } from './base';

export async function createRisk(risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'customId'>): Promise<Risk> {
  const customId = generateCustomId();
  return createItem<Risk>(TABLES.RISKS, { ...risk, customId } as Risk);
}

export async function getRisk(id: string): Promise<Risk | null> {
  return getItem<Risk>(TABLES.RISKS, id);
}

export async function updateRisk(id: string, updates: Partial<Risk>): Promise<Risk | null> {
  return updateItem<Risk>(TABLES.RISKS, id, updates);
}

export async function deleteRisk(id: string): Promise<boolean> {
  return deleteItem(TABLES.RISKS, id);
}

export async function getRisksByUser(userId: string): Promise<Risk[]> {
  // Get user-created risks
  const userRisks = await scanItems<Risk>(
    TABLES.RISKS,
    '#userId = :userId AND #source = :source',
    { ':userId': userId, ':source': 'user' },
    { '#userId': 'userId', '#source': 'source' }
  );

  // Get admin risks that are published or assigned to user
  const adminRisks = await scanItems<Risk>(
    TABLES.RISKS,
    '#source = :adminSource AND (#status = :published OR contains(#assignedUsers, :userId))',
    { ':adminSource': 'admin', ':published': 'published', ':userId': userId },
    { '#source': 'source', '#status': 'status', '#assignedUsers': 'assignedUsers' }
  );

  return [...userRisks, ...adminRisks];
}

export async function getAllRisks(): Promise<Risk[]> {
  return scanItems<Risk>(TABLES.RISKS);
}

