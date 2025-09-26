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
import { LoanCalculator } from '@/lib/loan-utils';
import { Member } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { AutomaticInterestService } from '@/lib/automatic-interest-service';

export default function FinancialUpdatesPage() {
  const { settings } = useSettings();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingHistory, setProcessingHistory] = useState<Array<{
    month: string;
    processedAt: Date;
    result: { processedMembers: number; totalInterestCharged: number; };
  }>>([]);

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
    loadProcessingHistory();
  }, []);

  const loadProcessingHistory = () => {
    const history = AutomaticInterestService.getProcessingHistory();
    setProcessingHistory(history);
  };

  const loadMembers = () => {
    const allMembers = db.getMembers();
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

      // Update member balances
      const updatedMember = db.updateMember(selectedMember.id, {
        sharesBalance: newShares,
        savingsBalance: newSavings,
        loanBalance: newLoan,
        interestBalance: newInterest,
      });

      if (updatedMember) {
        // Create transaction records for each change
        const referenceNumber = `ADJ${Date.now()}`;

        if (pendingUpdate.shares.change !== 0) {
          db.createTransaction({
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
          db.createTransaction({
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

        if (pendingUpdate.loan.change !== 0) {
          db.createTransaction({
            memberId: selectedMember.id,
            type: pendingUpdate.loan.change > 0 ? 'loan_disbursement' : 'loan_payment',
            amount: Math.abs(pendingUpdate.loan.change),
            description: `Admin adjustment: ${updateForm.updateReason}`,
            date: new Date(),
            balanceAfter: newLoan,
            referenceNumber: `${referenceNumber}-LN`,
            processedBy: 'admin',
          });
        }

        if (pendingUpdate.interest.change !== 0) {
          db.createTransaction({
            memberId: selectedMember.id,
            type: pendingUpdate.interest.change > 0 ? 'interest_charge' : 'interest_payment',
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

      {/* Automatic Interest Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Monthly Interest Processing</CardTitle>
          <CardDescription>
            Interest is processed automatically at the start of each month for all members with active loans.
            Interest accumulates in member's interest balance without affecting loan principal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800">Interest Rate: {settings.loanInterestRate}% annual</p>
                <p className="text-xs text-green-600">
                  ✅ Processing runs automatically - no manual intervention required
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-800">Current Month</p>
                <p className="text-xs text-green-600">
                  {AutomaticInterestService.needsProcessing() ? 'Pending processing' : 'Processed'}
                </p>
              </div>
            </div>

            {/* Processing History */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Recent Processing History</h4>
              {processingHistory.length > 0 ? (
                <div className="space-y-2">
                  {processingHistory.slice(0, 3).map((entry) => (
                    <div key={entry.month} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">
                            {AutomaticInterestService.getMonthName(entry.month)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Processed on {entry.processedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {entry.result.processedMembers} member(s)
                          </p>
                          <p className="text-xs text-green-600">
                            {formatCurrency(entry.result.totalInterestCharged)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {processingHistory.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      And {processingHistory.length - 3} more month(s)...
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm text-muted-foreground">No processing history available yet.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
                const loanInfo = LoanCalculator.calculateLoanInfo(selectedMember);
                return loanInfo ? (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Active Loan Information</h4>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div>
                        <span className="text-blue-600">Months Remaining:</span>
                        <span className={`ml-2 font-medium ${loanInfo.isOverdue ? 'text-red-600' : 'text-blue-800'}`}>
                          {loanInfo.monthsRemaining}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600">Monthly Payment:</span>
                        <span className="ml-2 font-medium text-blue-800">
                          {formatCurrency(selectedMember.monthlyLoanPayment || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600">Next Payment:</span>
                        <span className="ml-2 font-medium text-blue-800">
                          {loanInfo.nextPaymentDate?.toLocaleDateString() || 'N/A'}
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
        <DialogContent>
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
