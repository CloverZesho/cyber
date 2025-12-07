'use client';

import { useState, useEffect } from 'react';
import { Control, Framework } from '@/types/database';
import Link from 'next/link';

type ControlWithFramework = Control & { frameworkName: string; frameworkId: string };

export default function ControlsPage() {
  const [controls, setControls] = useState<ControlWithFramework[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/frameworks');
      const data = await res.json();
      const fws: Framework[] = data.frameworks || [];
      setFrameworks(fws);
      const allControls: ControlWithFramework[] = [];
      fws.forEach(fw => {
        (fw.controlsData || []).forEach(ctrl => {
          allControls.push({ ...ctrl, frameworkName: fw.name, frameworkId: fw.id });
        });
      });
      setControls(allControls);
    } catch (error) { console.error('Error:', error);
    } finally { setLoading(false); }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { Implemented: 'bg-green-100 text-green-800', 'Partially Implemented': 'bg-yellow-100 text-yellow-800', 'Not Implemented': 'bg-red-100 text-red-800', Planned: 'bg-blue-100 text-blue-800' };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = { Technical: '⚙️', Administrative: '📋', Physical: '🏢', Operational: '🔧' };
    return icons[type] || '🔒';
  };

  const stats = [
    { label: 'Implemented', count: controls.filter(c => c.status === 'Implemented').length, color: 'bg-green-500', bgColor: 'bg-green-50' },
    { label: 'Partially Implemented', count: controls.filter(c => c.status === 'Partially Implemented').length, color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
    { label: 'Not Implemented', count: controls.filter(c => c.status === 'Not Implemented').length, color: 'bg-red-500', bgColor: 'bg-red-50' },
    { label: 'Planned', count: controls.filter(c => c.status === 'Planned').length, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  ];

  const filteredControls = controls.filter(c => (statusFilter === 'all' || c.status === statusFilter) && (typeFilter === 'all' || c.type === typeFilter));
  const controlTypes = Array.from(new Set(controls.map(c => c.type)));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">🔒 Controls</h1><p className="text-gray-600">Security controls across all frameworks</p></div>
        <Link href="/dashboard/frameworks" className="btn-primary">Manage in Frameworks</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`card ${stat.bgColor}`}>
            <div className="flex items-center gap-3">
              <div className={`h-4 w-4 rounded-full ${stat.color}`} />
              <div><p className="text-2xl font-bold text-gray-900">{stat.count}</p><p className="text-sm text-gray-600">{stat.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2 items-center"><span className="text-sm text-gray-600">Status:</span>
          <select className="input py-1 px-2 text-sm" title="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option><option value="Implemented">Implemented</option><option value="Partially Implemented">Partially Implemented</option><option value="Not Implemented">Not Implemented</option><option value="Planned">Planned</option>
          </select>
        </div>
        <div className="flex gap-2 items-center"><span className="text-sm text-gray-600">Type:</span>
          <select className="input py-1 px-2 text-sm" title="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All</option>{controlTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Controls Table */}
      {controls.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Control</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Framework</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredControls.map((control, idx) => (
                <tr key={control.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-4"><div className="font-medium text-gray-900">{control.name}</div><div className="text-sm text-gray-500 truncate max-w-xs">{control.description}</div></td>
                  <td className="px-4 py-4 text-sm"><Link href="/dashboard/frameworks" className="text-primary-600 hover:underline">{control.frameworkName}</Link></td>
                  <td className="px-4 py-4 text-sm"><span className="flex items-center gap-1">{getTypeIcon(control.type)} {control.type}</span></td>
                  <td className="px-4 py-4"><span className={`status-badge ${getStatusColor(control.status)}`}>{control.status}</span></td>
                  <td className="px-4 py-4 text-sm text-gray-600">{control.owner || '-'}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{control.reviewFrequency || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12">
          <span className="text-4xl mb-4 block">🔒</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Controls Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">Controls are managed within frameworks. Add a framework first, then add controls to it.</p>
          <Link href="/dashboard/frameworks" className="btn-primary inline-block mt-4">Go to Frameworks</Link>
        </div>
      )}
      {filteredControls.length === 0 && controls.length > 0 && <div className="card text-center py-8"><p className="text-gray-500">No controls match the selected filters</p></div>}
    </div>
  );
}

