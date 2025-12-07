'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Framework, Control } from '@/types/database';

type FrameworkFormData = { name: string; description: string; type: string; version: string; status: 'draft' | 'published' | 'assigned'; };
type ControlFormData = { name: string; description: string; type: string; status: 'Implemented' | 'Partially Implemented' | 'Not Implemented' | 'Planned'; owner: string; reviewFrequency: string; };

const emptyFrameworkForm: FrameworkFormData = { name: '', description: '', type: 'ISO 27001', version: '', status: 'draft' };
const emptyControlForm: ControlFormData = { name: '', description: '', type: 'Technical', status: 'Not Implemented', owner: '', reviewFrequency: 'Annually' };

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showControlModal, setShowControlModal] = useState(false);
  const [editingFramework, setEditingFramework] = useState<Framework | null>(null);
  const [viewingFramework, setViewingFramework] = useState<Framework | null>(null);
  const [editingControl, setEditingControl] = useState<{ control: Control; index: number } | null>(null);
  const [formData, setFormData] = useState<FrameworkFormData>(emptyFrameworkForm);
  const [controlFormData, setControlFormData] = useState<ControlFormData>(emptyControlForm);

  useEffect(() => { fetchFrameworks(); }, []);

  const fetchFrameworks = async () => {
    try {
      const res = await fetch('/api/frameworks');
      const data = await res.json();
      setFrameworks(data.frameworks || []);
    } catch (error) { console.error('Error:', error);
    } finally { setLoading(false); }
  };

  const openAddModal = () => { setEditingFramework(null); setFormData(emptyFrameworkForm); setShowModal(true); };
  const openEditModal = (fw: Framework) => {
    setEditingFramework(fw);
    setFormData({ name: fw.name, description: fw.description, type: fw.type, version: fw.version || '', status: fw.status });
    setShowModal(true);
  };
  const openViewModal = (fw: Framework) => { setViewingFramework(fw); setShowViewModal(true); };
  const openAddControlModal = () => { setEditingControl(null); setControlFormData(emptyControlForm); setShowControlModal(true); };
  const openEditControlModal = (control: Control, index: number) => {
    setEditingControl({ control, index });
    setControlFormData({ name: control.name, description: control.description, type: control.type, status: control.status, owner: control.owner || '', reviewFrequency: control.reviewFrequency || 'Annually' });
    setShowControlModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFramework ? `/api/frameworks/${editingFramework.id}` : '/api/frameworks';
      const method = editingFramework ? 'PUT' : 'POST';
      const body = editingFramework ? { ...formData, controlsData: editingFramework.controlsData } : { ...formData, controlsData: [] };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { fetchFrameworks(); setShowModal(false); setFormData(emptyFrameworkForm); setEditingFramework(null); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleControlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingFramework) return;
    const newControl: Control = { id: editingControl?.control.id || crypto.randomUUID(), name: controlFormData.name, description: controlFormData.description, type: controlFormData.type, status: controlFormData.status, owner: controlFormData.owner, reviewFrequency: controlFormData.reviewFrequency, frameworks: [viewingFramework.id], createdAt: editingControl?.control.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), userId: viewingFramework.userId };
    let updatedControls: Control[];
    if (editingControl) { updatedControls = [...viewingFramework.controlsData]; updatedControls[editingControl.index] = newControl; }
    else { updatedControls = [...(viewingFramework.controlsData || []), newControl]; }
    const compliance = calculateCompliance(updatedControls);
    try {
      const res = await fetch(`/api/frameworks/${viewingFramework.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...viewingFramework, controlsData: updatedControls, compliance }) });
      if (res.ok) { const updated = { ...viewingFramework, controlsData: updatedControls, compliance }; setViewingFramework(updated); fetchFrameworks(); setShowControlModal(false); setControlFormData(emptyControlForm); setEditingControl(null); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteControl = async (index: number) => {
    if (!viewingFramework || !confirm('Delete this control?')) return;
    const updatedControls = viewingFramework.controlsData.filter((_, i) => i !== index);
    const compliance = calculateCompliance(updatedControls);
    try {
      const res = await fetch(`/api/frameworks/${viewingFramework.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...viewingFramework, controlsData: updatedControls, compliance }) });
      if (res.ok) { setViewingFramework({ ...viewingFramework, controlsData: updatedControls, compliance }); fetchFrameworks(); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this framework and all its controls?')) return;
    await fetch(`/api/frameworks/${id}`, { method: 'DELETE' });
    fetchFrameworks();
  };

  const calculateCompliance = (controls: Control[]) => {
    if (!controls.length) return 0;
    const implemented = controls.filter(c => c.status === 'Implemented').length;
    const partial = controls.filter(c => c.status === 'Partially Implemented').length;
    return Math.round(((implemented + partial * 0.5) / controls.length) * 100);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { Implemented: 'bg-green-100 text-green-800', 'Partially Implemented': 'bg-yellow-100 text-yellow-800', 'Not Implemented': 'bg-red-100 text-red-800', Planned: 'bg-blue-100 text-blue-800', draft: 'bg-gray-100 text-gray-700', published: 'bg-green-100 text-green-800', assigned: 'bg-blue-100 text-blue-800' };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  const totalControls = frameworks.reduce((sum, f) => sum + (f.controlsData?.length || 0), 0);
  const avgCompliance = frameworks.length ? Math.round(frameworks.reduce((sum, f) => sum + (f.compliance || 0), 0) / frameworks.length) : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">🏛️ Compliance Frameworks</h1><p className="text-gray-600">Manage compliance frameworks and controls</p></div>
        <button type="button" onClick={openAddModal} className="btn-primary">+ Add Framework</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50"><div className="text-2xl font-bold text-blue-700">{frameworks.length}</div><div className="text-sm text-blue-600">Frameworks</div></div>
        <div className="card bg-purple-50"><div className="text-2xl font-bold text-purple-700">{totalControls}</div><div className="text-sm text-purple-600">Total Controls</div></div>
        <div className="card bg-green-50"><div className="text-2xl font-bold text-green-700">{avgCompliance}%</div><div className="text-sm text-green-600">Avg Compliance</div></div>
        <div className="card bg-orange-50"><div className="text-2xl font-bold text-orange-700">{frameworks.filter(f => f.status === 'published').length}</div><div className="text-sm text-orange-600">Published</div></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {frameworks.map((framework) => (
          <div key={framework.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => openViewModal(framework)}>
            <div className="flex items-start justify-between mb-3">
              <div><h3 className="font-semibold text-gray-900">{framework.name}</h3><p className="text-sm text-gray-500">{framework.type} {framework.version && `v${framework.version}`}</p></div>
              <span className={`status-badge ${getStatusColor(framework.status)}`}>{framework.status}</span>
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{framework.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500"><span>🔒 {framework.controlsData?.length || 0} controls</span><span>📊 {framework.compliance || 0}%</span></div>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => openEditModal(framework)} className="text-green-600 hover:text-green-800 text-sm">Edit</button>
                <button type="button" onClick={() => handleDelete(framework.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
              </div>
            </div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary-600 transition-all" style={{ width: `${framework.compliance || 0}%` }} /></div>
          </div>
        ))}
      </div>
      {frameworks.length === 0 && <div className="card text-center py-12"><p className="text-gray-500">No frameworks found</p></div>}

      {/* Add/Edit Framework Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingFramework(null); }} title={editingFramework ? 'Edit Framework' : 'Add Framework'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Framework Name *</label><input type="text" className="input" placeholder="e.g., ISO 27001:2022" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} placeholder="Describe the framework..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Type</label><select className="input" title="Framework type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}><option>ISO 27001</option><option>NIST CSF</option><option>SOC 2</option><option>GDPR</option><option>PCI DSS</option><option>HIPAA</option><option>CIS Controls</option><option>Custom</option></select></div>
            <div><label className="label">Version</label><input type="text" className="input" placeholder="e.g., 2022" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} /></div>
            <div><label className="label">Status</label><select className="input" title="Framework status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as FrameworkFormData['status'] })}><option value="draft">Draft</option><option value="published">Published</option><option value="assigned">Assigned</option></select></div>
          </div>
          <div className="flex gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditingFramework(null); }} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">{editingFramework ? 'Update Framework' : 'Add Framework'}</button></div>
        </form>
      </Modal>

      {/* View Framework Modal with Controls */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setViewingFramework(null); }} title="Framework Details" size="xl">
        {viewingFramework && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div><h2 className="text-xl font-bold text-gray-900">{viewingFramework.name}</h2><p className="text-sm text-gray-500">{viewingFramework.type} {viewingFramework.version && `v${viewingFramework.version}`}</p></div>
              <div className="text-right"><div className="text-3xl font-bold text-primary-600">{viewingFramework.compliance || 0}%</div><div className="text-xs text-gray-500">Compliance</div></div>
            </div>
            <p className="text-gray-600">{viewingFramework.description || 'No description'}</p>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary-600 transition-all" style={{ width: `${viewingFramework.compliance || 0}%` }} /></div>

            {/* Controls Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Controls ({viewingFramework.controlsData?.length || 0})</h3><button type="button" onClick={openAddControlModal} className="btn-primary text-sm">+ Add Control</button></div>
              {viewingFramework.controlsData?.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {viewingFramework.controlsData.map((control, idx) => (
                    <div key={control.id || idx} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div><div className="font-medium text-gray-900">{control.name}</div><p className="text-sm text-gray-600 mt-1">{control.description}</p></div>
                        <span className={`status-badge ${getStatusColor(control.status)}`}>{control.status}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <div className="flex gap-4"><span>Type: {control.type}</span>{control.owner && <span>Owner: {control.owner}</span>}{control.reviewFrequency && <span>Review: {control.reviewFrequency}</span>}</div>
                        <div className="flex gap-2"><button type="button" onClick={() => openEditControlModal(control, idx)} className="text-green-600 hover:text-green-800">Edit</button><button type="button" onClick={() => handleDeleteControl(idx)} className="text-red-600 hover:text-red-800">Delete</button></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8 text-gray-500">No controls added yet. Click &quot;+ Add Control&quot; to add your first control.</div>}
            </div>
            <div className="flex gap-3 pt-4 border-t"><button type="button" onClick={() => { setShowViewModal(false); openEditModal(viewingFramework); }} className="btn-primary flex-1">Edit Framework</button><button type="button" onClick={() => { setShowViewModal(false); setViewingFramework(null); }} className="btn-secondary flex-1">Close</button></div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Control Modal */}
      <Modal isOpen={showControlModal} onClose={() => { setShowControlModal(false); setEditingControl(null); }} title={editingControl ? 'Edit Control' : 'Add Control'} size="lg">
        <form onSubmit={handleControlSubmit} className="space-y-4">
          <div><label className="label">Control Name *</label><input type="text" className="input" placeholder="e.g., Access Control Policy" required value={controlFormData.name} onChange={(e) => setControlFormData({ ...controlFormData, name: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} placeholder="Describe the control..." value={controlFormData.description} onChange={(e) => setControlFormData({ ...controlFormData, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type</label><select className="input" title="Control type" value={controlFormData.type} onChange={(e) => setControlFormData({ ...controlFormData, type: e.target.value })}><option>Technical</option><option>Administrative</option><option>Physical</option><option>Operational</option></select></div>
            <div><label className="label">Status</label><select className="input" title="Control status" value={controlFormData.status} onChange={(e) => setControlFormData({ ...controlFormData, status: e.target.value as ControlFormData['status'] })}><option value="Implemented">Implemented</option><option value="Partially Implemented">Partially Implemented</option><option value="Not Implemented">Not Implemented</option><option value="Planned">Planned</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Owner</label><input type="text" className="input" placeholder="Control owner" value={controlFormData.owner} onChange={(e) => setControlFormData({ ...controlFormData, owner: e.target.value })} /></div>
            <div><label className="label">Review Frequency</label><select className="input" title="Review frequency" value={controlFormData.reviewFrequency} onChange={(e) => setControlFormData({ ...controlFormData, reviewFrequency: e.target.value })}><option>Monthly</option><option>Quarterly</option><option>Semi-Annually</option><option>Annually</option></select></div>
          </div>
          <div className="flex gap-3 pt-4"><button type="button" onClick={() => { setShowControlModal(false); setEditingControl(null); }} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">{editingControl ? 'Update Control' : 'Add Control'}</button></div>
        </form>
      </Modal>
    </div>
  );
}

