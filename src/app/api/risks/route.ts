import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createRisk, getRisksByUser, getAllRisks } from '@/lib/db/risks';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const risks = user.role === 'admin' 
      ? await getAllRisks() 
      : await getRisksByUser(user.userId);

    return NextResponse.json({ risks });
  } catch (error) {
    console.error('Get risks error:', error);
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
    const risk = await createRisk({
      ...data,
      userId: user.userId,
      source: user.role === 'admin' ? 'admin' : 'user',
    });

    return NextResponse.json({ risk }, { status: 201 });
  } catch (error) {
    console.error('Create risk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

