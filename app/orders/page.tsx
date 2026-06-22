'use client';

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { getOrders, createOrder } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';

interface Order {
  id: number;
  order_number: string;
  origin: string;
  destination: string;
  description: string;
  quantity: number;
  status: string;
  truck_id: number | null;
  created_at: string;
}

// Column definitions for TanStack Table
const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'order_number',
    header: 'Order #',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'origin',
    header: 'Origin',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'destination',
    header: 'Destination',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue() as string;
      return (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : status === 'pickup'
                ? 'bg-blue-100 text-blue-800'
                : status === 'in_transit'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    order_number: '',
    origin: '',
    destination: '',
    description: '',
    quantity: '',
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders(0, 100);
      // Generic type ensures response.data is Order[] | undefined
      setOrders(response.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createOrder(
        formData.order_number,
        formData.origin,
        formData.destination,
        formData.description,
        parseInt(formData.quantity, 10)
      );
      setFormData({ order_number: '', origin: '', destination: '', description: '', quantity: '' });
      setShowForm(false);
      await loadOrders();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <PageHeader
          title="Orders"
          description="Manage shipments and deliveries"
          action={{
            label: '+ New Order',
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
            <h3 className="text-lg font-bold mb-4">Create New Order</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Order Number"
                  value={formData.order_number}
                  onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Destination"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Create Order
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
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            No orders found. Create your first order!
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <DataTable columns={columns} data={orders} searchPlaceholder="Search by order #..." searchColumn="order_number" />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
