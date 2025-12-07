'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Risk, Asset, Framework } from '@/types/database';

type ReportData = {
  risks: Risk[]; assets: Asset[]; frameworks: Framework[];
  totalControls: number; implementedControls: number; avgCompliance: number;
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData>({ risks: [], assets: [], frameworks: [], totalControls: 0, implementedControls: 0, avgCompliance: 0 });
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<string>('');

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      const [risksRes, assetsRes, frameworksRes] = await Promise.all([fetch('/api/risks'), fetch('/api/assets'), fetch('/api/frameworks')]);
      const [risksData, assetsData, frameworksData] = await Promise.all([risksRes.json(), assetsRes.json(), frameworksRes.json()]);
      const risks = risksData.risks || []; const assets = assetsData.assets || []; const frameworks: Framework[] = frameworksData.frameworks || [];
      const totalControls = frameworks.reduce((sum, f) => sum + (f.controlsData?.length || 0), 0);
      const implementedControls = frameworks.reduce((sum, f) => sum + (f.controlsData?.filter(c => c.status === 'Implemented').length || 0), 0);
      const avgCompliance = frameworks.length ? Math.round(frameworks.reduce((sum, f) => sum + (f.compliance || 0), 0) / frameworks.length) : 0;
      setData({ risks, assets, frameworks, totalControls, implementedControls, avgCompliance });
    } catch (error) { console.error('Error:', error);
    } finally { setLoading(false); }
  };

  const openReport = (type: string) => { setReportType(type); setShowReportModal(true); };

  const getRiskScore = (likelihood: string, impact: string) => {
    const scores: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    return (scores[likelihood] || 1) * (scores[impact] || 1);
  };

  const criticalRisks = data.risks.filter(r => r.likelihood === 'Critical' || r.impact === 'Critical');
  const highRisks = data.risks.filter(r => r.likelihood === 'High' || r.impact === 'High');
  const activeAssets = data.assets.filter(a => a.status === 'active');

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading reports...</div></div>;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">📈 Reports & Analytics</h1><p className="text-gray-600">Real-time insights from your data</p></div>
      </div>

      {/* Executive Summary */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Executive Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm"><div className="text-3xl font-bold text-primary-600">{data.avgCompliance}%</div><div className="text-sm text-gray-600">Overall Compliance</div></div>
          <div className="bg-white p-4 rounded-lg shadow-sm"><div className="text-3xl font-bold text-red-600">{criticalRisks.length}</div><div className="text-sm text-gray-600">Critical Risks</div></div>
          <div className="bg-white p-4 rounded-lg shadow-sm"><div className="text-3xl font-bold text-green-600">{data.implementedControls}/{data.totalControls}</div><div className="text-sm text-gray-600">Controls Implemented</div></div>
          <div className="bg-white p-4 rounded-lg shadow-sm"><div className="text-3xl font-bold text-blue-600">{activeAssets.length}</div><div className="text-sm text-gray-600">Active Assets</div></div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Compliance Summary', icon: '📊', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', type: 'compliance' },
          { name: 'Risk Analysis', icon: '⚠️', color: 'bg-red-50 text-red-700 hover:bg-red-100', type: 'risk' },
          { name: 'Asset Inventory', icon: '💻', color: 'bg-green-50 text-green-700 hover:bg-green-100', type: 'asset' },
          { name: 'Framework Status', icon: '🏛️', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', type: 'framework' },
        ].map((t) => (
          <button type="button" key={t.name} onClick={() => openReport(t.type)} className={`card transition-all ${t.color}`}>
            <span className="text-2xl block mb-2">{t.icon}</span><span className="font-medium">{t.name}</span>
          </button>
        ))}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Risk Distribution</h3>
          <div className="space-y-3">
            {[{ label: 'Critical', count: criticalRisks.length, color: 'bg-red-500' }, { label: 'High', count: highRisks.length, color: 'bg-orange-500' }, { label: 'Medium', count: data.risks.filter(r => r.likelihood === 'Medium' || r.impact === 'Medium').length, color: 'bg-yellow-500' }, { label: 'Low', count: data.risks.filter(r => r.likelihood === 'Low' && r.impact === 'Low').length, color: 'bg-green-500' }].map(r => (
              <div key={r.label} className="flex items-center gap-3"><div className={`h-3 w-3 rounded-full ${r.color}`} /><span className="flex-1 text-sm">{r.label}</span><span className="font-bold">{r.count}</span></div>
            ))}
          </div>
          {data.risks.length === 0 && <p className="text-gray-500 text-center py-4">No risks recorded yet</p>}
        </div>

        {/* Framework Compliance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏛️ Framework Compliance</h3>
          <div className="space-y-3">
            {data.frameworks.length > 0 ? data.frameworks.map(fw => (
              <div key={fw.id}><div className="flex justify-between text-sm mb-1"><span>{fw.name}</span><span className="font-bold">{fw.compliance || 0}%</span></div><div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary-600" style={{ width: `${fw.compliance || 0}%` }} /></div></div>
            )) : <p className="text-gray-500 text-center py-4">No frameworks added yet</p>}
          </div>
        </div>
      </div>

      {/* Control Status */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Control Implementation Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ label: 'Implemented', count: data.frameworks.reduce((s, f) => s + (f.controlsData?.filter(c => c.status === 'Implemented').length || 0), 0), color: 'bg-green-100 text-green-800' }, { label: 'Partial', count: data.frameworks.reduce((s, f) => s + (f.controlsData?.filter(c => c.status === 'Partially Implemented').length || 0), 0), color: 'bg-yellow-100 text-yellow-800' }, { label: 'Not Implemented', count: data.frameworks.reduce((s, f) => s + (f.controlsData?.filter(c => c.status === 'Not Implemented').length || 0), 0), color: 'bg-red-100 text-red-800' }, { label: 'Planned', count: data.frameworks.reduce((s, f) => s + (f.controlsData?.filter(c => c.status === 'Planned').length || 0), 0), color: 'bg-blue-100 text-blue-800' }].map(s => (
            <div key={s.label} className={`p-4 rounded-lg ${s.color}`}><div className="text-2xl font-bold">{s.count}</div><div className="text-sm">{s.label}</div></div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title={`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`} size="xl">
        <div className="space-y-6">
          {reportType === 'compliance' && (
            <>
              <div className="text-center p-6 bg-primary-50 rounded-lg"><div className="text-5xl font-bold text-primary-600">{data.avgCompliance}%</div><div className="text-gray-600 mt-2">Overall Compliance Score</div></div>
              <div><h4 className="font-semibold mb-3">Framework Breakdown</h4>
                {data.frameworks.map(fw => (<div key={fw.id} className="flex justify-between py-2 border-b"><span>{fw.name}</span><span className="font-bold">{fw.compliance || 0}%</span></div>))}
                {data.frameworks.length === 0 && <p className="text-gray-500">No frameworks to report</p>}
              </div>
              <div><h4 className="font-semibold mb-3">Control Summary</h4><p>Total Controls: {data.totalControls} | Implemented: {data.implementedControls} | Gap: {data.totalControls - data.implementedControls}</p></div>
            </>
          )}
          {reportType === 'risk' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center"><div className="text-3xl font-bold text-red-600">{criticalRisks.length}</div><div className="text-sm">Critical Risks</div></div>
                <div className="p-4 bg-orange-50 rounded-lg text-center"><div className="text-3xl font-bold text-orange-600">{highRisks.length}</div><div className="text-sm">High Risks</div></div>
              </div>
              <div><h4 className="font-semibold mb-3">Top Risks by Score</h4>
                <div className="space-y-2">{data.risks.sort((a, b) => getRiskScore(b.likelihood, b.impact) - getRiskScore(a.likelihood, a.impact)).slice(0, 5).map(r => (
                  <div key={r.id} className="flex justify-between py-2 border-b"><span>{r.name}</span><span className="font-bold">Score: {getRiskScore(r.likelihood, r.impact)}</span></div>
                ))}</div>
                {data.risks.length === 0 && <p className="text-gray-500">No risks to report</p>}
              </div>
            </>
          )}
          {reportType === 'asset' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center"><div className="text-3xl font-bold text-blue-600">{data.assets.length}</div><div className="text-sm">Total Assets</div></div>
                <div className="p-4 bg-green-50 rounded-lg text-center"><div className="text-3xl font-bold text-green-600">{activeAssets.length}</div><div className="text-sm">Active</div></div>
                <div className="p-4 bg-gray-50 rounded-lg text-center"><div className="text-3xl font-bold text-gray-600">{data.assets.filter(a => a.status === 'draft').length}</div><div className="text-sm">Draft</div></div>
              </div>
              <div><h4 className="font-semibold mb-3">Assets by Type</h4>
                {Array.from(new Set(data.assets.map(a => a.type))).map(type => (
                  <div key={type} className="flex justify-between py-2 border-b"><span>{type}</span><span className="font-bold">{data.assets.filter(a => a.type === type).length}</span></div>
                ))}
                {data.assets.length === 0 && <p className="text-gray-500">No assets to report</p>}
              </div>
            </>
          )}
          {reportType === 'framework' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg text-center"><div className="text-3xl font-bold text-purple-600">{data.frameworks.length}</div><div className="text-sm">Frameworks</div></div>
                <div className="p-4 bg-blue-50 rounded-lg text-center"><div className="text-3xl font-bold text-blue-600">{data.totalControls}</div><div className="text-sm">Total Controls</div></div>
              </div>
              <div><h4 className="font-semibold mb-3">Framework Details</h4>
                {data.frameworks.map(fw => (
                  <div key={fw.id} className="py-3 border-b"><div className="flex justify-between"><span className="font-medium">{fw.name}</span><span>{fw.compliance || 0}%</span></div><div className="text-sm text-gray-500">{fw.type} • {fw.controlsData?.length || 0} controls</div></div>
                ))}
                {data.frameworks.length === 0 && <p className="text-gray-500">No frameworks to report</p>}
              </div>
            </>
          )}
          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={() => window.print()} className="btn-primary flex-1">🖨️ Print Report</button>
            <button type="button" onClick={() => setShowReportModal(false)} className="btn-secondary flex-1">Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

