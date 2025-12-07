import { TABLES } from '../dynamodb';
import { DPIA } from '@/types/database';
import { createItem, getItem, updateItem, deleteItem, scanItems, generateCustomId } from './base';

export async function createDPIA(dpia: Omit<DPIA, 'id' | 'createdAt' | 'updatedAt' | 'customId'>): Promise<DPIA> {
  const customId = generateCustomId();
  return createItem<DPIA>(TABLES.DPIAS, { ...dpia, customId } as DPIA);
}

export async function getDPIA(id: string): Promise<DPIA | null> {
  return getItem<DPIA>(TABLES.DPIAS, id);
}

export async function updateDPIA(id: string, updates: Partial<DPIA>): Promise<DPIA | null> {
  return updateItem<DPIA>(TABLES.DPIAS, id, updates);
}

export async function deleteDPIA(id: string): Promise<boolean> {
  return deleteItem(TABLES.DPIAS, id);
}

export async function getDPIAsByUser(userId: string): Promise<DPIA[]> {
  return scanItems<DPIA>(
    TABLES.DPIAS,
    '#userId = :userId OR #status = :published',
    { ':userId': userId, ':published': 'published' },
    { '#userId': 'userId', '#status': 'status' }
  );
}

export async function getAllDPIAs(): Promise<DPIA[]> {
  return scanItems<DPIA>(TABLES.DPIAS);
}

