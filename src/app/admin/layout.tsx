'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Use useEffect to handle redirect to prevent render loops
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Don't render if not admin (let useEffect handle redirect)
  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">OsuOlale Admin</h1>
              <Badge className="ml-2 bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-semibold">Administrator</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white font-medium">Welcome, Admin</span>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/admin"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/admin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/members"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/admin/members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Members
            </Link>
            <Link
              href="/admin/applications"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/admin/applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applications
            </Link>
            <Link
              href="/admin/loans"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/admin/loans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Loans
            </Link>
            <Link
              href="/admin/financial-updates"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/admin/financial-updates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Financial Updates
            </Link>
            <Link
              href="/admin/bylaws"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/admin/bylaws'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              By-Laws
            </Link>
            <Link
              href="/admin/access-logs"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/admin/access-logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Access Logs
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}
