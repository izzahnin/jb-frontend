'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function DashboardContent() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.username}! 👋
          </h1>
          <p className="text-gray-600">
            Fleet Management & Order Tracking System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Orders Card */}
          <Link href="/orders">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Orders</h2>
              <p className="text-gray-600">Manage shipments and deliveries</p>
              <div className="mt-4 text-blue-600 font-medium">View Orders →</div>
            </div>
          </Link>

          {/* Trucks Card */}
          <Link href="/trucks">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">🚛</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Trucks</h2>
              <p className="text-gray-600">Fleet and vehicle management</p>
              <div className="mt-4 text-blue-600 font-medium">View Trucks →</div>
            </div>
          </Link>

          {/* Users Card */}
          <Link href="/users">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">👥</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Users</h2>
              <p className="text-gray-600">Admin and customer management</p>
              <div className="mt-4 text-blue-600 font-medium">View Users →</div>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-2 text-gray-600">
            <p>✓ Database connected</p>
            <p>✓ API running on localhost:3000</p>
            <p>✓ Ready to manage fleet</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default DashboardContent;
