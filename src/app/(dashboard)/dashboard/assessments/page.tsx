'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Assessment, AssessmentProgress } from '@/types/database';

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [progress, setProgress] = useState<Record<string, AssessmentProgress>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      // Fetch only assigned assessments for the user
      const res = await fetch('/api/assessments?assigned=true');
      const data = await res.json();
      setAssessments(data.assessments || []);

      // Fetch progress for each assessment
      const progressMap: Record<string, AssessmentProgress> = {};
      for (const assessment of data.assessments || []) {
        try {
          const progressRes = await fetch(`/api/assessments/${assessment.id}/progress`);
          if (progressRes.ok) {
            const progressData = await progressRes.json();
            if (progressData.progress) {
              progressMap[assessment.id] = progressData.progress;
            }
          }
        } catch (e) {
          // No progress yet
        }
      }
      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressStatus = (assessmentId: string): 'not_started' | 'in_progress' | 'completed' => {
    const p = progress[assessmentId];
    if (!p) return 'not_started';
    return p.status;
  };

  const filteredAssessments = assessments.filter((a) => {
    if (filter === 'all') return true;
    return getProgressStatus(a.id) === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading assessments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 My Assessments</h1>
          <p className="text-gray-600">Complete the assessments assigned to you</p>
        </div>
        <button type="button" onClick={() => router.push('/dashboard/assessments/history')} className="btn-secondary">
          📊 View History
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'not_started', 'in_progress', 'completed'] as const).map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => setFilter(f)}
            className={`module-tab whitespace-nowrap ${filter === f ? 'module-tab-active' : 'module-tab-inactive'}`}
          >
            {f === 'all' ? 'All' : getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Assessment Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssessments.map((assessment) => {
          const status = getProgressStatus(assessment.id);
          const prog = progress[assessment.id];
          return (
            <div
              key={assessment.id}
              onClick={() => router.push(`/dashboard/assessments/${assessment.id}`)}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{assessment.title}</h3>
                <span className={`status-badge ${getStatusColor(status)}`}>
                  {getStatusLabel(status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assessment.description}</p>

              {/* Progress Bar */}
              {prog && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{prog.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${status === 'completed' ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${prog.progress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{assessment.questions?.length || 0} questions</span>
                <span>ID: {assessment.customId}</span>
              </div>
              <div className="mt-3 pt-3 border-t flex gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/assessments/${assessment.id}`); }}
                  className={`text-xs py-1 px-3 flex-1 ${status === 'completed' ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {status === 'completed' ? 'View Results' : status === 'in_progress' ? 'Continue' : 'Start Assessment'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssessments.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No assessments assigned to you yet</p>
          <p className="text-sm text-gray-400 mt-2">Contact your admin to get assessments assigned</p>
        </div>
      )}
    </div>
  );
}

