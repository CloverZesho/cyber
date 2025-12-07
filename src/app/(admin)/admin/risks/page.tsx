'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';

interface User { id: string; name: string; email: string; }
interface Risk {
  id: string;
  name: string;
  description: string;
  category: string;
  likelihood: string;
  impact: string;
  status: string;
  publishStatus?: string;
  assignedUsers?: string[];
  createdAt: string;
}

export default function AdminRisksPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'assigned'>('all');
  const [form, setForm] = useState({
    name: '', description: '', category: 'Operational', likelihood: 'Medium', impact: 'Medium', status: 'identified'
  });

  useEffect(() => { fetchRisks(); fetchUsers(); }, []);

  const fetchRisks = async () => {
    try {
      const res = await fetch('/api/risks');
      const data = await res.json();
      setRisks(data.risks || []);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers((data.users || []).filter((u: User & { role?: string }) => u.role !== 'admin'));
    } catch (error) { console.error('Error:', error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRisk ? `/api/risks/${editingRisk.id}` : '/api/risks';
      const method = editingRisk ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, publishStatus: 'draft' }),
      });
      if (res.ok) { fetchRisks(); closeModal(); }
    } catch (error) { console.error('Error:', error); }
  };

  const updatePublishStatus = async (id: string, publishStatus: string, assignedUsers?: string[]) => {
    try {
      const res = await fetch(`/api/risks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishStatus, assignedUsers }),
      });
      if (res.ok) fetchRisks();
    } catch (error) { console.error('Error:', error); }
  };

  const deleteRisk = async (id: string) => {
    if (!confirm('Delete this risk?')) return;
    try {
      await fetch(`/api/risks/${id}`, { method: 'DELETE' });
      setRisks(risks.filter(r => r.id !== id));
    } catch (error) { console.error('Error:', error); }
  };

  const openEdit = (risk: Risk) => {
    setEditingRisk(risk);
    setForm({ name: risk.name, description: risk.description, category: risk.category, likelihood: risk.likelihood, impact: risk.impact, status: risk.status });
    setShowModal(true);
  };

  const openAssign = (risk: Risk) => {
    setEditingRisk(risk);
    setSelectedUsers(risk.assignedUsers || []);
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!editingRisk) return;
    await updatePublishStatus(editingRisk.id, 'assigned', selectedUsers);
    setShowAssignModal(false);
    setEditingRisk(null);
  };

  const closeModal = () => { setShowModal(false); setEditingRisk(null); setForm({ name: '', description: '', category: 'Operational', likelihood: 'Medium', impact: 'Medium', status: 'identified' }); };

  const filteredRisks = filter === 'all' ? risks : risks.filter(r => (r.publishStatus || 'draft') === filter);

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = { Low: 'bg-green-100 text-green-800', Medium: 'bg-yellow-100 text-yellow-800', High: 'bg-orange-100 text-orange-800', Critical: 'bg-red-100 text-red-800' };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { draft: 'bg-yellow-100 text-yellow-800', published: 'bg-blue-100 text-blue-800', assigned: 'bg-green-100 text-green-800' };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚠️ Risk Management</h1>
          <p className="text-gray-600">Create, manage, and assign risks</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">+ Create Risk</button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'draft', 'published', 'assigned'] as const).map((f) => (
          <button type="button" key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? risks.length : risks.filter(r => (r.publishStatus || 'draft') === f).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Likelihood</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Publish Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRisks.map((risk) => (
                <tr key={risk.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{risk.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{risk.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{risk.category}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(risk.likelihood)}`}>{risk.likelihood}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(risk.impact)}`}>{risk.impact}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(risk.publishStatus || 'draft')}`}>{risk.publishStatus || 'draft'}</span></td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button type="button" onClick={() => openEdit(risk)} className="text-blue-600 hover:text-blue-800 text-sm px-2">Edit</button>
                    {(risk.publishStatus || 'draft') === 'draft' && (
                      <>
                        <button type="button" onClick={() => updatePublishStatus(risk.id, 'published')} className="text-green-600 hover:text-green-800 text-sm px-2">Publish</button>
                        <button type="button" onClick={() => openAssign(risk)} className="text-purple-600 hover:text-purple-800 text-sm px-2">Assign</button>
                      </>
                    )}
                    {(risk.publishStatus || 'draft') !== 'draft' && (
                      <button type="button" onClick={() => updatePublishStatus(risk.id, 'draft', [])} className="text-yellow-600 hover:text-yellow-800 text-sm px-2">Draft</button>
                    )}
                    <button type="button" onClick={() => deleteRisk(risk.id)} className="text-red-600 hover:text-red-800 text-sm px-2">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRisks.length === 0 && <div className="text-center py-12 text-gray-500">No risks found</div>}
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal} title={editingRisk ? 'Edit Risk' : 'Create Risk'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option>Operational</option><option>Strategic</option><option>Financial</option><option>Compliance</option><option>Technical</option><option>Security</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="identified">Identified</option><option value="assessed">Assessed</option><option value="mitigating">Mitigating</option><option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Likelihood</label>
              <select value={form.likelihood} onChange={(e) => setForm({...form, likelihood: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Impact</label>
              <select value={form.impact} onChange={(e) => setForm({...form, impact: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingRisk ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign to Users">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select users to assign this risk to:</p>
          <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
            {users.map((user) => (
              <label key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selectedUsers.includes(user.id)}
                  onChange={(e) => e.target.checked ? setSelectedUsers([...selectedUsers, user.id]) : setSelectedUsers(selectedUsers.filter(id => id !== user.id))}
                  className="w-4 h-4 text-blue-600 rounded" />
                <div><div className="font-medium">{user.name}</div><div className="text-sm text-gray-500">{user.email}</div></div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={handleAssign} disabled={selectedUsers.length === 0} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">Assign</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

