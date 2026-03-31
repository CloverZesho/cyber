import { NextResponse } from 'next/server';

function isConfigured(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export async function GET() {
  const envStatus = {
    AWS_REGION: isConfigured(process.env.AWS_REGION),
    AWS_ACCESS_KEY_ID: isConfigured(process.env.AWS_ACCESS_KEY_ID),
    AWS_SECRET_ACCESS_KEY: isConfigured(process.env.AWS_SECRET_ACCESS_KEY),
    JWT_SECRET: isConfigured(process.env.JWT_SECRET),
    DYNAMODB_TABLE_PREFIX: true, // optional
  };

  const missingRequired = Object.entries(envStatus)
    .filter(([key, ok]) => key !== 'DYNAMODB_TABLE_PREFIX' && !ok)
    .map(([key]) => key);

  if (missingRequired.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Missing required environment variables',
        missing: missingRequired,
        hint: 'Set these in your Vercel project → Settings → Environment Variables',
      },
      { status: 500 }
    );
  }

  // Env vars are present — try a lightweight DynamoDB connectivity check
  try {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, ScanCommand } = await import('@aws-sdk/lib-dynamodb');

    const prefix = process.env.DYNAMODB_TABLE_PREFIX || '';
    const usersTable = `${prefix}Users`;

    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const docClient = DynamoDBDocumentClient.from(client);

    await docClient.send(
      new ScanCommand({
        TableName: usersTable,
        Limit: 1,
      })
    );

    return NextResponse.json({
      ok: true,
      environment: 'configured',
      database: 'connected',
      usersTable,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Database connectivity failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check AWS credentials, region, and DynamoDB table names in Vercel env vars',
      },
      { status: 500 }
    );
  }
}
