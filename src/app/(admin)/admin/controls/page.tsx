'use client';

import { useState, useEffect } from 'react';

interface Control {
  id: string;
  name: string;
  description: string;
  frameworkId: string;
  frameworkName?: string;
  category: string;
  status: string;
}

export default function AdminControlsPage() {
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchControls();
  }, []);

  const fetchControls = async () => {
    try {
      const res = await fetch('/api/frameworks');
      const data = await res.json();
      const allControls: Control[] = [];
      for (const fw of data.frameworks || []) {
        (fw.controls || []).forEach((c: Control) => {
          allControls.push({ ...c, frameworkName: fw.name });
        });
      }
      setControls(allControls);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      implemented: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      planned: 'bg-blue-100 text-blue-800',
      'not-implemented': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🔒 Security Controls</h1>
        <p className="text-gray-600">View all security controls across frameworks</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Control</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Framework</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {controls.map((control) => (
                  <tr key={control.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{control.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{control.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{control.frameworkName}</td>
                    <td className="px-6 py-4 text-sm">{control.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(control.status)}`}>
                        {control.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {controls.length === 0 && <div className="text-center py-12 text-gray-500">No controls found</div>}
        </div>
      )}
    </div>
  );
}

