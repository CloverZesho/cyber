import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createFramework, getFrameworksByUser, getAllFrameworks } from '@/lib/db/frameworks';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const frameworks = user.role === 'admin' 
      ? await getAllFrameworks() 
      : await getFrameworksByUser(user.userId);

    return NextResponse.json({ frameworks });
  } catch (error) {
    console.error('Get frameworks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const framework = await createFramework({
      ...data,
      userId: user.userId,
      source: user.role === 'admin' ? 'admin' : 'user',
      controlsData: data.controlsData || [],
    });

    return NextResponse.json({ framework }, { status: 201 });
  } catch (error) {
    console.error('Create framework error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

