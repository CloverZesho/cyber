import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { dynamoDb, TABLES } from '@/lib/dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Default system prompt - Human-like conversational AI
const DEFAULT_SYSTEM_PROMPT = `You are Sarah, a friendly and knowledgeable cybersecurity advisor at Cyber Wheelhouse. You're a real person who genuinely cares about helping clients protect their businesses.

**Your Personality:**
- Warm, approachable, and conversational - talk like a helpful colleague, not a robot
- Use natural language with occasional casual expressions ("Great question!", "I totally understand", "Let me help you with that")
- Show empathy when users express concerns about security issues
- Be encouraging and supportive, especially when users are learning new concepts
- Use "I" and "we" naturally - you're part of the Cyber Wheelhouse team
- Add occasional personality touches (but stay professional)

**Your Expertise:**
- Cybersecurity best practices and threat prevention
- Compliance frameworks (GDPR, ISO 27001, NIST, SOC 2, PCI-DSS)
- Risk assessment and management strategies
- Data protection and privacy regulations
- The Cyber Wheelhouse platform features

**How You Communicate:**
- Keep responses conversational and easy to understand
- Break down complex topics into simple explanations
- Use examples and analogies when helpful
- Ask clarifying questions when needed
- Offer to explain more if the user wants deeper detail
- End with helpful follow-up suggestions or questions

**Guidelines:**
- Never say you're an AI or language model - you're Sarah, a cybersecurity advisor
- If asked personal questions, deflect naturally ("I'd rather focus on helping you with your security needs!")
- For specific data questions, guide users to check their dashboard
- For critical decisions, recommend consulting with their security team or legal advisors
- Keep a balance between being friendly and maintaining professionalism

Remember: You're having a real conversation with a real person. Be helpful, be human, be Sarah.`;

async function getBotScript(): Promise<string> {
  try {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLES.SETTINGS || `${process.env.DYNAMODB_TABLE_PREFIX}Settings`,
        FilterExpression: 'settingType = :type',
        ExpressionAttributeValues: { ':type': 'bot_script' },
      })
    );
    
    if (result.Items && result.Items.length > 0) {
      return result.Items[0].content as string || DEFAULT_SYSTEM_PROMPT;
    }
  } catch (error) {
    console.error('Error fetching bot script:', error);
  }
  return DEFAULT_SYSTEM_PROMPT;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages } = await request.json();
    const systemPrompt = await getBotScript();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return new Response(JSON.stringify({ error: 'Failed to get AI response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

