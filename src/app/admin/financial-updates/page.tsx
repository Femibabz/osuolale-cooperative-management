'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/mock-data';
import { getLoanSummary, formatNaira, processLoanPayment } from '@/lib/loan-utils';
import { Member } from '@/types';

export default function FinancialUpdatesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updateForm, setUpdateForm] = useState({
    sharesBalance: '',
    savingsBalance: '',
    loanBalance: '',
    interestBalance: '',
    updateReason: '',
  });

  const [pendingUpdate, setPendingUpdate] = useState<{
    shares: { old: number; new: number; change: number };
    savings: { old: number; new: number; change: number };
    loan: { old: number; new: number; change: number };
    interest: { old: number; new: number; change: number };
  } | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const allMembers = await db.getMembers();
    setMembers(allMembers);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleMemberSelect = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setUpdateForm({
        sharesBalance: member.sharesBalance.toString(),
        savingsBalance: member.savingsBalance.toString(),
        loanBalance: member.loanBalance.toString(),
        interestBalance: member.interestBalance.toString(),
        updateReason: '',
      });
      setError('');
      setSuccess('');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setUpdateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateChanges = () => {
    if (!selectedMember) return null;

    const newShares = parseFloat(updateForm.sharesBalance) || 0;
    const newSavings = parseFloat(updateForm.savingsBalance) || 0;
    const newLoan = parseFloat(updateForm.loanBalance) || 0;
    const newInterest = parseFloat(updateForm.interestBalance) || 0;

    return {
      shares: {
        old: selectedMember.sharesBalance,
        new: newShares,
        change: newShares - selectedMember.sharesBalance
      },
      savings: {
        old: selectedMember.savingsBalance,
        new: newSavings,
        change: newSavings - selectedMember.savingsBalance
      },
      loan: {
        old: selectedMember.loanBalance,
        new: newLoan,
        change: newLoan - selectedMember.loanBalance
      },
      interest: {
        old: selectedMember.interestBalance,
        new: newInterest,
        change: newInterest - selectedMember.interestBalance
      }
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setError('');

    // Validation
    const newShares = parseFloat(updateForm.sharesBalance) || 0;
    const newSavings = parseFloat(updateForm.savingsBalance) || 0;
    const newLoan = parseFloat(updateForm.loanBalance) || 0;
    const newInterest = parseFloat(updateForm.interestBalance) || 0;

    if (newShares < 0 || newSavings < 0 || newLoan < 0 || newInterest < 0) {
      setError('Balances cannot be negative');
      return;
    }

    if (!updateForm.updateReason.trim()) {
      setError('Please provide a reason for this update');
      return;
    }

    const changes = calculateChanges();
    setPendingUpdate(changes);
    setIsConfirmDialogOpen(true);
  };

  const confirmUpdate = async () => {
    if (!selectedMember || !pendingUpdate) return;

    setIsSubmitting(true);
    try {
      const newShares = parseFloat(updateForm.sharesBalance);
      const newSavings = parseFloat(updateForm.savingsBalance);
      const newLoan = parseFloat(updateForm.loanBalance);
      const newInterest = parseFloat(updateForm.interestBalance);

      // Update member balances and recalculate monthly payment if needed
      let monthlyLoanPayment: number | undefined;

      // If loan balance is changing and we have a loan, recalculate monthly payment
      if (pendingUpdate.loan.change !== 0 && newLoan > 0 && selectedMember.loanStartDate) {
        const updatedMemberForCalc = { ...selectedMember, loanBalance: newLoan };
//         monthlyLoanPayment = // LoanCalculator.recalculateMonthlyPayment(updatedMemberForCalc);
      } else if (newLoan === 0) {
        // If loan is fully paid off, reset monthly payment
        monthlyLoanPayment = 0;
      }

      const memberUpdateData: Partial<Member> = {
        sharesBalance: newShares,
        savingsBalance: newSavings,
        loanBalance: newLoan,
        interestBalance: newInterest,
        ...(monthlyLoanPayment !== undefined && { monthlyLoanPayment }),
      };

      const updatedMember = await db.updateMember(selectedMember.id, memberUpdateData);

      if (updatedMember) {
        // Create transaction records for each change
        const referenceNumber = `ADJ${Date.now()}`;

        if (pendingUpdate.shares.change !== 0) {
          await db.createTransaction({
            memberId: selectedMember.id,
            type: pendingUpdate.shares.change > 0 ? 'shares_deposit' : 'shares_withdrawal',
            amount: Math.abs(pendingUpdate.shares.change),
            description: `Admin adjustment: ${updateForm.updateReason}`,
            date: new Date(),
            balanceAfter: newShares,
            referenceNumber: `${referenceNumber}-SH`,
            processedBy: 'admin',
          });
        }

        if (pendingUpdate.savings.change !== 0) {
          await db.createTransaction({
            memberId: selectedMember.id,
            type: pendingUpdate.savings.change > 0 ? 'savings_deposit' : 'savings_withdrawal',
            amount: Math.abs(pendingUpdate.savings.change),
            description: `Admin adjustment: ${updateForm.updateReason}`,
            date: new Date(),
            balanceAfter: newSavings,
            referenceNumber: `${referenceNumber}-SV`,
            processedBy: 'admin',
          });
        }

        if (pendingUpdate.loan.change !== 0 || pendingUpdate.interest.change !== 0) {
          if (pendingUpdate.loan.change < 0 || pendingUpdate.interest.change < 0) {
            // This is a payment - automatically split between interest and principal
            const totalPayment = Math.abs(pendingUpdate.loan.change) + Math.abs(pendingUpdate.interest.change);
            const paymentSplit = processLoanPayment(selectedMember, totalPayment);

            // Create transaction for interest payment if any
            if (paymentSplit.interestPaid > 0) {
              await db.createTransaction({
                memberId: selectedMember.id,
                type: 'interest_payment',
                amount: paymentSplit.interestPaid,
                description: `Payment (auto-split): ${updateForm.updateReason}`,
                date: new Date(),
                balanceAfter: paymentSplit.newInterestBalance,
                referenceNumber: `${referenceNumber}-IP`,
                processedBy: 'admin',
              });
            }

            // Create transaction for loan payment if any
            if (paymentSplit.principalPaid > 0) {
              await db.createTransaction({
                memberId: selectedMember.id,
                type: 'loan_payment',
                amount: paymentSplit.principalPaid,
                description: `Payment (auto-split): ${updateForm.updateReason}`,
                date: new Date(),
                balanceAfter: paymentSplit.newLoanBalance,
                referenceNumber: `${referenceNumber}-LP`,
                processedBy: 'admin',
              });
            }
          } else if (pendingUpdate.loan.change > 0) {
            // This is a loan disbursement - create transaction normally
            await db.createTransaction({
              memberId: selectedMember.id,
              type: 'loan_disbursement',
              amount: Math.abs(pendingUpdate.loan.change),
              description: `Admin adjustment: ${updateForm.updateReason}`,
              date: new Date(),
              balanceAfter: newLoan,
              referenceNumber: `${referenceNumber}-LN`,
              processedBy: 'admin',
            });
          }
        }

        // Handle interest charges (not payments, as payments are handled above with loan payments)
        if (pendingUpdate.interest.change > 0) {
          await db.createTransaction({
            memberId: selectedMember.id,
            type: 'interest_charge',
            amount: Math.abs(pendingUpdate.interest.change),
            description: `Admin adjustment: ${updateForm.updateReason}`,
            date: new Date(),
            balanceAfter: newInterest,
            referenceNumber: `${referenceNumber}-INT`,
            processedBy: 'admin',
          });
        }

        setSuccess('Financial balances updated successfully');
        setSelectedMember(updatedMember);
        loadMembers(); // Refresh members list
        setIsConfirmDialogOpen(false);
        setPendingUpdate(null);
      }
    } catch (err) {
      setError('Failed to update financial balances');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeSymbol = (change: number) => {
    if (change > 0) return '+';
    if (change < 0) return '';
    return '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Financial Updates</h2>
        <p className="text-muted-foreground">
          Update member financial balances and record transactions
        </p>
      </div>

      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {/* Member Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Member</CardTitle>
          <CardDescription>
            Choose a member to update their financial balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-select">Member</Label>
              <Select onValueChange={handleMemberSelect}>
                <SelectTrigger id="member-select">
                  <SelectValue placeholder="Select a member to update" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.memberNumber} - {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Balances & Update Form */}
      {selectedMember && (
        <>
          {/* Current Balances Display */}
          <Card>
            <CardHeader>
              <CardTitle>Current Balances - {selectedMember.firstName} {selectedMember.lastName}</CardTitle>
              <CardDescription>
                Member Number: {selectedMember.memberNumber}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">SHARES BALANCE</Label>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedMember.sharesBalance)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">SAVINGS BALANCE</Label>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(selectedMember.savingsBalance)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">LOAN BALANCE</Label>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(selectedMember.loanBalance)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">INTEREST DUE</Label>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(selectedMember.interestBalance)}</p>
                </div>
              </div>

              {/* Loan Information */}
              {(() => {
                const loanInfo = getLoanSummary(selectedMember);
                return loanInfo ? (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Active Loan Information</h4>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div>
                        <span className="text-blue-600">Interest Rate:</span>
                        <span className="ml-2 font-medium text-blue-800">
                          {loanInfo.currentMonthlyRate}%
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600">Months Since Disbursement:</span>
                        <span className="ml-2 font-medium text-blue-800">
                          {loanInfo.monthsSinceDisbursement}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600">Total Owed:</span>
                        <span className="ml-2 font-medium text-blue-800">
                          {formatCurrency(loanInfo.totalOwed)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>

          {/* Update Form */}
          <Card>
            <CardHeader>
              <CardTitle>Update Financial Balances</CardTitle>
              <CardDescription>
                Enter new balance amounts. Changes will be recorded as transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shares">Shares Balance (NGN)</Label>
                    <Input
                      id="shares"
                      type="number"
                      step="0.01"
                      value={updateForm.sharesBalance}
                      onChange={(e) => handleInputChange('sharesBalance', e.target.value)}
                      placeholder="Enter new shares balance"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="savings">Savings Balance (NGN)</Label>
                    <Input
                      id="savings"
                      type="number"
                      step="0.01"
                      value={updateForm.savingsBalance}
                      onChange={(e) => handleInputChange('savingsBalance', e.target.value)}
                      placeholder="Enter new savings balance"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loan">Loan Balance (NGN)</Label>
                    <Input
                      id="loan"
                      type="number"
                      step="0.01"
                      value={updateForm.loanBalance}
                      onChange={(e) => handleInputChange('loanBalance', e.target.value)}
                      placeholder="Enter new loan balance"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest">Interest Balance (NGN)</Label>
                    <Input
                      id="interest"
                      type="number"
                      step="0.01"
                      value={updateForm.interestBalance}
                      onChange={(e) => handleInputChange('interestBalance', e.target.value)}
                      placeholder="Enter new interest balance"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Update *</Label>
                  <Textarea
                    id="reason"
                    value={updateForm.updateReason}
                    onChange={(e) => handleInputChange('updateReason', e.target.value)}
                    placeholder="Describe the reason for this financial update (e.g., 'Payment received', 'Interest adjustment', 'Correction')"
                    rows={3}
                    required
                  />
                </div>

                {/* Change Preview */}
                {(() => {
                  const changes = calculateChanges();
                  return changes ? (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Preview Changes</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        {changes.shares.change !== 0 && (
                          <div className="flex justify-between">
                            <span>Shares:</span>
                            <span className={getChangeColor(changes.shares.change)}>
                              {getChangeSymbol(changes.shares.change)}{formatCurrency(Math.abs(changes.shares.change))}
                            </span>
                          </div>
                        )}
                        {changes.savings.change !== 0 && (
                          <div className="flex justify-between">
                            <span>Savings:</span>
                            <span className={getChangeColor(changes.savings.change)}>
                              {getChangeSymbol(changes.savings.change)}{formatCurrency(Math.abs(changes.savings.change))}
                            </span>
                          </div>
                        )}
                        {changes.loan.change !== 0 && (
                          <div className="flex justify-between">
                            <span>Loan:</span>
                            <span className={getChangeColor(changes.loan.change)}>
                              {getChangeSymbol(changes.loan.change)}{formatCurrency(Math.abs(changes.loan.change))}
                            </span>
                          </div>
                        )}
                        {changes.interest.change !== 0 && (
                          <div className="flex justify-between">
                            <span>Interest:</span>
                            <span className={getChangeColor(changes.interest.change)}>
                              {getChangeSymbol(changes.interest.change)}{formatCurrency(Math.abs(changes.interest.change))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedMember(null);
                      setUpdateForm({
                        sharesBalance: '',
                        savingsBalance: '',
                        loanBalance: '',
                        interestBalance: '',
                        updateReason: '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    Update Balances
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Financial Update</DialogTitle>
            <DialogDescription>
              Please review the changes before confirming. These changes will be recorded as transactions.
            </DialogDescription>
          </DialogHeader>
          {selectedMember && pendingUpdate && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">
                  Member: {selectedMember.firstName} {selectedMember.lastName} ({selectedMember.memberNumber})
                </h4>
                <div className="space-y-2 text-sm">
                  {pendingUpdate.shares.change !== 0 && (
                    <div className="flex justify-between">
                      <span>Shares:</span>
                      <span>
                        {formatCurrency(pendingUpdate.shares.old)} → {formatCurrency(pendingUpdate.shares.new)}
                        <span className={`ml-2 font-medium ${getChangeColor(pendingUpdate.shares.change)}`}>
                          ({getChangeSymbol(pendingUpdate.shares.change)}{formatCurrency(Math.abs(pendingUpdate.shares.change))})
                        </span>
                      </span>
                    </div>
                  )}
                  {pendingUpdate.savings.change !== 0 && (
                    <div className="flex justify-between">
                      <span>Savings:</span>
                      <span>
                        {formatCurrency(pendingUpdate.savings.old)} → {formatCurrency(pendingUpdate.savings.new)}
                        <span className={`ml-2 font-medium ${getChangeColor(pendingUpdate.savings.change)}`}>
                          ({getChangeSymbol(pendingUpdate.savings.change)}{formatCurrency(Math.abs(pendingUpdate.savings.change))})
                        </span>
                      </span>
                    </div>
                  )}
                  {pendingUpdate.loan.change !== 0 && (
                    <div className="flex justify-between">
                      <span>Loan:</span>
                      <span>
                        {formatCurrency(pendingUpdate.loan.old)} → {formatCurrency(pendingUpdate.loan.new)}
                        <span className={`ml-2 font-medium ${getChangeColor(pendingUpdate.loan.change)}`}>
                          ({getChangeSymbol(pendingUpdate.loan.change)}{formatCurrency(Math.abs(pendingUpdate.loan.change))})
                        </span>
                      </span>
                    </div>
                  )}
                  {pendingUpdate.interest.change !== 0 && (
                    <div className="flex justify-between">
                      <span>Interest:</span>
                      <span>
                        {formatCurrency(pendingUpdate.interest.old)} → {formatCurrency(pendingUpdate.interest.new)}
                        <span className={`ml-2 font-medium ${getChangeColor(pendingUpdate.interest.change)}`}>
                          ({getChangeSymbol(pendingUpdate.interest.change)}{formatCurrency(Math.abs(pendingUpdate.interest.change))})
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm"><strong>Reason:</strong> {updateForm.updateReason}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmUpdate} disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Confirm Update'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
