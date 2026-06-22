'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { setupAdmin } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message.includes('Unauthorized') ? 'Invalid username or password' : err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await setupAdmin(username, password);
      if (response.token) {
        await login(username, password);
        router.push('/');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('already exists')) {
          setError('Admin already exists. Please login instead.');
          setIsSetup(false);
        } else if (err.message.includes('6 characters')) {
          setError('Password must be at least 6 characters');
        } else {
          setError(err.message);
        }
      } else {
        setError('Setup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = isSetup ? handleSetup : handleLogin;
  const buttonLabel = isSetup ? 'Setup Admin' : 'Login';

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-500 to-blue-600">
      <div className="bg-white rounded-lg shadow-xl p-8 min-w-96">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚛</div>
          <h1 className="text-3xl font-bold text-gray-900">Jalur Berlian</h1>
          <p className="text-gray-600 mt-2">Fleet Management System</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg transition"
          >
            {loading ? 'Loading...' : buttonLabel}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {isSetup ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button
              onClick={() => {
                setIsSetup(!isSetup);
                setError('');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isSetup ? 'Login' : 'Setup Admin'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
