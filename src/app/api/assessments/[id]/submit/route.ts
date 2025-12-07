import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getUser } from '@/lib/db/users';
import {
  createAssessmentSubmission,
  saveAssessmentProgress,
  getAssessment
} from '@/lib/db/assessments';
import { Answer, DomainScore, IdentifiedRisk, AssessmentTimelineEntry } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const data = await request.json();
    const user = await getUser(userPayload.userId);
    const assessment = await getAssessment(assessmentId);

    if (!user || !assessment) {
      return NextResponse.json({ error: 'User or assessment not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Use pre-calculated scores from client or calculate if not provided
    const answers: Answer[] = data.answers || [];
    const overallScore: number = data.overallScore || 0;
    const maxPossibleScore: number = data.maxPossibleScore || 0;
    const overallPercentage: number = data.overallPercentage || 0;
    const maturityLevel: 'Critical' | 'Low' | 'Medium' | 'High' | 'Excellent' = data.maturityLevel || 'Critical';
    const domainScores: DomainScore[] = data.domainScores || [];
    const risksIdentified: IdentifiedRisk[] = data.risksIdentified || [];
    const totalRisks: number = data.totalRisks || 0;

    // Create timeline entry
    const timelineEntry: AssessmentTimelineEntry = {
      id: crypto.randomUUID(),
      assessmentId,
      userId: user.id,
      userName: user.name,
      action: 'completed',
      overallScore,
      overallPercentage,
      domainScores,
      risksIdentified: totalRisks,
      timestamp: now,
      notes: `Assessment completed with ${overallPercentage}% score. ${totalRisks} risks identified.`,
    };

    // Create submission with enhanced data
    const submission = await createAssessmentSubmission({
      assessmentId,
      assessmentTitle: assessment.title,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      companyName: user.companyName || '',
      answers,
      progress: 100,
      totalQuestions: answers.length,
      status: 'completed',
      submittedAt: now,
      startedAt: now,
      completedAt: now,
      overallScore,
      maxPossibleScore,
      overallPercentage,
      maturityLevel,
      domainScores,
      risksIdentified,
      totalRisks,
      aiReportGenerated: false,
      timeline: [timelineEntry],
    });

    // Update progress
    await saveAssessmentProgress({
      assessmentId,
      userId: user.id,
      answers,
      progress: 100,
      completed: answers.length,
      pending: 0,
      status: 'completed',
      submittedAt: now,
    });

    return NextResponse.json({
      success: true,
      submission,
      scores: { overallScore, overallPercentage, maturityLevel, domainScores },
      risksIdentified,
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

