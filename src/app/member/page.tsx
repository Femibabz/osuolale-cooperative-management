'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { db } from '@/lib/mock-data';
import { getLoanSummary, formatNaira, getNextMonthInterestPreview } from '@/lib/loan-utils';
import { Member, LoanApplication } from '@/types';

export default function MemberDashboard() {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadMemberData = async () => {
      if (user?.role === 'member') {
        try {
          const memberData = await db.getMemberByUserId(user.id);
          if (memberData) {
            setMember(memberData);
            const loans = await db.getLoanApplicationsByMember(memberData.id);
            setLoanApplications(loans);
          }
          setIsLoaded(true);
        } catch (error) {
          console.error('Error loading member data:', error);
          setIsLoaded(true);
        }
      }
    };

    loadMemberData();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getStatusColor = (status: string): BadgeProps['variant'] => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️ Unable to load member information</div>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Member Info */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Member ID: {member.memberNumber}
        </p>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Shares Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(member.sharesBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Share capital investment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Savings Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(member.savingsBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Personal savings account
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Loan Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(member.loanBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Outstanding loan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Society Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(member.societyDues)}</div>
            <p className="text-xs text-muted-foreground">
              Outstanding fees
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-800">Total with Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-900">{formatCurrency(member.sharesBalance + member.savingsBalance)}</div>
            <p className="text-xs text-green-600">
              Your shares + savings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Information */}
      {(() => {
        const loanInfo = getLoanSummary(member);
        const nextInterestPreview = getNextMonthInterestPreview(member);

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
              {/* Next Month Interest Preview - Prominent Notice */}
              {nextInterestPreview && (
                <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📅</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-900 mb-1">
                        Interest Due Next Month
                      </p>
                      <p className="text-xs text-yellow-800">
                        {nextInterestPreview.message}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-yellow-900">
                          {formatCurrency(nextInterestPreview.amount)}
                        </span>
                        <span className="text-sm text-yellow-700">
                          at {nextInterestPreview.rate}% monthly rate
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label className="text-xs font-medium text-gray-600">LOAN BALANCE</Label>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(loanInfo.loanBalance)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">INTEREST DUE NOW</Label>
                  <p className={`text-lg font-bold ${loanInfo.interestBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(loanInfo.interestBalance)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">INTEREST RATE</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-800">
                      {loanInfo.currentMonthlyRate}%
                    </p>
                    {loanInfo.isPenaltyRate && (
                      <Badge variant="destructive" className="text-xs">
                        Penalty
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">per month</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">TOTAL OWED</Label>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(loanInfo.totalOwed)}
                  </p>
                  <p className="text-xs text-gray-600">Principal + Interest</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600">MONTHS SINCE DISBURSEMENT</Label>
                  <p className="text-xl font-bold text-gray-800">
                    {loanInfo.monthsSinceDisbursement}
                  </p>
                </div>
                {loanInfo.isOverdue && (
                  <div>
                    <Label className="text-xs font-medium text-gray-600">MONTHS OVERDUE</Label>
                    <p className="text-xl font-bold text-red-600">
                      {loanInfo.monthsOverdue}
                    </p>
                  </div>
                )}
              </div>
              {loanInfo.isOverdue && (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Your loan is overdue by {loanInfo.monthsOverdue} month(s). Please contact the admin to arrange payment.
                  </p>
                </div>
              )}
              {loanInfo.isPenaltyRate && !loanInfo.isOverdue && (
                <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-800 font-medium">
                    ⚠️ Your loan has exceeded 12 months. Interest rate has doubled to {loanInfo.currentMonthlyRate}% per month.
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
                Interest amount due on previous loan
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
