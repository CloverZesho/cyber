'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Modal from '@/components/Modal';
import { Assessment, Question, Answer, DomainScore, IdentifiedRisk, AssessmentSubmission } from '@/types/database';

export default function AssessmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<string>('all');
  const [submissionResult, setSubmissionResult] = useState<AssessmentSubmission | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [aiReport, setAiReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { fetchAssessment(); }, [id]);

  const fetchAssessment = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/assessments/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load assessment');
        return;
      }

      if (!data.assessment) {
        setError('Assessment not found or you do not have access to it');
        return;
      }

      setAssessment(data.assessment);
      // Initialize answers from existing progress if any
      if (data.progress?.answers) {
        const answerMap: Record<string, Answer> = {};
        data.progress.answers.forEach((a: Answer) => { answerMap[a.questionId] = a; });
        setAnswers(answerMap);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to server. Please try again.');
    }
    finally { setLoading(false); }
  };

  // Handle Yes/No answer
  const handleYesNoAnswer = (question: Question, option: string) => {
    const isYes = option === 'Yes';
    const isNo = option === 'No';
    const correctAnswer = question.correctAnswer;
    const isCorrect = correctAnswer ? (correctAnswer === (isYes ? '1' : '2')) : isYes;
    const score = isCorrect ? question.weight * 5 : 0;
    const maxScore = question.weight * 5;

    const answer: Answer = {
      questionId: question.id,
      questionText: question.text,
      questionType: 'yes_no',
      selectedOption: option,
      isCorrect,
      score,
      maxScore,
      weight: question.weight,
      domain: question.domain,
      flaggedAsRisk: isNo || !isCorrect,
      answeredAt: new Date().toISOString(),
    };
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
  };

  // Handle Single Choice answer
  const handleSingleChoiceAnswer = (question: Question, optionId: string) => {
    const selectedOpt = question.options?.find(o => o.id === optionId);
    const isCorrect = selectedOpt?.isCorrect || false;
    const score = isCorrect ? question.weight * 5 : 0;
    const maxScore = question.weight * 5;

    const answer: Answer = {
      questionId: question.id,
      questionText: question.text,
      questionType: 'single_choice',
      selectedOption: optionId,
      isCorrect,
      score,
      maxScore,
      weight: question.weight,
      domain: question.domain,
      flaggedAsRisk: !isCorrect,
      answeredAt: new Date().toISOString(),
    };
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
  };

  // Handle Multiple Choice answer
  const handleMultipleChoiceAnswer = (question: Question, optionId: string, checked: boolean) => {
    const currentAnswer = answers[question.id];
    const currentSelected = currentAnswer?.selectedOptions || [];
    const newSelected = checked
      ? [...currentSelected, optionId]
      : currentSelected.filter(id => id !== optionId);

    // Check if all correct options are selected and no incorrect ones
    const correctOptionIds = question.options?.filter(o => o.isCorrect).map(o => o.id) || [];
    const allCorrectSelected = correctOptionIds.every(id => newSelected.includes(id));
    const noIncorrectSelected = newSelected.every(id => correctOptionIds.includes(id));
    const isCorrect = allCorrectSelected && noIncorrectSelected && newSelected.length > 0;

    const score = isCorrect ? question.weight * 5 : 0;
    const maxScore = question.weight * 5;

    const answer: Answer = {
      questionId: question.id,
      questionText: question.text,
      questionType: 'multiple_choice',
      selectedOptions: newSelected,
      isCorrect,
      score,
      maxScore,
      weight: question.weight,
      domain: question.domain,
      flaggedAsRisk: !isCorrect && newSelected.length > 0,
      answeredAt: new Date().toISOString(),
    };
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
  };

  // Handle Text answer
  const handleTextAnswer = (question: Question, text: string) => {
    const expectedAnswer = question.correctTextAnswer?.toLowerCase().trim() || '';
    const userAnswer = text.toLowerCase().trim();
    // Simple matching - check if user answer contains expected keywords
    const isCorrect = expectedAnswer ? userAnswer.includes(expectedAnswer) || expectedAnswer.includes(userAnswer) : true;
    const score = isCorrect ? question.weight * 5 : 0;
    const maxScore = question.weight * 5;

    const answer: Answer = {
      questionId: question.id,
      questionText: question.text,
      questionType: 'text',
      textAnswer: text,
      isCorrect,
      score,
      maxScore,
      weight: question.weight,
      domain: question.domain,
      flaggedAsRisk: !isCorrect && text.length > 0,
      answeredAt: new Date().toISOString(),
    };
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
  };

  const calculateScores = (): { overall: { score: number; max: number; percentage: number }; domains: DomainScore[]; risks: IdentifiedRisk[] } => {
    const domainMap: Record<string, { score: number; max: number; answered: number; total: number; risks: number }> = {};
    const risks: IdentifiedRisk[] = [];

    assessment?.questions.forEach(q => {
      if (!domainMap[q.domain]) domainMap[q.domain] = { score: 0, max: 0, answered: 0, total: 0, risks: 0 };
      domainMap[q.domain].total++;

      const answer = answers[q.id];
      if (answer) {
        domainMap[q.domain].answered++;
        domainMap[q.domain].score += answer.score;
        domainMap[q.domain].max += answer.maxScore;

        if (answer.flaggedAsRisk) {
          domainMap[q.domain].risks++;
          risks.push({
            questionId: q.id, questionText: q.text, domain: q.domain, score: answer.score,
            riskLevel: q.weight >= 4 ? 'High' : q.weight >= 2 ? 'Medium' : 'Low',
            flaggedAt: answer.answeredAt || new Date().toISOString(),
            addedToRiskRegister: false,
          });
        }
      }
    });

    const domains: DomainScore[] = Object.entries(domainMap).map(([domain, data]) => ({
      domain, score: data.score, maxScore: data.max,
      percentage: data.max > 0 ? Math.round((data.score / data.max) * 100) : 0,
      questionsAnswered: data.answered, totalQuestions: data.total, risksIdentified: data.risks,
    }));

    const totalScore = domains.reduce((sum, d) => sum + d.score, 0);
    const totalMax = domains.reduce((sum, d) => sum + d.maxScore, 0);
    return {
      overall: { score: totalScore, max: totalMax, percentage: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0 },
      domains, risks,
    };
  };

  const getMaturityLevel = (percentage: number): 'Critical' | 'Low' | 'Medium' | 'High' | 'Excellent' => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 70) return 'High';
    if (percentage >= 50) return 'Medium';
    if (percentage >= 30) return 'Low';
    return 'Critical';
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    setSubmitting(true);
    setGeneratingReport(true);
    const scores = calculateScores();

    try {
      // Add risks to risk register
      for (const risk of scores.risks) {
        if (!risk.addedToRiskRegister) {
          await fetch('/api/risks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Risk: ${risk.questionText.substring(0, 50)}...`,
              description: `Identified from assessment "${assessment.title}" - Question: ${risk.questionText}`,
              category: risk.domain,
              likelihood: risk.riskLevel === 'High' ? 'High' : risk.riskLevel === 'Medium' ? 'Medium' : 'Low',
              impact: risk.riskLevel === 'High' ? 'High' : risk.riskLevel === 'Medium' ? 'Medium' : 'Low',
              status: 'active',
              source: 'user',
            }),
          });
        }
      }

      // Submit assessment
      const res = await fetch(`/api/assessments/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.values(answers),
          overallScore: scores.overall.score,
          maxPossibleScore: scores.overall.max,
          overallPercentage: scores.overall.percentage,
          maturityLevel: getMaturityLevel(scores.overall.percentage),
          domainScores: scores.domains,
          risksIdentified: scores.risks,
          totalRisks: scores.risks.length,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmissionResult(data.submission);
        setShowResultsModal(true);

        // Auto-generate AI report and save to admin reports
        try {
          const reportRes = await fetch('/api/ai/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              submission: data.submission,
              assessmentTitle: assessment.title,
              saveToAdminReports: true
            }),
          });
          if (reportRes.ok) {
            const reportData = await reportRes.json();
            setAiReport(reportData.report);
          }
        } catch (reportError) {
          console.error('Report generation error:', reportError);
        }
      }
    } catch (error) { console.error('Submit error:', error); }
    finally {
      setSubmitting(false);
      setGeneratingReport(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!submissionResult) return;
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission: submissionResult }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data.report);
      }
    } catch (error) { console.error('Report error:', error); }
    finally { setGeneratingReport(false); }
  };

  const scores = calculateScores();
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = assessment?.questions.length || 0;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const filteredQuestions = assessment?.questions.filter(q => currentDomain === 'all' || q.domain === currentDomain) || [];
  const uniqueDomains = Array.from(new Set(assessment?.questions.map(q => q.domain) || []));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  if (error) return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Assessment</h2>
      <p className="text-gray-500 mb-4">{error}</p>
      <div className="flex gap-3 justify-center">
        <button type="button" onClick={() => router.back()} className="btn-secondary">← Go Back</button>
        <button type="button" onClick={fetchAssessment} className="btn-primary">Try Again</button>
      </div>
    </div>
  );

  if (!assessment) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Assessment not found</p>
      <button type="button" onClick={() => router.back()} className="btn-secondary mt-4">← Go Back</button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <button type="button" onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
          <p className="text-gray-600">{assessment.description}</p>
        </div>
        <div className="flex gap-2">
          {answeredCount > 0 && (
            <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting...' : `Submit Assessment (${answeredCount}/${totalQuestions})`}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50"><div className="text-2xl font-bold text-blue-700">{progress}%</div><div className="text-sm text-blue-600">Progress</div></div>
        <div className="card bg-purple-50"><div className="text-2xl font-bold text-purple-700">{answeredCount}/{totalQuestions}</div><div className="text-sm text-purple-600">Answered</div></div>
        <div className="card bg-orange-50"><div className="text-2xl font-bold text-orange-700">{uniqueDomains.length}</div><div className="text-sm text-orange-600">Domains</div></div>
        <div className="card bg-gray-50"><div className="text-2xl font-bold text-gray-700">{totalQuestions - answeredCount}</div><div className="text-sm text-gray-600">Remaining</div></div>
      </div>

      <div className="h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} /></div>

      {/* Domain Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setCurrentDomain('all')} className={`module-tab whitespace-nowrap ${currentDomain === 'all' ? 'module-tab-active' : 'module-tab-inactive'}`}>All ({totalQuestions})</button>
        {uniqueDomains.map(d => (
          <button key={d} onClick={() => setCurrentDomain(d)} className={`module-tab whitespace-nowrap ${currentDomain === d ? 'module-tab-active' : 'module-tab-inactive'}`}>
            {d} ({assessment.questions.filter(q => q.domain === d).length})
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filteredQuestions.map((q, idx) => {
          const answer = answers[q.id];
          const qType = q.type || 'yes_no';
          return (
            <div key={q.id} className={`card border-l-4 ${answer ? 'border-l-primary-500' : 'border-l-gray-300'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{q.domain}</span>
                    <span className="text-xs text-gray-400">Weight: {q.weight}/5</span>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {qType === 'yes_no' ? 'Yes/No' : qType === 'single_choice' ? 'Single Choice' : qType === 'multiple_choice' ? 'Multiple Choice' : 'Text'}
                    </span>
                    {answer && <span className="text-xs text-green-600 font-medium">✓ Answered</span>}
                  </div>
                  <p className="font-medium text-gray-900 mb-3">{idx + 1}. {q.text}</p>

                  {/* Yes/No Question */}
                  {qType === 'yes_no' && (
                    <div className="flex gap-2">
                      {['Yes', 'No'].map(opt => (
                        <button type="button" key={opt} onClick={() => handleYesNoAnswer(q, opt)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            answer?.selectedOption === opt
                              ? (opt === 'Yes' ? 'bg-green-600 text-white' : 'bg-red-600 text-white')
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Single Choice Question */}
                  {qType === 'single_choice' && q.options && (
                    <div className="space-y-2">
                      {q.options.map(opt => (
                        <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          answer?.selectedOption === opt.id ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}>
                          <input type="radio" name={`q-${q.id}`} checked={answer?.selectedOption === opt.id}
                            onChange={() => handleSingleChoiceAnswer(q, opt.id)} className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Multiple Choice Question */}
                  {qType === 'multiple_choice' && q.options && (
                    <div className="space-y-2">
                      {q.options.map(opt => (
                        <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          answer?.selectedOptions?.includes(opt.id) ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}>
                          <input type="checkbox" checked={answer?.selectedOptions?.includes(opt.id) || false}
                            onChange={(e) => handleMultipleChoiceAnswer(q, opt.id, e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-sm">{opt.text}</span>
                        </label>
                      ))}
                      <p className="text-xs text-gray-500">Select all that apply</p>
                    </div>
                  )}

                  {/* Text Question */}
                  {qType === 'text' && (
                    <div>
                      <textarea value={answer?.textAnswer || ''} onChange={(e) => handleTextAnswer(q, e.target.value)}
                        placeholder="Type your answer here..." rows={3}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalQuestions === 0 && <div className="card text-center py-12"><p className="text-gray-500">No questions available for this assessment.</p></div>}

      {/* Results Modal */}
      <Modal isOpen={showResultsModal} onClose={() => setShowResultsModal(false)} title="Assessment Results" size="xl">
        {submissionResult && (
          <div className="space-y-6">
            <div className="text-center p-6 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg">
              <div className="text-5xl font-bold text-primary-700">{submissionResult.overallPercentage}%</div>
              <div className="text-lg text-gray-600 mt-2">Overall Score</div>
              <div className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-medium ${submissionResult.maturityLevel === 'Excellent' ? 'bg-green-100 text-green-800' : submissionResult.maturityLevel === 'High' ? 'bg-blue-100 text-blue-800' : submissionResult.maturityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {submissionResult.maturityLevel} Maturity
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Domain Scores</h3>
              <div className="space-y-3">
                {submissionResult.domainScores.map(d => (
                  <div key={d.domain} className="flex items-center gap-4">
                    <div className="w-40 text-sm font-medium text-gray-700">{d.domain}</div>
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${d.percentage >= 70 ? 'bg-green-500' : d.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${d.percentage}%` }} />
                    </div>
                    <div className="w-16 text-sm text-right">{d.percentage}%</div>
                    {d.risksIdentified > 0 && <span className="text-xs text-red-600">⚠️ {d.risksIdentified}</span>}
                  </div>
                ))}
              </div>
            </div>

            {submissionResult.risksIdentified.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Flagged Risks ({submissionResult.totalRisks})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {submissionResult.risksIdentified.map(r => (
                    <div key={r.questionId} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${r.riskLevel === 'High' ? 'bg-red-600 text-white' : r.riskLevel === 'Medium' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-white'}`}>{r.riskLevel}</span>
                        <span className="text-xs text-gray-500">{r.domain}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{r.questionText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button onClick={() => setShowResultsModal(false)} className="btn-secondary flex-1">Close</button>
              <button onClick={handleGenerateReport} disabled={generatingReport} className="btn-primary flex-1">
                {generatingReport ? 'Generating...' : '🤖 Generate AI Report'}
              </button>
            </div>

            {aiReport && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-3">🤖 AI-Generated Report</h3>
                <div className="prose prose-sm max-w-none">
                  <h4>Executive Summary</h4>
                  <p>{(aiReport as { executiveSummary?: string }).executiveSummary}</p>
                  {(aiReport as { recommendations?: string[] }).recommendations && (
                    <>
                      <h4>Recommendations</h4>
                      <ul>
                        {((aiReport as { recommendations?: string[] }).recommendations || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                    </>
                  )}
                  <h4>Conclusion</h4>
                  <p>{(aiReport as { conclusion?: string }).conclusion}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
