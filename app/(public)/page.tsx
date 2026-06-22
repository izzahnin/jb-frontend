'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="text-7xl mb-8">🚛</div>
        <h1 className="text-5xl font-bold text-white mb-4">Jalur Berlian</h1>
        <p className="text-xl text-blue-100 mb-8">Real-time Fleet Management & Order Tracking System</p>
        
        <div className="space-y-4">
          <Link
            href="/track"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition shadow-lg"
          >
            Track Your Order
          </Link>
          <p className="text-blue-100">or</p>
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition shadow-lg"
          >
            Admin Login
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur">
            <div className="text-4xl mb-3">📍</div>
            <h3 className="text-lg font-bold text-white mb-2">Real-time Tracking</h3>
            <p className="text-blue-100 text-sm">Track your shipments in real-time with live updates</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-lg font-bold text-white mb-2">Fast Delivery</h3>
            <p className="text-blue-100 text-sm">Optimized routes for quick and reliable delivery</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur">
            <div className="text-4xl mb-3">💼</div>
            <h3 className="text-lg font-bold text-white mb-2">Professional Fleet</h3>
            <p className="text-blue-100 text-sm">Managed by experienced drivers and logistics experts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
