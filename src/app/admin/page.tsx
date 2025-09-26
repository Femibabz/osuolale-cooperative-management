'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/mock-data';
import { DashboardStats } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    pendingApplications: 0,
    pendingLoans: 0,
    totalSavings: 0,
    totalLoans: 0,
    totalShares: 0,
    totalWithOrganization: 0,
  });

  useEffect(() => {
    // Calculate statistics
    const members = db.getMembers();
    const applications = db.getApplications();
    const loanApplications = db.getLoanApplications();

    const totalSavings = members.reduce((sum, member) => sum + member.savingsBalance, 0);
    const totalLoans = members.reduce((sum, member) => sum + member.loanBalance, 0);
    const totalShares = members.reduce((sum, member) => sum + member.sharesBalance, 0);
    const totalWithOrganization = totalSavings + totalShares;

    setStats({
      totalMembers: members.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      pendingLoans: loanApplications.filter(loan => loan.status === 'pending').length,
      totalSavings,
      totalLoans,
      totalShares,
      totalWithOrganization,
    });
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const recentApplications = db.getApplications()
    .filter(app => app.status === 'pending')
    .slice(0, 3);

  const recentLoans = db.getLoanApplications()
    .filter(loan => loan.status === 'pending')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your cooperative society
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active society members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSavings)}</div>
            <p className="text-xs text-muted-foreground">
              Collective member savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalShares)}</div>
            <p className="text-xs text-muted-foreground">
              Total share capital
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total with Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalWithOrganization)}</div>
            <p className="text-xs text-blue-600">
              Combined shares + savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalLoans)}</div>
            <p className="text-xs text-muted-foreground">
              Total loan balances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLoans}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Membership Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Membership Applications</CardTitle>
            <CardDescription>
              Latest applications awaiting review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.length > 0 ? (
                recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{application.firstName} {application.lastName}</p>
                      <p className="text-sm text-muted-foreground">{application.email}</p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No pending applications</p>
              )}
              {recentApplications.length > 0 && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/applications">View All Applications</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Loan Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Loan Applications</CardTitle>
            <CardDescription>
              Latest loan requests awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLoans.length > 0 ? (
                recentLoans.map((loan) => {
                  const member = db.getMemberById(loan.memberId);
                  return (
                    <div key={loan.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{member?.firstName} {member?.lastName}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(loan.amount)}</p>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No pending loan applications</p>
              )}
              {recentLoans.length > 0 && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/loans">View All Loans</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
