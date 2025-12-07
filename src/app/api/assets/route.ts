import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createAsset, getAssetsByUser, getAllAssets } from '@/lib/db/assets';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assets = user.role === 'admin' 
      ? await getAllAssets() 
      : await getAssetsByUser(user.userId);

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Get assets error:', error);
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
    const asset = await createAsset({
      ...data,
      userId: user.userId,
      source: user.role === 'admin' ? 'admin' : 'user',
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error('Create asset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

