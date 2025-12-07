import { TABLES } from '../dynamodb';
import { Assessment, AssessmentProgress, AssessmentSubmission } from '@/types/database';
import { createItem, getItem, updateItem, deleteItem, scanItems, generateCustomId } from './base';

// Assessment CRUD
export async function createAssessment(assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt' | 'customId'>): Promise<Assessment> {
  const customId = generateCustomId();
  return createItem<Assessment>(TABLES.ASSESSMENTS, { ...assessment, customId } as Assessment);
}

export async function getAssessment(id: string): Promise<Assessment | null> {
  return getItem<Assessment>(TABLES.ASSESSMENTS, id);
}

export async function updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment | null> {
  return updateItem<Assessment>(TABLES.ASSESSMENTS, id, updates);
}

export async function deleteAssessment(id: string): Promise<boolean> {
  return deleteItem(TABLES.ASSESSMENTS, id);
}

export async function getAssessmentsByUser(userId: string): Promise<Assessment[]> {
  return scanItems<Assessment>(
    TABLES.ASSESSMENTS,
    '#userId = :userId OR #status = :published',
    { ':userId': userId, ':published': 'published' },
    { '#userId': 'userId', '#status': 'status' }
  );
}

export async function getAllAssessments(): Promise<Assessment[]> {
  return scanItems<Assessment>(TABLES.ASSESSMENTS);
}

// Assessment Progress CRUD
export async function saveAssessmentProgress(progress: Omit<AssessmentProgress, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssessmentProgress> {
  // Check if progress already exists
  const existing = await getAssessmentProgressByUserAndAssessment(progress.userId, progress.assessmentId);
  
  if (existing) {
    return updateItem<AssessmentProgress>(TABLES.ASSESSMENT_PROGRESS, existing.id, progress) as Promise<AssessmentProgress>;
  }
  
  return createItem<AssessmentProgress>(TABLES.ASSESSMENT_PROGRESS, progress as AssessmentProgress);
}

export async function getAssessmentProgress(id: string): Promise<AssessmentProgress | null> {
  return getItem<AssessmentProgress>(TABLES.ASSESSMENT_PROGRESS, id);
}

export async function getAssessmentProgressByUserAndAssessment(userId: string, assessmentId: string): Promise<AssessmentProgress | null> {
  const items = await scanItems<AssessmentProgress>(
    TABLES.ASSESSMENT_PROGRESS,
    '#userId = :userId AND #assessmentId = :assessmentId',
    { ':userId': userId, ':assessmentId': assessmentId },
    { '#userId': 'userId', '#assessmentId': 'assessmentId' }
  );
  
  return items.length > 0 ? items[0] : null;
}

// Assessment Submission CRUD
export async function createAssessmentSubmission(submission: Omit<AssessmentSubmission, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssessmentSubmission> {
  return createItem<AssessmentSubmission>(TABLES.ASSESSMENT_SUBMISSIONS, submission as AssessmentSubmission);
}

export async function getAssessmentSubmission(id: string): Promise<AssessmentSubmission | null> {
  return getItem<AssessmentSubmission>(TABLES.ASSESSMENT_SUBMISSIONS, id);
}

export async function getSubmissionsByAssessment(assessmentId: string): Promise<AssessmentSubmission[]> {
  return scanItems<AssessmentSubmission>(
    TABLES.ASSESSMENT_SUBMISSIONS,
    '#assessmentId = :assessmentId',
    { ':assessmentId': assessmentId },
    { '#assessmentId': 'assessmentId' }
  );
}

export async function getSubmissionsByUser(userId: string): Promise<AssessmentSubmission[]> {
  return scanItems<AssessmentSubmission>(
    TABLES.ASSESSMENT_SUBMISSIONS,
    '#userId = :userId',
    { ':userId': userId },
    { '#userId': 'userId' }
  );
}

