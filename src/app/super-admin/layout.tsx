'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'super_admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg border-b border-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">OsuOlale - Super Admin</h1>
              <Badge variant="secondary" className="ml-3 bg-yellow-400 text-gray-900 font-bold">
                SUPER ADMIN
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white">Welcome, Platform Admin</span>
              <Button variant="outline" onClick={handleLogout} className="bg-white text-purple-600 hover:bg-gray-100">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/super-admin"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/super-admin'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/super-admin/users"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/super-admin/users'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </Link>
            <Link
              href="/super-admin/members"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/super-admin/members'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Members
            </Link>
            <Link
              href="/super-admin/database-setup"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/super-admin/database-setup'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Database Setup
            </Link>
            <Link
              href="/super-admin/access-logs"
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                pathname === '/super-admin/access-logs'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Access Logs
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}
