import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { 
  saveAssessmentProgress, 
  getAssessmentProgressByUserAndAssessment 
} from '@/lib/db/assessments';

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
    const progress = await getAssessmentProgressByUserAndAssessment(user.userId, id);

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Get assessment progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
    
    const progress = await saveAssessmentProgress({
      ...data,
      assessmentId: id,
      userId: user.userId,
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Save assessment progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

