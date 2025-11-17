'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/mock-data';
import { Member } from '@/types';
import PasswordChangeModal from '@/components/PasswordChangeModal';

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [member, setMember] = useState<Member | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const loadMember = async () => {
      if (user?.role === 'member') {
        const memberData = await db.getMemberByUserId(user.id);
        setMember(memberData || null);

        // Check if user needs to change password on first login
        if (user.isFirstLogin) {
          setShowPasswordModal(true);
        }
      }
    };
    loadMember();
  }, [user]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'member')) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false);
    // Optionally show a success message or refresh user data
  };

  const handlePasswordChangeClose = () => {
    // Don't allow closing the modal on first login - user must change password
    if (user?.isFirstLogin) {
      return;
    }
    setShowPasswordModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'member') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Mobile Header - Single Row Layout */}
          <div className="py-2.5 sm:hidden">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-lg font-bold text-gray-900">OsuOlale</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
                    Member
                  </Badge>
                  {member && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {member.memberNumber}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 h-7"
                >
                  Logout
                </Button>
                <span className="text-xs text-gray-600">
                  Welcome, <span className="font-medium text-gray-900">{member?.firstName || user.email.split('@')[0]}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Header - Original Layout */}
          <div className="hidden sm:flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">OsuOlale Member Portal</h1>
              <Badge variant="secondary">Member</Badge>
              {member && (
                <Badge variant="outline">{member.memberNumber}</Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {member?.firstName || user.email}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Navigation - Improved with Better Spacing */}
          <div className="sm:hidden overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 px-2 py-2">
              <Link
                href="/member"
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/member'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/member/transactions"
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/member/transactions'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Transactions
              </Link>
              <Link
                href="/member/apply-loan"
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  pathname === '/member/apply-loan'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Loan
              </Link>
              <Link
                href="/member/profile"
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/member/profile'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Profile
              </Link>
              <Link
                href="/member/bylaws"
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/member/bylaws'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By-Laws
              </Link>
            </div>
          </div>

          {/* Desktop Navigation - Original Layout */}
          <div className="hidden sm:block px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <Link
                href="/member"
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  pathname === '/member'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/member/transactions"
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  pathname === '/member/transactions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transactions
              </Link>
              <Link
                href="/member/apply-loan"
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  pathname === '/member/apply-loan'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Loan
              </Link>
              <Link
                href="/member/profile"
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  pathname === '/member/profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile
              </Link>
              <Link
                href="/member/bylaws"
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  pathname === '/member/bylaws'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                By-Laws
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={handlePasswordChangeClose}
        onSuccess={handlePasswordChangeSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}
