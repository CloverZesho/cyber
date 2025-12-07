'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Risk } from '@/types/database';

type RiskFormData = {
  name: string; description: string; category: string; owner: string; mitigationPlan: string;
  likelihood: 'Low' | 'Medium' | 'High' | 'Critical'; impact: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'draft' | 'active' | 'mitigated' | 'closed';
};

const emptyForm: RiskFormData = {
  name: '', description: '', category: 'Operational', owner: '', mitigationPlan: '',
  likelihood: 'Medium', impact: 'Medium', status: 'draft',
};

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [viewingRisk, setViewingRisk] = useState<Risk | null>(null);
  const [filter, setFilter] = useState<'all' | 'Low' | 'Medium' | 'High' | 'Critical'>('all');
  const [formData, setFormData] = useState<RiskFormData>(emptyForm);

  useEffect(() => { fetchRisks(); }, []);

  const fetchRisks = async () => {
    try {
      const res = await fetch('/api/risks');
      const data = await res.json();
      setRisks(data.risks || []);
    } catch (error) { console.error('Error fetching risks:', error);
    } finally { setLoading(false); }
  };

  const openAddModal = () => { setEditingRisk(null); setFormData(emptyForm); setShowModal(true); };

  const openEditModal = (risk: Risk) => {
    setEditingRisk(risk);
    setFormData({
      name: risk.name, description: risk.description, category: risk.category,
      owner: risk.owner || '', mitigationPlan: risk.mitigationPlan || '',
      likelihood: risk.likelihood, impact: risk.impact, status: risk.status as RiskFormData['status'],
    });
    setShowModal(true);
  };

  const openViewModal = (risk: Risk) => { setViewingRisk(risk); setShowViewModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRisk ? `/api/risks/${editingRisk.id}` : '/api/risks';
      const method = editingRisk ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { fetchRisks(); setShowModal(false); setFormData(emptyForm); setEditingRisk(null); }
    } catch (error) { console.error('Error saving risk:', error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this risk?')) return;
    try { await fetch(`/api/risks/${id}`, { method: 'DELETE' }); fetchRisks(); }
    catch (error) { console.error('Error deleting risk:', error); }
  };

  const filteredRisks = risks.filter((r) => filter === 'all' || r.likelihood === filter || r.impact === filter);
  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = { Critical: 'bg-red-100 text-red-800', High: 'bg-orange-100 text-orange-800', Medium: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { draft: 'bg-gray-100 text-gray-700', active: 'bg-blue-100 text-blue-800', mitigated: 'bg-green-100 text-green-800', closed: 'bg-purple-100 text-purple-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  const getRiskScore = (likelihood: string, impact: string) => {
    const scores: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    return (scores[likelihood] || 1) * (scores[impact] || 1);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading risks...</div></div>;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">⚠️ Risk Register</h1><p className="text-gray-600">Manage and track organizational risks</p></div>
        <button type="button" onClick={openAddModal} className="btn-primary">+ Add Risk</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-red-50"><div className="text-2xl font-bold text-red-700">{risks.filter(r => r.likelihood === 'Critical' || r.impact === 'Critical').length}</div><div className="text-sm text-red-600">Critical</div></div>
        <div className="card bg-orange-50"><div className="text-2xl font-bold text-orange-700">{risks.filter(r => r.likelihood === 'High' || r.impact === 'High').length}</div><div className="text-sm text-orange-600">High</div></div>
        <div className="card bg-yellow-50"><div className="text-2xl font-bold text-yellow-700">{risks.filter(r => r.likelihood === 'Medium' || r.impact === 'Medium').length}</div><div className="text-sm text-yellow-600">Medium</div></div>
        <div className="card bg-green-50"><div className="text-2xl font-bold text-green-700">{risks.filter(r => r.likelihood === 'Low' && r.impact === 'Low').length}</div><div className="text-sm text-green-600">Low</div></div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'Low', 'Medium', 'High', 'Critical'] as const).map((f) => (
          <button type="button" key={f} onClick={() => setFilter(f)} className={`module-tab whitespace-nowrap ${filter === f ? 'module-tab-active' : 'module-tab-inactive'}`}>
            {f === 'all' ? 'All Risks' : f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Likelihood</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impact</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRisks.map((risk) => (
              <tr key={risk.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openViewModal(risk)}>
                <td className="px-4 py-4"><div className="font-medium text-gray-900">{risk.name}</div><div className="text-sm text-gray-500 truncate max-w-xs">{risk.description}</div></td>
                <td className="px-4 py-4 text-sm text-gray-600">{risk.category}</td>
                <td className="px-4 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getRiskScore(risk.likelihood, risk.impact) >= 9 ? 'bg-red-600 text-white' : getRiskScore(risk.likelihood, risk.impact) >= 4 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>{getRiskScore(risk.likelihood, risk.impact)}</span></td>
                <td className="px-4 py-4"><span className={`status-badge ${getLevelColor(risk.likelihood)}`}>{risk.likelihood}</span></td>
                <td className="px-4 py-4"><span className={`status-badge ${getLevelColor(risk.impact)}`}>{risk.impact}</span></td>
                <td className="px-4 py-4"><span className={`status-badge ${getStatusColor(risk.status)}`}>{risk.status}</span></td>
                <td className="px-4 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => openViewModal(risk)} className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                  <button type="button" onClick={() => openEditModal(risk)} className="text-green-600 hover:text-green-800 text-sm">Edit</button>
                  <button type="button" onClick={() => handleDelete(risk.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredRisks.length === 0 && <div className="card text-center py-12"><p className="text-gray-500">No risks found</p></div>}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingRisk(null); }} title={editingRisk ? 'Edit Risk' : 'Add Risk'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Risk Name *</label><input type="text" className="input" placeholder="Enter risk name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} placeholder="Describe the risk..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Category</label><select className="input" title="Risk category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}><option>Operational</option><option>Strategic</option><option>Compliance</option><option>Financial</option><option>Reputational</option><option>Technology</option><option>Legal</option></select></div>
            <div><label className="label">Owner</label><input type="text" className="input" placeholder="Risk owner name" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Likelihood</label><select className="input" title="Risk likelihood" value={formData.likelihood} onChange={(e) => setFormData({ ...formData, likelihood: e.target.value as RiskFormData['likelihood'] })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
            <div><label className="label">Impact</label><select className="input" title="Risk impact" value={formData.impact} onChange={(e) => setFormData({ ...formData, impact: e.target.value as RiskFormData['impact'] })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
          </div>
          <div><label className="label">Status</label><select className="input" title="Risk status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as RiskFormData['status'] })}><option value="draft">Draft</option><option value="active">Active</option><option value="mitigated">Mitigated</option><option value="closed">Closed</option></select></div>
          <div><label className="label">Mitigation Plan</label><textarea className="input" rows={3} placeholder="Describe the mitigation strategy..." value={formData.mitigationPlan} onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })} /></div>
          <div className="flex gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditingRisk(null); }} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">{editingRisk ? 'Update Risk' : 'Add Risk'}</button></div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setViewingRisk(null); }} title="Risk Details" size="lg">
        {viewingRisk && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div><h2 className="text-xl font-bold text-gray-900">{viewingRisk.name}</h2><p className="text-sm text-gray-500 mt-1">ID: {viewingRisk.customId || viewingRisk.id.slice(0,8)}</p></div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskScore(viewingRisk.likelihood, viewingRisk.impact) >= 9 ? 'bg-red-600 text-white' : getRiskScore(viewingRisk.likelihood, viewingRisk.impact) >= 4 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>Score: {getRiskScore(viewingRisk.likelihood, viewingRisk.impact)}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500 uppercase">Category</div><div className="font-medium">{viewingRisk.category}</div></div>
              <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500 uppercase">Likelihood</div><div><span className={`status-badge ${getLevelColor(viewingRisk.likelihood)}`}>{viewingRisk.likelihood}</span></div></div>
              <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500 uppercase">Impact</div><div><span className={`status-badge ${getLevelColor(viewingRisk.impact)}`}>{viewingRisk.impact}</span></div></div>
              <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500 uppercase">Status</div><div><span className={`status-badge ${getStatusColor(viewingRisk.status)}`}>{viewingRisk.status}</span></div></div>
            </div>
            <div><h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3><p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{viewingRisk.description || 'No description provided'}</p></div>
            {viewingRisk.owner && <div><h3 className="text-sm font-medium text-gray-700 mb-2">Risk Owner</h3><p className="text-gray-600">{viewingRisk.owner}</p></div>}
            {viewingRisk.mitigationPlan && <div><h3 className="text-sm font-medium text-gray-700 mb-2">Mitigation Plan</h3><p className="text-gray-600 bg-blue-50 p-3 rounded-lg">{viewingRisk.mitigationPlan}</p></div>}
            <div className="text-xs text-gray-400">Created: {new Date(viewingRisk.createdAt).toLocaleDateString()} • Updated: {new Date(viewingRisk.updatedAt).toLocaleDateString()}</div>
            <div className="flex gap-3 pt-4 border-t">
              <button type="button" onClick={() => { setShowViewModal(false); openEditModal(viewingRisk); }} className="btn-primary flex-1">Edit Risk</button>
              <button type="button" onClick={() => { setShowViewModal(false); setViewingRisk(null); }} className="btn-secondary flex-1">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
