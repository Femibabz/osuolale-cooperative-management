'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/mock-data';
import { Member } from '@/types';

export default function ApplyLoanPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration: '',
  });

  useEffect(() => {
    const loadMember = async () => {
      if (user) {
        const memberData = await db.getMemberByUserId(user.id);
        setMember(memberData || null);
      }
    };
    loadMember();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!member) {
        setError('Member information not found');
        return;
      }

      // Validate required fields
      const { amount, purpose, duration } = formData;
      if (!amount || !purpose || !duration) {
        setError('Please fill in all required fields');
        return;
      }

      const loanAmount = parseFloat(amount);
      const loanDuration = parseInt(duration);

      // Calculate loan eligibility
      const totalWithOrganization = member.sharesBalance + member.savingsBalance;
      const maxLoanAmount = totalWithOrganization * 2;
      const hasOutstandingLoan = member.loanBalance > 0;
      const hasOutstandingInterest = member.interestBalance > 0;

      // Check 6-month membership requirement
      const membershipDurationMonths = Math.floor((new Date().getTime() - new Date(member.dateJoined).getTime()) / (1000 * 60 * 60 * 24 * 30));
      const isEligibleByTenure = membershipDurationMonths >= 6;

      // Validation rules
      if (loanAmount <= 0) {
        setError('Loan amount must be greater than 0');
        return;
      }

      if (!isEligibleByTenure) {
        const remainingMonths = 6 - membershipDurationMonths;
        setError(`You must be a member for at least 6 months before applying for a loan. You need to wait ${remainingMonths} more month${remainingMonths !== 1 ? 's' : ''}.`);
        return;
      }

      if (hasOutstandingLoan) {
        setError(`You cannot apply for a new loan while you have an outstanding loan balance of ${formatCurrency(member.loanBalance)}`);
        return;
      }

      if (hasOutstandingInterest) {
        setError(`Please clear your outstanding interest balance of ${formatCurrency(member.interestBalance)} before applying for a new loan`);
        return;
      }

      if (loanAmount > maxLoanAmount) {
        setError(`Loan amount cannot exceed ${formatCurrency(maxLoanAmount)} (2x your total shares and savings: ${formatCurrency(totalWithOrganization)})`);
        return;
      }

      // Create loan application
      const application = db.createLoanApplication({
        memberId: member.id,
        amount: loanAmount,
        purpose,
        duration: loanDuration,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/member');
      }, 3000);

    } catch (err) {
      setError('Failed to submit loan application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading member information...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Loan Application Submitted!</CardTitle>
            <CardDescription className="text-center">
              Your loan application has been received and will be reviewed by administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Applications are processed on a first-in-first-out (FIFO) basis.
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate loan eligibility
  const totalWithOrganization = member.sharesBalance + member.savingsBalance;
  const maxLoanAmount = totalWithOrganization * 2;
  const hasOutstandingLoan = member.loanBalance > 0;
  const hasOutstandingInterest = member.interestBalance > 0;

  // Check 6-month membership requirement
  const membershipDurationMonths = Math.floor((new Date().getTime() - new Date(member.dateJoined).getTime()) / (1000 * 60 * 60 * 24 * 30));
  const isEligibleByTenure = membershipDurationMonths >= 6;

  const isEligibleForLoan = !hasOutstandingLoan && !hasOutstandingInterest && isEligibleByTenure;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Apply for Loan</h1>
              <Badge variant="secondary" className="ml-3">Member</Badge>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Loan Application Form */}
            <div className="md:col-span-2">
              <Card className={!isEligibleForLoan ? "opacity-60" : ""}>
                <CardHeader>
                  <CardTitle>Loan Application</CardTitle>
                  <CardDescription>
                    {isEligibleForLoan
                      ? "Complete the form below to apply for a loan (up to 2x your shares + savings)"
                      : !isEligibleByTenure
                        ? "You must be a member for at least 6 months to apply for a loan"
                        : "Please clear outstanding balances to apply for a loan"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isEligibleForLoan && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800 font-medium">
                        📋 Loan application is currently disabled
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {!isEligibleByTenure
                          ? `You must be a member for at least 6 months to apply for a loan. You have been a member for ${membershipDurationMonths} month${membershipDurationMonths !== 1 ? 's' : ''}.`
                          : "You must clear all outstanding loan and interest balances before applying for a new loan."
                        }
                      </p>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Loan Amount (NGN) *</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="0"
                        max={maxLoanAmount}
                        disabled={!isEligibleForLoan}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum loan amount: {formatCurrency(maxLoanAmount)} (2x your shares + savings)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Loan Duration *</Label>
                      <Select onValueChange={(value) => handleSelectChange('duration', value)} disabled={!isEligibleForLoan}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 months</SelectItem>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
                          <SelectItem value="18">18 months</SelectItem>
                          <SelectItem value="24">24 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purpose">Purpose of Loan *</Label>
                      <Textarea
                        id="purpose"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        placeholder="Please describe the purpose of your loan application"
                        rows={4}
                        disabled={!isEligibleForLoan}
                        required
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-4">
                      <Button type="submit" className="flex-1" disabled={isSubmitting || !isEligibleForLoan}>
                        {isSubmitting ? 'Submitting...' : isEligibleForLoan ? 'Submit Application' : 'Clear Outstanding Balances First'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Member Financial Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Financial Summary</CardTitle>
                  <CardDescription>
                    Current account balances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Savings Balance</p>
                    <p className="text-lg font-bold">{formatCurrency(member.savingsBalance)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Shares Balance</p>
                    <p className="text-lg font-bold">{formatCurrency(member.sharesBalance)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Current Loan Balance</p>
                    <p className="text-lg font-bold">{formatCurrency(member.loanBalance)}</p>
                  </div>

                  {member.societyDues > 0 && (
                    <div>
                      <p className="text-sm font-medium">Outstanding Dues</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(member.societyDues)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={isEligibleForLoan ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardHeader>
                  <CardTitle className={isEligibleForLoan ? "text-green-800" : "text-red-800"}>
                    Loan Eligibility
                  </CardTitle>
                  <CardDescription>
                    {isEligibleForLoan
                      ? "You are eligible to apply for a loan"
                      : "Please resolve outstanding balances to apply for a loan"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Outstanding loan cleared:</span>
                    <Badge variant={member.loanBalance === 0 ? "default" : "destructive"}>
                      {member.loanBalance === 0 ? "✓ Yes" : `No (${formatCurrency(member.loanBalance)})`}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm">Interest balance cleared:</span>
                    <Badge variant={member.interestBalance === 0 ? "default" : "destructive"}>
                      {member.interestBalance === 0 ? "✓ Yes" : `No (${formatCurrency(member.interestBalance)})`}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm">Society dues up to date:</span>
                    <Badge variant={member.societyDues === 0 ? "default" : "secondary"}>
                      {member.societyDues === 0 ? "✓ Yes" : `Outstanding (${formatCurrency(member.societyDues)})`}
                    </Badge>
                  </div>

                  <hr className="my-3" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Shares Balance:</span>
                      <span>{formatCurrency(member.sharesBalance)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Savings Balance:</span>
                      <span>{formatCurrency(member.savingsBalance)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                      <span>Total (Shares + Savings):</span>
                      <span>{formatCurrency(totalWithOrganization)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-blue-600">
                      <span>Maximum Loan Amount (2x Total):</span>
                      <span>{formatCurrency(maxLoanAmount)}</span>
                    </div>
                  </div>

                  {!isEligibleForLoan && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800 font-medium">
                        ⚠️ Loan Application Requirements:
                      </p>
                      <ul className="text-xs text-red-700 mt-1 space-y-1">
                        {member.loanBalance > 0 && (
                          <li>• Clear outstanding loan balance of {formatCurrency(member.loanBalance)}</li>
                        )}
                        {member.interestBalance > 0 && (
                          <li>• Pay outstanding interest of {formatCurrency(member.interestBalance)}</li>
                        )}
                        {member.societyDues > 0 && (
                          <li>• Pay society dues of {formatCurrency(member.societyDues)}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
