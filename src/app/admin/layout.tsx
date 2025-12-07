'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
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

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/members', label: 'Members' },
    { href: '/admin/applications', label: 'Applications' },
    { href: '/admin/loans', label: 'Loans' },
    { href: '/admin/process-payment', label: 'Payments' },
    { href: '/admin/financial-updates', label: 'Financial' },
    { href: '/admin/calculate-interest', label: 'Interest' },
    { href: '/admin/bylaws', label: 'By-Laws' },
    { href: '/admin/access-logs', label: 'Logs' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Responsive */}
      <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-sm sm:text-xl font-bold text-white">OsuOlale Admin</h1>
              <Badge className="hidden sm:inline-flex ml-2 bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-semibold text-xs">Admin</Badge>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden lg:inline-block text-sm text-white font-medium">Admin</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white text-xs px-2 sm:px-4"
              >
                Logout
              </Button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 bg-emerald-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Desktop Navigation - Hidden on Mobile */}
      <nav className="hidden lg:block bg-white shadow-sm border-b sticky top-14 sm:top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap border-b-2 py-3 sm:py-4 px-3 lg:px-4 text-xs sm:text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content - Mobile Responsive */}
      <main className="max-w-7xl mx-auto py-3 sm:py-6 px-3 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
