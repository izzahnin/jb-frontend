'use client';

import Link from 'next/link';

export default function AdminHome() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Orders Card */}
      <Link
        href="/orders"
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border-l-4 border-blue-500"
      >
        <div className="text-4xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Orders</h2>
        <p className="text-gray-600">Manage shipments and deliveries</p>
      </Link>

      {/* Trucks Card */}
      <Link
        href="/trucks"
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border-l-4 border-green-500"
      >
        <div className="text-4xl mb-4">🚛</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Trucks</h2>
        <p className="text-gray-600">Fleet and vehicle management</p>
      </Link>

      {/* Users Card */}
      <Link
        href="/users"
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border-l-4 border-purple-500"
      >
        <div className="text-4xl mb-4">👥</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Users</h2>
        <p className="text-gray-600">Admin and customer management</p>
      </Link>
    </div>
  );
}
