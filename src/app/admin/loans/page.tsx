'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/mock-data';
import { LoanApplication, Member } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';

export default function LoansPage() {
  const { settings } = useSettings();
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadLoanApplications();
  }, []);

  const loadLoanApplications = () => {
    const allLoans = db.getLoanApplications();
    // Sort by applied date (FIFO)
    allLoans.sort((a, b) => a.appliedAt.getTime() - b.appliedAt.getTime());
    setLoanApplications(allLoans);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getMemberByLoanId = (memberId: string): Member | null => {
    return db.getMemberById(memberId) || null;
  };

  const filteredLoans = loanApplications.filter(loan => {
    const member = getMemberByLoanId(loan.memberId);
    if (!member) return false;

    return (
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleViewLoan = (loan: LoanApplication) => {
    const member = getMemberByLoanId(loan.memberId);
    setSelectedLoan(loan);
    setSelectedMember(member);
    setReviewNotes('');
    setIsDialogOpen(true);
  };

  const handleApproveLoan = async () => {
    if (!selectedLoan || !selectedMember) return;

    try {
      const approvalDate = new Date();

      // Update loan application status
      const updatedLoan = db.updateLoanApplication(selectedLoan.id, {
        status: 'approved',
        reviewedAt: approvalDate,
        reviewedBy: 'admin',
        reviewNotes,
        disbursedAt: approvalDate, // Set disbursement date to approval date
      });

      // Update member's loan details and balance
      if (updatedLoan) {
        // Use settings for loan parameters
        const loanTermMonths = settings.standardLoanTermMonths;
        const annualInterestRate = settings.loanInterestRate;
        const monthlyInterestRate = annualInterestRate / 100; // Convert percentage to decimal
        const principal = selectedLoan.amount;
        const monthlyPayment = principal / loanTermMonths; // Simple division for principal

        // Calculate immediate interest due (first month's interest)
        const immediateInterestDue = selectedLoan.amount * monthlyInterestRate;
        const newLoanBalance = selectedMember.loanBalance + selectedLoan.amount;

        db.updateMember(selectedMember.id, {
          loanBalance: newLoanBalance,
          loanStartDate: approvalDate, // Set loan start date to approval date
          loanDurationMonths: loanTermMonths, // Use settings duration
          loanInterestRate: annualInterestRate, // Use settings interest rate
          monthlyLoanPayment: monthlyPayment,
          interestBalance: selectedMember.interestBalance + immediateInterestDue, // Add immediate interest due
        });

        // Create loan disbursement transaction
        db.createTransaction({
          memberId: selectedMember.id,
          type: 'loan_disbursement',
          amount: selectedLoan.amount,
          description: `Loan approved and disbursed - ${selectedLoan.purpose}`,
          date: approvalDate,
          balanceAfter: newLoanBalance,
          referenceNumber: `LN${Date.now()}`,
          processedBy: 'admin',
        });

        // Create immediate interest charge transaction
        db.createTransaction({
          memberId: selectedMember.id,
          type: 'interest_charge',
          amount: immediateInterestDue,
          description: `Interest charged on loan disbursement (${annualInterestRate}% annual rate)`,
          date: approvalDate,
          balanceAfter: selectedMember.interestBalance + immediateInterestDue,
          referenceNumber: `INT${Date.now()}`,
          processedBy: 'system',
        });

        setSuccess('Loan approved and disbursed successfully');
        setIsDialogOpen(false);
        loadLoanApplications();
      }
    } catch (err) {
      setError('Failed to approve loan');
    }
  };

  const handleRejectLoan = async () => {
    if (!selectedLoan) return;

    try {
      const updatedLoan = db.updateLoanApplication(selectedLoan.id, {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        reviewNotes,
      });

      if (updatedLoan) {
        setSuccess('Loan rejected');
        setIsDialogOpen(false);
        loadLoanApplications();
      }
    } catch (err) {
      setError('Failed to reject loan');
    }
  };

  const getStatusColor = (status: string): BadgeProps['variant'] => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'disbursed':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getFIFOPosition = (loan: LoanApplication): number => {
    const pendingLoans = loanApplications
      .filter(l => l.status === 'pending')
      .sort((a, b) => a.appliedAt.getTime() - b.appliedAt.getTime());

    return pendingLoans.findIndex(l => l.id === loan.id) + 1;
  };

  const pendingLoansCount = loanApplications.filter(loan => loan.status === 'pending').length;
  const approvedLoansCount = loanApplications.filter(loan => loan.status === 'approved').length;
  const totalLoanAmount = loanApplications
    .filter(loan => loan.status === 'approved' || loan.status === 'disbursed')
    .reduce((sum, loan) => sum + loan.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Loan Management</h2>
        <p className="text-muted-foreground">
          Review and approve loan applications (FIFO order)
        </p>
      </div>

      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {/* Loan Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLoansCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedLoansCount}</div>
            <p className="text-xs text-muted-foreground">
              Ready for disbursement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loan Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLoanAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Approved + disbursed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search loans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filteredLoans.length} loan(s) found
        </span>
      </div>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Applications</CardTitle>
          <CardDescription>
            All loan applications sorted by application date (FIFO)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue #</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Approved Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map((loan) => {
                const member = getMemberByLoanId(loan.memberId);
                const fifoPosition = loan.status === 'pending' ? getFIFOPosition(loan) : null;

                return (
                  <TableRow key={loan.id}>
                    <TableCell>
                      {fifoPosition ? (
                        <Badge variant="outline">#{fifoPosition}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {member ? `${member.firstName} ${member.lastName}` : 'Unknown'}
                    </TableCell>
                    <TableCell>{member?.memberNumber || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(loan.amount)}</TableCell>
                    <TableCell>{loan.duration} months</TableCell>
                    <TableCell>{loan.appliedAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      {loan.reviewedAt && loan.status === 'approved' ? (
                        loan.reviewedAt.toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(loan.status)}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewLoan(loan)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Loan Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Loan Application</DialogTitle>
            <DialogDescription>
              Review member eligibility and approve or reject the loan
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && selectedMember && (
            <div className="space-y-6">
              {/* Member Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Member Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Member Name</Label>
                    <p className="text-sm">{selectedMember.firstName} {selectedMember.lastName}</p>
                  </div>
                  <div>
                    <Label>Member ID</Label>
                    <p className="text-sm">{selectedMember.memberNumber}</p>
                  </div>
                  <div>
                    <Label>Savings Balance</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedMember.savingsBalance)}</p>
                  </div>
                  <div>
                    <Label>Current Loan Balance</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedMember.loanBalance)}</p>
                  </div>
                  <div>
                    <Label>Shares Balance</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedMember.sharesBalance)}</p>
                  </div>
                  <div>
                    <Label>Outstanding Dues</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedMember.societyDues)}</p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Loan Application Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Requested Amount</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedLoan.amount)}</p>
                  </div>
                  <div>
                    <Label>Loan Duration</Label>
                    <p className="text-sm">{selectedLoan.duration} months</p>
                  </div>
                  <div>
                    <Label>Applied Date</Label>
                    <p className="text-sm">{selectedLoan.appliedAt.toLocaleDateString()}</p>
                  </div>
                  {selectedLoan.status === 'pending' && (
                    <div>
                      <Label>Queue Position</Label>
                      <p className="text-sm">#{getFIFOPosition(selectedLoan)} in line</p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Label>Purpose</Label>
                  <p className="text-sm">{selectedLoan.purpose}</p>
                </div>
              </div>

              {/* Eligibility Check */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Eligibility Assessment</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">No existing loan:</span>
                    <Badge variant={selectedMember.loanBalance === 0 ? "default" : "destructive"}>
                      {selectedMember.loanBalance === 0 ? "✓ Eligible" : "✗ Has existing loan"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dues up to date:</span>
                    <Badge variant={selectedMember.societyDues === 0 ? "default" : "secondary"}>
                      {selectedMember.societyDues === 0 ? "✓ Up to date" : "⚠ Outstanding dues"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Loan amount ≤ {settings.loanToSharesSavingsRatio}x shares & savings:</span>
                    <Badge variant={selectedLoan.amount <= (selectedMember.sharesBalance + selectedMember.savingsBalance) * settings.loanToSharesSavingsRatio ? "default" : "destructive"}>
                      {selectedLoan.amount <= (selectedMember.sharesBalance + selectedMember.savingsBalance) * settings.loanToSharesSavingsRatio ? "✓ Within limit" : "✗ Exceeds limit"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Review Notes */}
              {selectedLoan.status === 'pending' && (
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                    <Textarea
                      id="reviewNotes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add any notes about your decision..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Previous Review (if any) */}
              {selectedLoan.status !== 'pending' && selectedLoan.reviewNotes && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Review Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Reviewed By</Label>
                      <p className="text-sm">{selectedLoan.reviewedBy}</p>
                    </div>
                    <div>
                      <Label>Reviewed Date</Label>
                      <p className="text-sm">{selectedLoan.reviewedAt?.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Review Notes</Label>
                    <p className="text-sm">{selectedLoan.reviewNotes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedLoan.status === 'pending' && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleRejectLoan}>
                    Reject Loan
                  </Button>
                  <Button onClick={handleApproveLoan}>
                    Approve Loan
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
