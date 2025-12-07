import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

// Table names with optional prefix
const prefix = process.env.DYNAMODB_TABLE_PREFIX || '';

export const TABLES = {
  USERS: `${prefix}Users`,
  ASSESSMENTS: `${prefix}Assessments`,
  ASSESSMENT_PROGRESS: `${prefix}AssessmentProgress`,
  ASSESSMENT_SUBMISSIONS: `${prefix}AssessmentSubmissions`,
  TEMPLATES: `${prefix}Templates`,
  RISKS: `${prefix}Risks`,
  ASSETS: `${prefix}Assets`,
  FRAMEWORKS: `${prefix}Frameworks`,
  CONTROLS: `${prefix}Controls`,
  DPIAS: `${prefix}DPIAs`,
  REPORTS: `${prefix}Reports`,
  SETTINGS: `${prefix}Settings`,
} as const;

// Export dynamoDb client for direct use
export const dynamoDb = docClient;

export type TableName = typeof TABLES[keyof typeof TABLES];

