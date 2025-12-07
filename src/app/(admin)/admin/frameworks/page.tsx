'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';

interface User { id: string; name: string; email: string; }
interface Framework {
  id: string;
  name: string;
  version: string;
  description: string;
  type: string;
  controlCount?: number;
  publishStatus?: string;
  assignedUsers?: string[];
  createdAt: string;
}

export default function AdminFrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingFramework, setEditingFramework] = useState<Framework | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'assigned'>('all');
  const [form, setForm] = useState({ name: '', description: '', type: 'ISO 27001', version: '1.0' });

  useEffect(() => { fetchFrameworks(); fetchUsers(); }, []);

  const fetchFrameworks = async () => {
    try {
      const res = await fetch('/api/frameworks');
      const data = await res.json();
      setFrameworks(data.frameworks || []);
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
      const url = editingFramework ? `/api/frameworks/${editingFramework.id}` : '/api/frameworks';
      const method = editingFramework ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, publishStatus: 'draft' }),
      });
      if (res.ok) { fetchFrameworks(); closeModal(); }
    } catch (error) { console.error('Error:', error); }
  };

  const updatePublishStatus = async (id: string, publishStatus: string, assignedUsers?: string[]) => {
    try {
      const res = await fetch(`/api/frameworks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishStatus, assignedUsers }),
      });
      if (res.ok) fetchFrameworks();
    } catch (error) { console.error('Error:', error); }
  };

  const deleteFramework = async (id: string) => {
    if (!confirm('Delete this framework?')) return;
    try {
      await fetch(`/api/frameworks/${id}`, { method: 'DELETE' });
      setFrameworks(frameworks.filter(f => f.id !== id));
    } catch (error) { console.error('Error:', error); }
  };

  const openEdit = (framework: Framework) => {
    setEditingFramework(framework);
    setForm({ name: framework.name, description: framework.description, type: framework.type || 'ISO 27001', version: framework.version });
    setShowModal(true);
  };

  const openAssign = (framework: Framework) => {
    setEditingFramework(framework);
    setSelectedUsers(framework.assignedUsers || []);
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!editingFramework) return;
    await updatePublishStatus(editingFramework.id, 'assigned', selectedUsers);
    setShowAssignModal(false);
    setEditingFramework(null);
  };

  const closeModal = () => { setShowModal(false); setEditingFramework(null); setForm({ name: '', description: '', type: 'ISO 27001', version: '1.0' }); };

  const filteredFrameworks = filter === 'all' ? frameworks : frameworks.filter(f => (f.publishStatus || 'draft') === filter);

  const getPublishBadge = (status: string) => {
    const styles: Record<string, string> = { draft: 'bg-yellow-100 text-yellow-800', published: 'bg-blue-100 text-blue-800', assigned: 'bg-green-100 text-green-800' };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📜 Framework Management</h1>
          <p className="text-gray-600">Create, manage, and assign frameworks</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">+ Create Framework</button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'draft', 'published', 'assigned'] as const).map((f) => (
          <button type="button" key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? frameworks.length : frameworks.filter(fw => (fw.publishStatus || 'draft') === f).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFrameworks.map((framework) => (
            <div key={framework.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{framework.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPublishBadge(framework.publishStatus || 'draft')}`}>{framework.publishStatus || 'draft'}</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{framework.type} • v{framework.version}</p>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{framework.description}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openEdit(framework)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                {(framework.publishStatus || 'draft') === 'draft' && (
                  <>
                    <button type="button" onClick={() => updatePublishStatus(framework.id, 'published')} className="text-green-600 hover:text-green-800 text-sm">Publish</button>
                    <button type="button" onClick={() => openAssign(framework)} className="text-purple-600 hover:text-purple-800 text-sm">Assign</button>
                  </>
                )}
                {(framework.publishStatus || 'draft') !== 'draft' && (
                  <button type="button" onClick={() => updatePublishStatus(framework.id, 'draft', [])} className="text-yellow-600 hover:text-yellow-800 text-sm">Draft</button>
                )}
                <button type="button" onClick={() => deleteFramework(framework.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredFrameworks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">📜</div>
          <p className="text-gray-500">No frameworks found</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal} title={editingFramework ? 'Edit Framework' : 'Create Framework'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 border rounded-lg" placeholder="Framework name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="Description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg" title="Framework Type">
                <option>ISO 27001</option><option>SOC 2</option><option>NIST</option><option>GDPR</option><option>HIPAA</option><option>PCI DSS</option><option>Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Version</label>
              <input type="text" value={form.version} onChange={(e) => setForm({...form, version: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="1.0" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingFramework ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign to Users">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select users to assign this framework to:</p>
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

