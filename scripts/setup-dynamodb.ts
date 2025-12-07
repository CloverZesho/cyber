/**
 * AWS DynamoDB Table Setup Script
 * Run with: npx ts-node scripts/setup-dynamodb.ts
 */

import { DynamoDBClient, CreateTableCommand, ListTablesCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const prefix = process.env.DYNAMODB_TABLE_PREFIX || 'CyberWheelhouse_';

const tables = [
  {
    TableName: `${prefix}Users`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' as const },
      { AttributeName: 'email', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' as const }],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${prefix}Assessments`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' as const },
      { AttributeName: 'ownerId', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ownerId-index',
        KeySchema: [{ AttributeName: 'ownerId', KeyType: 'HASH' as const }],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${prefix}Risks`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' as const },
      { AttributeName: 'ownerId', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ownerId-index',
        KeySchema: [{ AttributeName: 'ownerId', KeyType: 'HASH' as const }],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${prefix}Assets`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' as const },
      { AttributeName: 'ownerId', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ownerId-index',
        KeySchema: [{ AttributeName: 'ownerId', KeyType: 'HASH' as const }],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${prefix}Frameworks`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' as const }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${prefix}Controls`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' as const },
      { AttributeName: 'frameworkId', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'frameworkId-index',
        KeySchema: [{ AttributeName: 'frameworkId', KeyType: 'HASH' as const }],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${prefix}DPIAs`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' as const },
      { AttributeName: 'ownerId', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ownerId-index',
        KeySchema: [{ AttributeName: 'ownerId', KeyType: 'HASH' as const }],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${prefix}AssessmentProgress`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' as const }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${prefix}AssessmentSubmissions`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' as const }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${prefix}Reports`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' as const }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${prefix}Settings`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' as const }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
];

async function createTables() {
  console.log('🚀 Starting DynamoDB table setup...\n');

  const existingTables = await client.send(new ListTablesCommand({}));
  const existingTableNames = existingTables.TableNames || [];

  for (const table of tables) {
    if (existingTableNames.includes(table.TableName)) {
      console.log(`✅ Table ${table.TableName} already exists`);
      continue;
    }

    try {
      await client.send(new CreateTableCommand(table));
      console.log(`✅ Created table: ${table.TableName}`);
    } catch (error) {
      console.error(`❌ Error creating ${table.TableName}:`, error);
    }
  }

  console.log('\n🎉 DynamoDB setup complete!');
}

createTables().catch(console.error);

