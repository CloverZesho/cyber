'use client';

import { useState, useEffect, useMemo } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  role: 'admin' | 'member';
  status: 'pending' | 'approved' | 'rejected';
  lastLoginAt?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique companies for filter dropdown
  const companies = useMemo(() => {
    const companyNames = users.map(u => u.companyName).filter(Boolean);
    const uniqueCompanies = Array.from(new Set(companyNames));
    return uniqueCompanies.sort();
  }, [users]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesCompany = companyFilter === 'all' || user.companyName === companyFilter;
      const matchesSearch = !searchQuery ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesCompany && matchesSearch;
    });
  }, [users, statusFilter, companyFilter, searchQuery]);

  const updateUserStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">👥 User Management</h1>
        <p className="text-gray-600">Manage all platform users, approvals, and roles</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border-l-4 border-yellow-400">
          <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          <div className="text-sm text-yellow-600">Pending Approval</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-700">{users.filter(u => u.status === 'approved').length}</div>
          <div className="text-sm text-green-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
          <div className="text-sm text-gray-500">Companies</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input type="text" placeholder="Search by name, email, or company..."
              className="w-full border rounded-lg px-4 py-2 text-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <select className="border rounded-lg px-4 py-2 text-sm"
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
          </select>
          <select className="border rounded-lg px-4 py-2 text-sm"
            value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="all">All Companies</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>


      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{user.companyName || '-'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status || 'approved')}`}>
                        {user.status || 'approved'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <select value={user.role} onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'member')}
                        className="border rounded px-2 py-1 text-sm">
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : <span className="text-orange-500">Never</span>}
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      {user.status === 'pending' && (
                        <>
                          <button onClick={() => updateUserStatus(user.id, 'approved')}
                            className="text-green-600 hover:text-green-800 text-sm font-medium">Approve</button>
                          <button onClick={() => updateUserStatus(user.id, 'rejected')}
                            className="text-red-600 hover:text-red-800 text-sm font-medium">Reject</button>
                        </>
                      )}
                      {user.status === 'rejected' && (
                        <button onClick={() => updateUserStatus(user.id, 'approved')}
                          className="text-green-600 hover:text-green-800 text-sm font-medium">Approve</button>
                      )}
                      {user.status === 'approved' && (
                        <button onClick={() => updateUserStatus(user.id, 'rejected')}
                          className="text-orange-600 hover:text-orange-800 text-sm">Suspend</button>
                      )}
                      <button onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">No users found matching your filters</div>
          )}
        </div>
      )}
    </div>
  );
}

