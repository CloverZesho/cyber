import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createAssessment, getAllAssessments } from '@/lib/db/assessments';
import { Assessment } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignedOnly = searchParams.get('assigned') === 'true';

    // Admin sees all assessments
    if (user.role === 'admin') {
      const assessments = await getAllAssessments();
      return NextResponse.json({ assessments });
    }

    // Regular users only see published or specifically assigned assessments
    const allAssessments = await getAllAssessments();
    const userAssessments = allAssessments.filter((a: Assessment) => {
      // Published to all users
      if (a.status === 'published') return true;

      // Specifically assigned to this user
      if (a.status === 'assigned' && a.assignedUsers) {
        return a.assignedUsers.some(u => u.id === user.userId || u.email === user.email);
      }

      return false;
    });

    return NextResponse.json({ assessments: userAssessments });
  } catch (error) {
    console.error('Get assessments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can create assessments
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admin can create assessments' }, { status: 403 });
    }

    const data = await request.json();
    const assessment = await createAssessment({
      ...data,
      userId: user.userId,
    });

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error) {
    console.error('Create assessment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

