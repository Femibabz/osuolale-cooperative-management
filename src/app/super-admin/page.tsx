'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/mock-data';
import { Transaction, LoginSession, Member, User } from '@/types';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    activeSocieties: 0,
    totalSocieties: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalMembers: 0,
    activeMembers: 0,
    totalSavings: 0,
    totalLoans: 0,
    totalShares: 0,
    totalWithPlatform: 0,
    pendingApplications: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentSessions, setRecentSessions] = useState<LoginSession[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Get platform statistics
      const platformStats = db.getPlatformStatistics();
      setStats(platformStats);

      // Get recent transactions (last 10)
      const allTransactions = await db.getTransactions();
      setRecentTransactions(allTransactions.slice(0, 10));

      // Get recent login sessions (last 15)
      const allSessions = db.getLoginSessions();
      setRecentSessions(allSessions.slice(0, 15));

      // Get all members and users
      setMembers(db.getAllMembers());
      setUsers(db.getAllUsers());
    };

    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (date: Date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate financial metrics
  const totalRevenue = stats.totalSavings + stats.totalShares;
  const outstandingLoans = stats.totalLoans;
  const interestEarned = members.reduce((sum, m) => sum + (m.interestBalance || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">OsuOlale Society Dashboard</h2>
        <p className="text-muted-foreground">
          Comprehensive monitoring and analytics for the society
        </p>
      </div>

      {/* Financial Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Total Savings</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-green-600">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalSavings)}</div>
              <p className="text-xs text-green-700 mt-1">
                Member deposits
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Total Shares</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-blue-600">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalShares)}</div>
              <p className="text-xs text-blue-700 mt-1">
                Share capital
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">Outstanding Loans</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-orange-600">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{formatCurrency(outstandingLoans)}</div>
              <p className="text-xs text-orange-700 mt-1">
                Active loans
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Interest Earned</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-purple-600">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(interestEarned)}</div>
              <p className="text-xs text-purple-700 mt-1">
                From loans
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Society Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Society Metrics</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">{stats.activeMembers} active</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">{stats.activeUsers} active</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-900">Database Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="/seed-bylaws"
                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors w-full"
              >
                🔧 Seed By-Laws
              </a>
              <p className="text-xs text-indigo-700 mt-2">
                Initialize database with society by-laws
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest financial activities in the society</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((transaction) => {
                  const member = members.find(m => m.id === transaction.memberId);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">{formatDateShort(transaction.date)}</TableCell>
                      <TableCell className="font-medium">
                        {member ? `${member.firstName} ${member.lastName}` : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.type.includes('deposit') || transaction.type.includes('payment') ? 'default' :
                          transaction.type.includes('withdrawal') || transaction.type.includes('disbursement') ? 'destructive' :
                          'secondary'
                        }>
                          {transaction.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          Completed
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity Logs</CardTitle>
          <CardDescription>Recent login sessions and user activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Login Time</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No login sessions found
                  </TableCell>
                </TableRow>
              ) : (
                recentSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant={
                        session.userRole === 'super_admin' ? 'default' :
                        session.userRole === 'admin' ? 'secondary' :
                        'outline'
                      }>
                        {session.userRole}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(session.loginTime)}</TableCell>
                    <TableCell className="text-sm">
                      {session.deviceInfo?.deviceType || 'Unknown'} - {session.deviceInfo?.browser || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {session.locationInfo?.city || 'Unknown'}, {session.locationInfo?.country || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {session.sessionActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Ended</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Member Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Member Financial Summary</CardTitle>
          <CardDescription>Overview of all members and their financial positions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Member #</TableHead>
                <TableHead className="text-right">Savings</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Loan Balance</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.memberNumber}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(member.savingsBalance)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {formatCurrency(member.sharesBalance)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-orange-600">
                      {formatCurrency(member.loanBalance)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-purple-600">
                      {formatCurrency(member.interestBalance || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
