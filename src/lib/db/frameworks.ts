import { TABLES } from '../dynamodb';
import { Framework, Control, Comment, Activity } from '@/types/database';
import { createItem, getItem, updateItem, deleteItem, scanItems, generateCustomId } from './base';
import { v4 as uuidv4 } from 'uuid';

// Framework CRUD
export async function createFramework(framework: Omit<Framework, 'id' | 'createdAt' | 'updatedAt' | 'customId'>): Promise<Framework> {
  const customId = generateCustomId();
  return createItem<Framework>(TABLES.FRAMEWORKS, { ...framework, customId, controlsData: framework.controlsData || [] } as Framework);
}

export async function getFramework(id: string): Promise<Framework | null> {
  return getItem<Framework>(TABLES.FRAMEWORKS, id);
}

export async function updateFramework(id: string, updates: Partial<Framework>): Promise<Framework | null> {
  return updateItem<Framework>(TABLES.FRAMEWORKS, id, updates);
}

export async function deleteFramework(id: string): Promise<boolean> {
  return deleteItem(TABLES.FRAMEWORKS, id);
}

export async function getFrameworksByUser(userId: string): Promise<Framework[]> {
  // Get user-created frameworks
  const userFrameworks = await scanItems<Framework>(
    TABLES.FRAMEWORKS,
    '#userId = :userId AND #source = :source',
    { ':userId': userId, ':source': 'user' },
    { '#userId': 'userId', '#source': 'source' }
  );

  // Get admin frameworks that are published or assigned to user
  const adminFrameworks = await scanItems<Framework>(
    TABLES.FRAMEWORKS,
    '#source = :adminSource AND (#status = :published OR contains(#assignedUsers, :userId))',
    { ':adminSource': 'admin', ':published': 'published', ':userId': userId },
    { '#source': 'source', '#status': 'status', '#assignedUsers': 'assignedUsers' }
  );

  return [...userFrameworks, ...adminFrameworks];
}

export async function getAllFrameworks(): Promise<Framework[]> {
  return scanItems<Framework>(TABLES.FRAMEWORKS);
}

// Add comment to framework
export async function addFrameworkComment(
  frameworkId: string,
  comment: Omit<Comment, 'id' | 'createdAt'>
): Promise<Framework | null> {
  const framework = await getFramework(frameworkId);
  if (!framework) return null;

  const newComment: Comment = {
    ...comment,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  const updatedComments = [...(framework.comments || []), newComment];
  return updateFramework(frameworkId, { comments: updatedComments });
}

// Add activity to framework
export async function addFrameworkActivity(
  frameworkId: string,
  activity: Omit<Activity, 'date'>
): Promise<Framework | null> {
  const framework = await getFramework(frameworkId);
  if (!framework) return null;

  const newActivity: Activity = {
    ...activity,
    date: new Date().toISOString().split('T')[0],
  };

  const updatedActivities = [newActivity, ...(framework.activities || [])];
  return updateFramework(frameworkId, { activities: updatedActivities });
}

// Update framework readiness
export async function updateFrameworkReadiness(
  frameworkId: string,
  userId: string,
  readiness: 'ready' | 'not_ready',
  userName: string
): Promise<Framework | null> {
  const action = readiness === 'ready' ? 'marked as ready' : 'marked as not ready';
  
  const result = await updateFramework(frameworkId, { readiness });
  if (result) {
    await addFrameworkActivity(frameworkId, { action: `Framework ${action}`, user: userName });
  }
  
  return result;
}

// Control CRUD
export async function createControl(control: Omit<Control, 'id' | 'createdAt' | 'updatedAt'>): Promise<Control> {
  return createItem<Control>(TABLES.CONTROLS, control as Control);
}

export async function getControl(id: string): Promise<Control | null> {
  return getItem<Control>(TABLES.CONTROLS, id);
}

export async function updateControl(id: string, updates: Partial<Control>): Promise<Control | null> {
  return updateItem<Control>(TABLES.CONTROLS, id, updates);
}

export async function deleteControl(id: string): Promise<boolean> {
  return deleteItem(TABLES.CONTROLS, id);
}

export async function getControlsByUser(userId: string): Promise<Control[]> {
  return scanItems<Control>(
    TABLES.CONTROLS,
    '#userId = :userId',
    { ':userId': userId },
    { '#userId': 'userId' }
  );
}

export async function getAllControls(): Promise<Control[]> {
  return scanItems<Control>(TABLES.CONTROLS);
}

