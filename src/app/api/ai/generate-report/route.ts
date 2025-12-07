import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { AssessmentSubmission, DomainScore, IdentifiedRisk } from '@/types/database';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission }: { submission: AssessmentSubmission } = await request.json();

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = buildReportPrompt(submission);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity compliance expert. Generate professional, detailed assessment reports in JSON format. Be specific with recommendations and risk analysis.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parse the JSON response
    let report;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      report = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      report = { executiveSummary: content, domainAnalysis: [], recommendations: [], conclusion: '' };
    }

    return NextResponse.json({
      report: {
        id: crypto.randomUUID(),
        assessmentId: submission.assessmentId,
        submissionId: submission.id,
        userId: user.userId,
        generatedAt: new Date().toISOString(),
        overallScore: submission.overallScore,
        overallPercentage: submission.overallPercentage,
        domainScores: submission.domainScores,
        ...report,
        flaggedRisks: submission.risksIdentified,
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildReportPrompt(submission: AssessmentSubmission): string {
  const domainSummary = submission.domainScores.map((d: DomainScore) => 
    `- ${d.domain}: ${d.percentage}% (${d.score}/${d.maxScore}), ${d.risksIdentified} risks`
  ).join('\n');

  const riskList = submission.risksIdentified.map((r: IdentifiedRisk) => 
    `- [${r.riskLevel}] ${r.domain}: ${r.questionText}`
  ).join('\n');

  return `Generate a comprehensive cybersecurity assessment report in JSON format for:

Company: ${submission.companyName}
Assessment: ${submission.assessmentTitle}
Date: ${submission.completedAt || submission.submittedAt}
Overall Score: ${submission.overallPercentage}% (${submission.overallScore}/${submission.maxPossibleScore})
Maturity Level: ${submission.maturityLevel}
Total Risks Identified: ${submission.totalRisks}

DOMAIN SCORES:
${domainSummary}

FLAGGED RISKS (Questions answered "No"):
${riskList || 'None identified'}

Generate a JSON report with:
{
  "executiveSummary": "2-3 paragraph executive summary of the assessment results",
  "domainAnalysis": [
    { "domain": "Domain Name", "analysis": "Analysis of performance", "recommendations": ["Specific recommendations"] }
  ],
  "riskSummary": "Summary of all identified risks and their impact",
  "recommendations": ["Top 5-10 prioritized recommendations"],
  "conclusion": "Concluding remarks and next steps"
}`;
}

