'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';

interface Report {
  id: string;
  title: string;
  assessmentId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  companyName?: string;
  overallScore: number;
  maturityLevel?: string;
  generatedAt: string;
  status: string;
  type: string;
  content: string; // JSON stringified full report
}

interface ParsedReportContent {
  executiveSummary?: string;
  domainAnalysis?: { domain: string; analysis: string; recommendations: string[] }[];
  recommendations?: string[];
  conclusion?: string;
  flaggedRisks?: { questionText: string; domain: string; riskLevel: string }[];
  totalRisks?: number;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'recent' | 'high-risk'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [parsedContent, setParsedContent] = useState<ParsedReportContent | null>(null);

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
      return reports.filter(r => r.overallScore < 60);
    }
    return reports;
  };

  const filteredReports = getFilteredReports();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMaturityColor = (level?: string) => {
    switch (level) {
      case 'Excellent': return 'text-green-700 bg-green-100';
      case 'High': return 'text-blue-700 bg-blue-100';
      case 'Medium': return 'text-yellow-700 bg-yellow-100';
      case 'Low': return 'text-orange-700 bg-orange-100';
      case 'Critical': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    try {
      const parsed = JSON.parse(report.content);
      setParsedContent(parsed);
    } catch {
      setParsedContent(null);
    }
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
              onClick={() => handleSelectReport(report)}>
              <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.overallScore)}`}>
                  {report.overallScore}%
                </span>
                {report.maturityLevel && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMaturityColor(report.maturityLevel)}`}>
                    {report.maturityLevel}
                  </span>
                )}
              </div>
              {report.userName && (
                <p className="text-sm text-gray-600 mb-1">👤 {report.userName}</p>
              )}
              {report.companyName && (
                <p className="text-sm text-gray-600 mb-2">🏢 {report.companyName}</p>
              )}
              <p className="text-xs text-gray-500">
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
          <p className="text-sm text-gray-400 mt-2">Reports are auto-generated when users complete assessments</p>
        </div>
      )}

      {/* Report Detail Modal */}
      <Modal isOpen={!!selectedReport} onClose={() => { setSelectedReport(null); setParsedContent(null); }} title={selectedReport?.title || ''} size="xl">
        {selectedReport && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Header Info */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(selectedReport.overallScore)}`}>
                {selectedReport.overallScore}%
              </div>
              <div className="flex-1">
                <p className="font-medium">{selectedReport.maturityLevel} Maturity</p>
                <p className="text-sm text-gray-500">Generated {new Date(selectedReport.generatedAt).toLocaleString()}</p>
              </div>
              {selectedReport.userName && (
                <div className="text-sm">
                  <p className="text-gray-600">👤 {selectedReport.userName}</p>
                  <p className="text-gray-500">{selectedReport.userEmail}</p>
                  {selectedReport.companyName && <p className="text-gray-600">🏢 {selectedReport.companyName}</p>}
                </div>
              )}
            </div>

            {/* Executive Summary */}
            {parsedContent?.executiveSummary && (
              <div>
                <h4 className="font-semibold mb-2">📋 Executive Summary</h4>
                <p className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg whitespace-pre-wrap">{parsedContent.executiveSummary}</p>
              </div>
            )}

            {/* Domain Analysis */}
            {parsedContent?.domainAnalysis && parsedContent.domainAnalysis.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">🎯 Domain Analysis</h4>
                <div className="space-y-3">
                  {parsedContent.domainAnalysis.map((da, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-primary-700 mb-1">{da.domain}</h5>
                      <p className="text-sm text-gray-700 mb-2">{da.analysis}</p>
                      {da.recommendations?.length > 0 && (
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {da.recommendations.map((r, j) => <li key={j}>{r}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flagged Risks */}
            {parsedContent?.flaggedRisks && parsedContent.flaggedRisks.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">⚠️ Identified Risks ({parsedContent.flaggedRisks.length})</h4>
                <ul className="space-y-2">
                  {parsedContent.flaggedRisks.slice(0, 10).map((risk, i) => (
                    <li key={i} className="text-sm p-3 bg-red-50 rounded-lg">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium mr-2
                        ${risk.riskLevel === 'Critical' ? 'bg-red-200 text-red-800' :
                          risk.riskLevel === 'High' ? 'bg-orange-200 text-orange-800' :
                          risk.riskLevel === 'Medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800'}`}>
                        {risk.riskLevel}
                      </span>
                      <span className="text-gray-700">{risk.questionText}</span>
                      <span className="text-xs text-gray-500 ml-2">({risk.domain})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {parsedContent?.recommendations && parsedContent.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">💡 Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700 bg-green-50 p-4 rounded-lg">
                  {parsedContent.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            )}

            {/* Conclusion */}
            {parsedContent?.conclusion && (
              <div>
                <h4 className="font-semibold mb-2">📝 Conclusion</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{parsedContent.conclusion}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

