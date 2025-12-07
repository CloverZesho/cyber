'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Asset } from '@/types/database';

type AssetFormData = {
  name: string; description: string; type: string; location: string; owner: string;
  status: 'draft' | 'active' | 'retired';
};

const emptyForm: AssetFormData = { name: '', description: '', type: 'Hardware', location: '', owner: '', status: 'draft' };

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formData, setFormData] = useState<AssetFormData>(emptyForm);

  useEffect(() => { fetchAssets(); }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (error) { console.error('Error:', error);
    } finally { setLoading(false); }
  };

  const openAddModal = () => { setEditingAsset(null); setFormData(emptyForm); setShowModal(true); };
  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({ name: asset.name, description: asset.description, type: asset.type, location: asset.location || '', owner: asset.owner || '', status: (asset.status as AssetFormData['status']) || 'draft' });
    setShowModal(true);
  };
  const openViewModal = (asset: Asset) => { setViewingAsset(asset); setShowViewModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets';
      const method = editingAsset ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { fetchAssets(); setShowModal(false); setFormData(emptyForm); setEditingAsset(null); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    fetchAssets();
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = { Hardware: '🖥️', Software: '💿', Network: '🌐', Data: '📊', Service: '☁️', Cloud: '☁️', People: '👤' };
    return icons[type] || '📦';
  };
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { draft: 'bg-gray-100 text-gray-700', active: 'bg-green-100 text-green-800', retired: 'bg-red-100 text-red-800' };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredAssets = assets.filter(a => typeFilter === 'all' || a.type === typeFilter);
  const assetTypes = Array.from(new Set(assets.map(a => a.type)));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">💻 Asset Inventory</h1><p className="text-gray-600">Manage IT assets and resources</p></div>
        <button type="button" onClick={openAddModal} className="btn-primary">+ Add Asset</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card bg-blue-50"><div className="text-2xl font-bold text-blue-700">{assets.length}</div><div className="text-sm text-blue-600">Total Assets</div></div>
        <div className="card"><div className="text-2xl font-bold text-gray-700">{assets.filter(a => a.type === 'Hardware').length}</div><div className="text-sm text-gray-600">🖥️ Hardware</div></div>
        <div className="card"><div className="text-2xl font-bold text-gray-700">{assets.filter(a => a.type === 'Software').length}</div><div className="text-sm text-gray-600">💿 Software</div></div>
        <div className="card"><div className="text-2xl font-bold text-gray-700">{assets.filter(a => a.type === 'Network').length}</div><div className="text-sm text-gray-600">🌐 Network</div></div>
        <div className="card"><div className="text-2xl font-bold text-gray-700">{assets.filter(a => a.type === 'Data' || a.type === 'Service').length}</div><div className="text-sm text-gray-600">📊 Data/Services</div></div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button type="button" onClick={() => setTypeFilter('all')} className={`module-tab whitespace-nowrap ${typeFilter === 'all' ? 'module-tab-active' : 'module-tab-inactive'}`}>All</button>
        {assetTypes.map(t => <button type="button" key={t} onClick={() => setTypeFilter(t)} className={`module-tab whitespace-nowrap ${typeFilter === t ? 'module-tab-active' : 'module-tab-inactive'}`}>{getTypeIcon(t)} {t}</button>)}
      </div>

      {/* Asset Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openViewModal(asset)}>
                <td className="px-4 py-4"><div className="font-medium text-gray-900">{asset.name}</div><div className="text-sm text-gray-500 truncate max-w-xs">{asset.description}</div></td>
                <td className="px-4 py-4 text-sm"><span className="flex items-center gap-1">{getTypeIcon(asset.type)} {asset.type}</span></td>
                <td className="px-4 py-4 text-sm text-gray-600">{asset.location || '-'}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{asset.owner || '-'}</td>
                <td className="px-4 py-4"><span className={`status-badge ${getStatusColor(asset.status)}`}>{asset.status}</span></td>
                <td className="px-4 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => openViewModal(asset)} className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                  <button type="button" onClick={() => openEditModal(asset)} className="text-green-600 hover:text-green-800 text-sm">Edit</button>
                  <button type="button" onClick={() => handleDelete(asset.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredAssets.length === 0 && <div className="card text-center py-12"><p className="text-gray-500">No assets found</p></div>}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingAsset(null); }} title={editingAsset ? 'Edit Asset' : 'Add Asset'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Asset Name *</label><input type="text" className="input" placeholder="Enter asset name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} placeholder="Describe the asset..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type</label><select className="input" title="Asset type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}><option>Hardware</option><option>Software</option><option>Network</option><option>Data</option><option>Service</option><option>Cloud</option><option>People</option></select></div>
            <div><label className="label">Status</label><select className="input" title="Asset status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetFormData['status'] })}><option value="draft">Draft</option><option value="active">Active</option><option value="retired">Retired</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Location</label><input type="text" className="input" placeholder="e.g., Data Center A" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
            <div><label className="label">Owner</label><input type="text" className="input" placeholder="Asset owner" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditingAsset(null); }} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">{editingAsset ? 'Update Asset' : 'Add Asset'}</button></div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setViewingAsset(null); }} title="Asset Details" size="lg">
        {viewingAsset && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3"><span className="text-3xl">{getTypeIcon(viewingAsset.type)}</span><div><h2 className="text-xl font-bold text-gray-900">{viewingAsset.name}</h2><p className="text-sm text-gray-500">ID: {viewingAsset.customId || viewingAsset.id.slice(0,8)}</p></div></div>
              <span className={`status-badge ${getStatusColor(viewingAsset.status)}`}>{viewingAsset.status}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500 uppercase">Type</div><div className="font-medium">{viewingAsset.type}</div></div>
              <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500 uppercase">Location</div><div className="font-medium">{viewingAsset.location || '-'}</div></div>
              <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500 uppercase">Owner</div><div className="font-medium">{viewingAsset.owner || '-'}</div></div>
            </div>
            <div><h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3><p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{viewingAsset.description || 'No description provided'}</p></div>
            <div className="text-xs text-gray-400">Created: {new Date(viewingAsset.createdAt).toLocaleDateString()} • Updated: {new Date(viewingAsset.updatedAt).toLocaleDateString()}</div>
            <div className="flex gap-3 pt-4 border-t">
              <button type="button" onClick={() => { setShowViewModal(false); openEditModal(viewingAsset); }} className="btn-primary flex-1">Edit Asset</button>
              <button type="button" onClick={() => { setShowViewModal(false); setViewingAsset(null); }} className="btn-secondary flex-1">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

