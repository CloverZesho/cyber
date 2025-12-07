'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';

interface Report {
  id: string;
  assessmentTitle: string;
  overallScore: number;
  identifiedRisks: string[];
  recommendations: string[];
  generatedAt: string;
  userId: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'recent' | 'high-risk'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReports = () => {
    if (filter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return reports.filter(r => new Date(r.generatedAt) >= oneWeekAgo);
    }
    if (filter === 'high-risk') {
      return reports.filter(r => r.identifiedRisks && r.identifiedRisks.length > 0);
    }
    return reports;
  };

  const filteredReports = getFilteredReports();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📈 Assessment Reports</h1>
        <p className="text-gray-600">View all generated assessment reports</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Reports' },
          { key: 'recent', label: 'Recent (7 days)' },
          { key: 'high-risk', label: 'High Risk' },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition
              ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedReport(report)}>
              <h3 className="font-semibold text-lg mb-2">{report.assessmentTitle}</h3>
              <div className="flex items-center gap-4 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.overallScore)}`}>
                  Score: {report.overallScore}%
                </span>
                {report.identifiedRisks?.length > 0 && (
                  <span className="text-red-600 text-sm">⚠️ {report.identifiedRisks.length} risks</span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Generated: {new Date(report.generatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredReports.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">📈</div>
          <p className="text-gray-500">No reports found</p>
        </div>
      )}

      {/* Report Detail Modal */}
      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title={selectedReport?.assessmentTitle || ''} size="lg">
        {selectedReport && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(selectedReport.overallScore)}`}>
                {selectedReport.overallScore}%
              </div>
              <div>
                <p className="font-medium">Overall Score</p>
                <p className="text-sm text-gray-500">Generated {new Date(selectedReport.generatedAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedReport.identifiedRisks?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">⚠️ Identified Risks</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700 bg-red-50 p-4 rounded-lg">
                  {selectedReport.identifiedRisks.map((risk, i) => <li key={i}>{risk}</li>)}
                </ul>
              </div>
            )}

            {selectedReport.recommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">💡 Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700 bg-green-50 p-4 rounded-lg">
                  {selectedReport.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

