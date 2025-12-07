'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AssessmentSubmission } from '@/types/database';

export default function AssessmentHistoryPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Critical' | 'Low' | 'Medium' | 'High' | 'Excellent'>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/assessments/submissions');
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    filter === 'all' ? true : s.maturityLevel === filter
  );

  const getMaturityColor = (level: string) => {
    switch (level) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'High': return 'bg-blue-100 text-blue-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading history...</div></div>;
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button type="button" onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">📊 Assessment History</h1>
          <p className="text-gray-600">Track your assessment progress over time</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'Excellent', 'High', 'Medium', 'Low', 'Critical'] as const).map((f) => (
          <button type="button" key={f} onClick={() => setFilter(f)} className={`module-tab whitespace-nowrap ${filter === f ? 'module-tab-active' : 'module-tab-inactive'}`}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50">
          <div className="text-2xl font-bold text-blue-700">{submissions.length}</div>
          <div className="text-sm text-blue-600">Total Assessments</div>
        </div>
        <div className="card bg-green-50">
          <div className="text-2xl font-bold text-green-700">
            {submissions.length > 0 ? Math.round(submissions.reduce((sum, s) => sum + s.overallPercentage, 0) / submissions.length) : 0}%
          </div>
          <div className="text-sm text-green-600">Avg Score</div>
        </div>
        <div className="card bg-red-50">
          <div className="text-2xl font-bold text-red-700">
            {submissions.reduce((sum, s) => sum + s.totalRisks, 0)}
          </div>
          <div className="text-sm text-red-600">Total Risks</div>
        </div>
        <div className="card bg-purple-50">
          <div className="text-2xl font-bold text-purple-700">
            {submissions.filter(s => s.maturityLevel === 'Excellent' || s.maturityLevel === 'High').length}
          </div>
          <div className="text-sm text-purple-600">High Performers</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredSubmissions.map((submission) => (
          <div key={submission.id} className="card border-l-4 border-l-primary-500">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{submission.assessmentTitle}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMaturityColor(submission.maturityLevel)}`}>
                    {submission.maturityLevel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>📅 {new Date(submission.completedAt || submission.submittedAt || '').toLocaleDateString()}</span>
                  <span>📊 Score: {submission.overallPercentage}%</span>
                  <span>⚠️ Risks: {submission.totalRisks}</span>
                  <span>🏢 {submission.companyName}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">{submission.overallPercentage}%</div>
                  <div className="text-xs text-gray-500">{submission.overallScore}/{submission.maxPossibleScore}</div>
                </div>
                <button type="button" onClick={() => router.push(`/dashboard/assessments/${submission.assessmentId}`)} className="btn-secondary text-sm">
                  View Details
                </button>
              </div>
            </div>

            {/* Domain Scores */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium text-gray-700 mb-2">Domain Scores</div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {submission.domainScores.slice(0, 4).map(d => (
                  <div key={d.domain} className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${d.percentage >= 70 ? 'bg-green-500' : d.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${d.percentage}%` }} />
                    </div>
                    <span className="text-xs text-gray-600 w-20 truncate">{d.domain}</span>
                    <span className="text-xs font-medium">{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSubmissions.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No assessment history found</p>
          <button type="button" onClick={() => router.push('/dashboard/assessments')} className="btn-primary mt-4">
            Take an Assessment
          </button>
        </div>
      )}
    </div>
  );
}

