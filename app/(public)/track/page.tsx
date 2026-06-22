'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trackOrder } from '@/lib/api';

interface TrackingResult {
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

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const response = await trackOrder(orderNumber);
      setTrackingData((response.data as TrackingResult) ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to track order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'pickup':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '📋 Pending';
      case 'pickup':
        return '🚚 Pickup';
      case 'in_transit':
        return '🚛 In Transit';
      case 'delivered':
        return '✅ Delivered';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚛</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Jalur Berlian</h1>
          <p className="text-gray-600">Track Your Shipment</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Enter Order Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., ORD-001, ORD-002"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                >
                  {loading ? 'Searching...' : 'Track'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8">
            <p className="font-semibold">❌ {error}</p>
            <p className="text-sm mt-1">Please check the order number and try again.</p>
          </div>
        )}

        {/* No Search Yet */}
        {!searched && !trackingData && !error && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">Enter an order number above to track your shipment</p>
          </div>
        )}

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Order #{trackingData.order_number}</h2>
                <span
                  className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(
                    trackingData.status
                  )}`}
                >
                  {getStatusLabel(trackingData.status)}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                Ordered on {new Date(trackingData.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Route Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📍 Route Information</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                      📤
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600">Origin</p>
                    <p className="text-lg text-gray-900 font-semibold">{trackingData.origin}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="text-2xl text-gray-400">↓</div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                      📥
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600">Destination</p>
                    <p className="text-lg text-gray-900 font-semibold">{trackingData.destination}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📦 Order Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Quantity</p>
                  <p className="text-2xl text-blue-600 font-bold">{trackingData.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Truck ID</p>
                  <p className="text-2xl text-gray-900 font-bold">
                    {trackingData.truck_id ? `#${trackingData.truck_id}` : 'Not Assigned'}
                  </p>
                </div>
              </div>
              {trackingData.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Description</p>
                  <p className="text-gray-700">{trackingData.description}</p>
                </div>
              )}
            </div>

            {/* Progress Timeline */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Order Progress</h3>
              <div className="space-y-3">
                {[
                  { stage: 'Pending', icon: '📋', done: trackingData.status !== 'pending' },
                  { stage: 'Pickup', icon: '🚚', done: ['pickup', 'in_transit', 'delivered'].includes(trackingData.status) },
                  { stage: 'In Transit', icon: '🚛', done: ['in_transit', 'delivered'].includes(trackingData.status) },
                  { stage: 'Delivered', icon: '✅', done: trackingData.status === 'delivered' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        item.done
                          ? 'bg-green-500 text-white'
                          : item.stage === trackingData.status
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`font-semibold ${
                        item.done ? 'text-green-600' : item.stage === trackingData.status ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {item.stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Again */}
            <div className="text-center">
              <button
                onClick={() => {
                  setOrderNumber('');
                  setTrackingData(null);
                  setError('');
                  setSearched(false);
                }}
                className="px-6 py-2 text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Track Another Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
