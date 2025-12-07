import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getSubmissionsByUser } from '@/lib/db/assessments';
import { scanItems } from '@/lib/db/base';
import { TABLES } from '@/lib/dynamodb';
import { AssessmentSubmission } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin can see all submissions, users see only their own
    let submissions: AssessmentSubmission[];
    if (user.role === 'admin') {
      submissions = await scanItems<AssessmentSubmission>(TABLES.ASSESSMENT_SUBMISSIONS);
    } else {
      submissions = await getSubmissionsByUser(user.userId);
    }

    // Sort by date descending
    submissions.sort((a, b) => 
      new Date(b.completedAt || b.submittedAt || b.createdAt).getTime() - 
      new Date(a.completedAt || a.submittedAt || a.createdAt).getTime()
    );

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

