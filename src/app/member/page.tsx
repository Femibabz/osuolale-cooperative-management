'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { db } from '@/lib/mock-data';
import { LoanCalculator } from '@/lib/loan-utils';
import { Member, LoanApplication } from '@/types';

export default function MemberDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);

  useEffect(() => {
    if (user) {
      const memberData = db.getMemberByUserId(user.id);
      setMember(memberData || null);

      if (memberData) {
        const loans = db.getLoanApplicationsByMember(memberData.id);
        setLoanApplications(loans);
      }
    }
  }, [user]);

  // Redirect if not member - use useEffect to avoid render loops
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'member')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Don't render if not member (let useEffect handle redirect)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'member') {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getStatusColor = (status: string): BadgeProps['variant'] => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading member information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Info */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Member ID: {member.memberNumber}
        </p>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(member.sharesBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Share capital investment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(member.savingsBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Personal savings account
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loan Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(member.loanBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Outstanding loan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Society Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(member.societyDues)}</div>
            <p className="text-xs text-muted-foreground">
              Outstanding fees
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total with Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(member.sharesBalance + member.savingsBalance)}</div>
            <p className="text-xs text-green-600">
              Your shares + savings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Information */}
      {(() => {
        const loanInfo = LoanCalculator.calculateLoanInfo(member);
        return loanInfo ? (
          <Card className={`${loanInfo.isOverdue ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
            <CardHeader>
              <CardTitle className={loanInfo.isOverdue ? 'text-red-800' : 'text-blue-800'}>
                Active Loan Information
              </CardTitle>
              <CardDescription>
                Your current loan details and payment schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label className="text-xs font-medium text-gray-600">MONTHS REMAINING</Label>
                  <p className={`text-lg font-bold ${loanInfo.isOverdue ? 'text-red-600' : 'text-blue-900'}`}>
                    {loanInfo.monthsRemaining}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">INTEREST DUE</Label>
                  <p className={`text-lg font-bold ${loanInfo.interestDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(loanInfo.interestDue)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">MONTHLY PAYMENT</Label>
                  <p className="text-lg font-bold text-gray-800">
                    {formatCurrency(member.monthlyLoanPayment || 0)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">NEXT PAYMENT</Label>
                  <p className="text-sm font-medium text-gray-800">
                    {loanInfo.nextPaymentDate?.toLocaleDateString() || 'N/A'}
                  </p>
                </div>
              </div>
              {loanInfo.isOverdue && (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Your loan is overdue. Please contact the admin to arrange payment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : member.interestBalance > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Interest Due</CardTitle>
              <CardDescription>
                Interest amount due on your loan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(member.interestBalance)}
              </div>
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Loan Application Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Apply for Loan</CardTitle>
            <CardDescription>
              Submit a new loan application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You can apply for a loan based on your savings and share contributions.
            </p>
            <Button className="w-full" asChild>
              <Link href="/member/apply-loan">Apply for Loan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loan Applications</CardTitle>
            <CardDescription>
              Your recent loan application history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loanApplications.length > 0 ? (
                loanApplications.slice(0, 3).map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{formatCurrency(loan.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {loan.appliedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(loan.status)}>
                      {loan.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No loan applications yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access frequently used features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-20 flex flex-col justify-center" asChild>
              <Link href="/member/apply-loan">
                <div className="text-lg mb-1">💰</div>
                Apply for Loan
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col justify-center" asChild>
              <Link href="/member/transactions">
                <div className="text-lg mb-1">📊</div>
                View Transactions
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col justify-center" asChild>
              <Link href="/member/profile">
                <div className="text-lg mb-1">👤</div>
                Update Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
