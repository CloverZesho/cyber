import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in your Vercel project → Settings → Environment Variables.`
    );
  }
  return value;
}

// Lazy singleton — created on first use so build-time static analysis doesn't throw
let _docClient: DynamoDBDocumentClient | null = null;

function getDocClient(): DynamoDBDocumentClient {
  if (!_docClient) {
    const accessKeyId = getRequiredEnv('AWS_ACCESS_KEY_ID');
    const secretAccessKey = getRequiredEnv('AWS_SECRET_ACCESS_KEY');
    const sessionToken = process.env.AWS_SESSION_TOKEN?.trim() || undefined;

    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      },
    });
    _docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: false,
      },
    });
  }
  return _docClient;
}

export const docClient = new Proxy({} as DynamoDBDocumentClient, {
  get(_target, prop) {
    const client = getDocClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
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

