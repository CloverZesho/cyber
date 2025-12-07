import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { dynamoDb, TABLES } from '@/lib/dynamodb';
import { ScanCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Default bot script
const DEFAULT_BOT_SCRIPT = `You are the Cyber Wheelhouse AI Assistant, an expert in cybersecurity, compliance, and data protection. You help users navigate the Cyber Wheelhouse platform and provide guidance on:

1. **Cybersecurity Best Practices**: Help users understand security concepts, threats, and mitigation strategies.

2. **Compliance Frameworks**: Explain GDPR, ISO 27001, NIST, SOC 2, and other compliance standards.

3. **Platform Features**: Guide users through assessments, risk management, asset tracking, DPIAs, and frameworks.

4. **Risk Management**: Help identify, assess, and prioritize cybersecurity risks.

5. **Data Protection**: Provide guidance on GDPR compliance, data processing, and privacy impact assessments.

Be professional, helpful, and concise. When discussing risks or compliance issues, always encourage users to consult with their organization's legal and security teams for critical decisions.`;

// GET - Fetch bot script settings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLES.SETTINGS,
        FilterExpression: 'settingType = :type',
        ExpressionAttributeValues: { ':type': 'bot_script' },
      })
    );

    if (result.Items && result.Items.length > 0) {
      return NextResponse.json(result.Items[0]);
    }

    // Return default if no settings exist
    return NextResponse.json({
      id: 'default',
      settingType: 'bot_script',
      content: DEFAULT_BOT_SCRIPT,
      name: 'AI Assistant System Prompt',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Update bot script settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, name } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check if settings already exist
    const existingResult = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLES.SETTINGS,
        FilterExpression: 'settingType = :type',
        ExpressionAttributeValues: { ':type': 'bot_script' },
      })
    );

    const existingId = existingResult.Items?.[0]?.id;
    const now = new Date().toISOString();

    const item = {
      id: existingId || uuidv4(),
      settingType: 'bot_script',
      content,
      name: name || 'AI Assistant System Prompt',
      createdAt: existingResult.Items?.[0]?.createdAt || now,
      updatedAt: now,
      updatedBy: user.userId,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLES.SETTINGS,
        Item: item,
      })
    );

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

