import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST() {
  try {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('Creating realtime session (GA endpoint)...');

    // Use the GA endpoint: /v1/realtime/transcription_sessions
    // This creates an ephemeral token for client-side WebSocket connection
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'sage',
      }),
    });

    const responseText = await response.text();
    console.log('OpenAI Response Status:', response.status);
    console.log('OpenAI Response:', responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create realtime session', details: responseText },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);

    // Return the client secret for WebSocket authentication
    return NextResponse.json({
      client_secret: data.client_secret,
      expires_at: data.expires_at || data.client_secret?.expires_at,
    });
  } catch (error) {
    console.error('Realtime Session API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

