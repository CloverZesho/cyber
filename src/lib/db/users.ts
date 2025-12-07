import { TABLES } from '../dynamodb';
import { User } from '@/types/database';
import { createItem, getItem, updateItem, deleteItem, scanItems } from './base';
import bcrypt from 'bcryptjs';

export async function createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  // Hash password before storing
  const hashedPassword = await bcrypt.hash(user.password, 12);
  return createItem<User>(TABLES.USERS, { ...user, password: hashedPassword } as User);
}

export async function getUser(id: string): Promise<User | null> {
  return getItem<User>(TABLES.USERS, id);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await scanItems<User>(
    TABLES.USERS,
    '#email = :email',
    { ':email': email.toLowerCase() },
    { '#email': 'email' }
  );
  
  return users.length > 0 ? users[0] : null;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  // If updating password, hash it first
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 12);
  }
  return updateItem<User>(TABLES.USERS, id, updates);
}

export async function deleteUser(id: string): Promise<boolean> {
  return deleteItem(TABLES.USERS, id);
}

export async function getAllUsers(): Promise<Omit<User, 'password'>[]> {
  const users = await scanItems<User>(TABLES.USERS);
  // Remove passwords from response, keep all other fields
  return users.map(({ password, ...user }) => user);
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  
  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
}

