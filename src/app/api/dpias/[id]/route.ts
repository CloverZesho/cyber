import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDPIA, updateDPIA, deleteDPIA } from '@/lib/db/dpias';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const dpia = await getDPIA(id);

    if (!dpia) {
      return NextResponse.json({ error: 'DPIA not found' }, { status: 404 });
    }

    return NextResponse.json({ dpia });
  } catch (error) {
    console.error('Get DPIA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const dpia = await updateDPIA(id, data);

    if (!dpia) {
      return NextResponse.json({ error: 'DPIA not found' }, { status: 404 });
    }

    return NextResponse.json({ dpia });
  } catch (error) {
    console.error('Update DPIA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteDPIA(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete DPIA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

