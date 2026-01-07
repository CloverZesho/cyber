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

// Generate password reset token
export async function generatePasswordResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  // Generate a random token
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  await updateItem<User>(TABLES.USERS, user.id, {
    passwordResetToken: token,
    passwordResetExpires: expires,
  });

  return token;
}

// Verify password reset token and reset password
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const users = await scanItems<User>(
    TABLES.USERS,
    '#resetToken = :token',
    { ':token': token },
    { '#resetToken': 'passwordResetToken' }
  );

  if (users.length === 0) return false;

  const user = users[0];

  // Check if token is expired
  if (!user.passwordResetExpires || new Date(user.passwordResetExpires) < new Date()) {
    return false;
  }

  // Hash new password and clear reset token
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await updateItem<User>(TABLES.USERS, user.id, {
    password: hashedPassword,
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
  });

  return true;
}

// Admin reset password (directly set new password)
export async function adminResetPassword(userId: string, newPassword: string): Promise<boolean> {
  const user = await getUser(userId);
  if (!user) return false;

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await updateItem<User>(TABLES.USERS, userId, {
    password: hashedPassword,
  });

  return true;
}

