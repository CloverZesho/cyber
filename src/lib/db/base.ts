import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TableName } from '../dynamodb';
import { v4 as uuidv4 } from 'uuid';

export interface QueryOptions {
  indexName?: string;
  keyConditionExpression?: string;
  filterExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
  limit?: number;
}

// Create a new item
export async function createItem<T extends { id?: string }>(
  tableName: TableName,
  item: T
): Promise<T & { id: string }> {
  const timestamp = new Date().toISOString();
  const newItem = {
    ...item,
    id: item.id || uuidv4(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: newItem,
    })
  );

  return newItem as T & { id: string };
}

// Get item by ID
export async function getItem<T>(
  tableName: TableName,
  id: string
): Promise<T | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { id },
    })
  );

  return (result.Item as T) || null;
}

// Update an item
export async function updateItem<T>(
  tableName: TableName,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  const timestamp = new Date().toISOString();
  const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
  const expressionAttributeNames: Record<string, string> = {
    '#updatedAt': 'updatedAt',
  };
  const expressionAttributeValues: Record<string, unknown> = {
    ':updatedAt': timestamp,
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'createdAt') {
      const attrName = `#${key}`;
      const attrValue = `:${key}`;
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    }
  });

  const result = await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return (result.Attributes as T) || null;
}

// Delete an item
export async function deleteItem(
  tableName: TableName,
  id: string
): Promise<boolean> {
  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { id },
    })
  );

  return true;
}

// Scan all items (with optional filter)
export async function scanItems<T>(
  tableName: TableName,
  filterExpression?: string,
  expressionAttributeValues?: Record<string, unknown>,
  expressionAttributeNames?: Record<string, string>
): Promise<T[]> {
  const params: { TableName: string; FilterExpression?: string; ExpressionAttributeValues?: Record<string, unknown>; ExpressionAttributeNames?: Record<string, string> } = {
    TableName: tableName,
  };

  if (filterExpression) {
    params.FilterExpression = filterExpression;
    params.ExpressionAttributeValues = expressionAttributeValues;
    params.ExpressionAttributeNames = expressionAttributeNames;
  }

  const result = await docClient.send(new ScanCommand(params));
  return (result.Items as T[]) || [];
}

// Query items by index
export async function queryItems<T>(
  tableName: TableName,
  options: QueryOptions
): Promise<T[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: options.indexName,
      KeyConditionExpression: options.keyConditionExpression,
      FilterExpression: options.filterExpression,
      ExpressionAttributeNames: options.expressionAttributeNames,
      ExpressionAttributeValues: options.expressionAttributeValues,
      Limit: options.limit,
    })
  );

  return (result.Items as T[]) || [];
}

// Generate custom ID (5-digit number)
export function generateCustomId(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

