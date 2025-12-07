'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { DPIA } from '@/types/database';

export default function DPIAsPage() {
  const [dpias, setDpias] = useState<DPIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{
    name: string; description: string; projectName: string; processingPurpose: string;
    dataTypes: string[]; riskLevel: 'Low' | 'Medium' | 'High'; status: 'draft' | 'in_progress' | 'completed';
  }>({
    name: '', description: '', projectName: '', processingPurpose: '',
    dataTypes: [], riskLevel: 'Low', status: 'draft',
  });

  useEffect(() => { fetchDPIAs(); }, []);

  const fetchDPIAs = async () => {
    try {
      const res = await fetch('/api/dpias');
      const data = await res.json();
      setDpias(data.dpias || []);
    } catch (error) { console.error('Error:', error);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/dpias', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) { fetchDPIAs(); setShowModal(false); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this DPIA?')) return;
    await fetch(`/api/dpias/${id}`, { method: 'DELETE' });
    fetchDPIAs();
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">📑 DPIAs</h1><p className="text-gray-600">Data Protection Impact Assessments</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New DPIA</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {dpias.map((dpia) => (
          <div key={dpia.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{dpia.name}</h3>
                <p className="text-sm text-gray-500">Project: {dpia.projectName}</p>
              </div>
              <span className={`status-badge ${getRiskColor(dpia.riskLevel)}`}>{dpia.riskLevel} Risk</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{dpia.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{dpia.status}</span>
              <button onClick={() => handleDelete(dpia.id)} className="text-red-600 hover:text-red-800">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {dpias.length === 0 && <div className="card text-center py-12"><p className="text-gray-500">No DPIAs found</p></div>}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create DPIA" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">DPIA Name</label><input type="text" className="input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
          <div><label className="label">Project Name</label><input type="text" className="input" required value={formData.projectName} onChange={(e) => setFormData({ ...formData, projectName: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          <div><label className="label">Processing Purpose</label><textarea className="input" rows={2} value={formData.processingPurpose} onChange={(e) => setFormData({ ...formData, processingPurpose: e.target.value })} /></div>
          <div><label className="label">Risk Level</label><select className="input" value={formData.riskLevel} onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as 'Low' | 'Medium' | 'High' })}><option>Low</option><option>Medium</option><option>High</option></select></div>
          <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Create DPIA</button></div>
        </form>
      </Modal>
    </div>
  );
}

