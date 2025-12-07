import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createDPIA, getDPIAsByUser, getAllDPIAs } from '@/lib/db/dpias';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dpias = user.role === 'admin' 
      ? await getAllDPIAs() 
      : await getDPIAsByUser(user.userId);

    return NextResponse.json({ dpias });
  } catch (error) {
    console.error('Get DPIAs error:', error);
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
    const dpia = await createDPIA({
      ...data,
      userId: user.userId,
    });

    return NextResponse.json({ dpia }, { status: 201 });
  } catch (error) {
    console.error('Create DPIA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

