'use client';

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { getTrucks, createTruck, deleteTruck } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';

interface Truck {
  id: number;
  plate_number: string;
  driver_name: string;
  status: string;
  created_at: string;
}

// Store for delete handler (will be set in component)
// let onDeleteTruck: ((id: number) => void) | null = null;

// Column definitions for TanStack Table
const getColumns = (onDelete: (id: number) => void): ColumnDef<Truck>[] => {
  return [
    {
      accessorKey: 'plate_number',
      header: 'Plate #',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'driver_name',
      header: 'Driver',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <button
          onClick={() => onDelete(info.row.original.id)}
          className="text-red-600 hover:text-red-800 font-medium text-sm"
        >
          Delete
        </button>
      ),
    },
  ];
};

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    plate_number: '',
    driver_name: '',
  });

  useEffect(() => {
    loadTrucks();
  }, []);

  const loadTrucks = async () => {
    setLoading(true);
    try {
      const response = await getTrucks(0, 100);
      setTrucks(response.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load trucks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createTruck(formData.plate_number, formData.driver_name);
      setFormData({ plate_number: '', driver_name: '' });
      setShowForm(false);
      await loadTrucks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create truck');
    }
  };

  const handleDeleteTruck = async (id: number) => {
    if (confirm('Delete this truck?')) {
      try {
        await deleteTruck(id);
        await loadTrucks();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to delete truck');
      }
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <PageHeader
          title="Trucks"
          description="Fleet and vehicle management"
          action={{
            label: '+ New Truck',
            onClick: () => setShowForm(!showForm),
          }}
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Register New Truck</h3>
            <form onSubmit={handleCreateTruck} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Plate Number (e.g., AB1234CD)"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Driver Name"
                  value={formData.driver_name}
                  onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Register Truck
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : trucks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            No trucks registered. Add your first truck!
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <DataTable columns={getColumns(handleDeleteTruck)} data={trucks} searchPlaceholder="Search by plate #..." searchColumn="plate_number" />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
