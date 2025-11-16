'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/lib/mock-data';
import { LoanCalculator } from '@/lib/loan-utils';
import { Member, User } from '@/types';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [memberTransactions, setMemberTransactions] = useState<any[]>([]);

  const [newMemberForm, setNewMemberForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    memberNumber: '',
    password: 'member123', // Default password
    sharesBalance: '0',
    savingsBalance: '0',
  });

// Edit functionality moved to Financial Updates page

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

  const filteredMembers = members.filter(member =>
    member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewMember = async (member: Member) => {
    setSelectedMember(member);
    const transactions = await db.getTransactionsByMember(member.id, 12);
    setMemberTransactions(transactions);
    setIsDialogOpen(true);
  };

// Edit functionality moved to Financial Updates page

  const handleNewMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Create user account first
      const user = await db.createUser({
        email: newMemberForm.email,
        password: newMemberForm.password,
        role: 'member',
      });

      // Create member record
      const member = await db.createMember({
        userId: user.id,
        societyId: 'soc1',
        memberNumber: newMemberForm.memberNumber,
        firstName: newMemberForm.firstName,
        lastName: newMemberForm.lastName,
        email: newMemberForm.email,
        phone: newMemberForm.phone,
        address: newMemberForm.address,
        status: 'active',
        sharesBalance: parseFloat(newMemberForm.sharesBalance),
        savingsBalance: parseFloat(newMemberForm.savingsBalance),
        loanBalance: 0,
        interestBalance: 0,
        societyDues: 0,
      });

      setSuccess('Member added successfully');
      setNewMemberForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        memberNumber: '',
        password: 'member123',
        sharesBalance: '0',
        savingsBalance: '0',
      });
      setIsAddingMember(false);
      await loadMembers();
    } catch (err) {
      setError('Failed to add member');
    }
  };

// Edit functionality moved to Financial Updates page

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Members Management</h2>
          <p className="text-muted-foreground">
            Manage society members and their account details
          </p>
        </div>
        <Button onClick={() => setIsAddingMember(true)}>
          Add New Member
        </Button>
      </div>

      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filteredMembers.length} member(s) found
        </span>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members List</CardTitle>
          <CardDescription>
            All registered society members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Savings</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Loan Balance</TableHead>
                <TableHead>Loan Duration</TableHead>
                <TableHead>Interest Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const totalWithOrganization = member.sharesBalance + member.savingsBalance;
                const loanInfo = LoanCalculator.calculateLoanInfo(member);
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.memberNumber}</TableCell>
                    <TableCell>{member.firstName} {member.lastName}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{formatCurrency(member.sharesBalance)}</TableCell>
                    <TableCell>{formatCurrency(member.savingsBalance)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(totalWithOrganization)}</TableCell>
                    <TableCell>{formatCurrency(member.loanBalance)}</TableCell>
                    <TableCell>
                      {loanInfo ? (
                        <span className={loanInfo.isOverdue ? 'text-red-600 font-medium' : ''}>
                          {loanInfo.monthsRemaining} months left
                        </span>
                      ) : (
                        <span className="text-gray-500">No loan</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {loanInfo ? (
                        <span className={loanInfo.interestDue > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                          {formatCurrency(loanInfo.interestDue)}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMember(member)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href="/admin/financial-updates">Update Finances</a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Create a new member account with login credentials
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNewMemberSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newMemberForm.firstName}
                  onChange={(e) => setNewMemberForm(prev => ({...prev, firstName: e.target.value}))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newMemberForm.lastName}
                  onChange={(e) => setNewMemberForm(prev => ({...prev, lastName: e.target.value}))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm(prev => ({...prev, email: e.target.value}))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberNumber">Member Number</Label>
                <Input
                  id="memberNumber"
                  value={newMemberForm.memberNumber}
                  onChange={(e) => setNewMemberForm(prev => ({...prev, memberNumber: e.target.value}))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newMemberForm.phone}
                onChange={(e) => setNewMemberForm(prev => ({...prev, phone: e.target.value}))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newMemberForm.address}
                onChange={(e) => setNewMemberForm(prev => ({...prev, address: e.target.value}))}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sharesBalance">Initial Shares (NGN)</Label>
                <Input
                  id="sharesBalance"
                  type="number"
                  value={newMemberForm.sharesBalance}
                  onChange={(e) => setNewMemberForm(prev => ({...prev, sharesBalance: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="savingsBalance">Initial Savings (NGN)</Label>
                <Input
                  id="savingsBalance"
                  type="number"
                  value={newMemberForm.savingsBalance}
                  onChange={(e) => setNewMemberForm(prev => ({...prev, savingsBalance: e.target.value}))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAddingMember(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Member</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Member Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Member Number</Label>
                    <p className="text-sm">{selectedMember.memberNumber}</p>
                  </div>
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-sm">{selectedMember.firstName} {selectedMember.lastName}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{selectedMember.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm">{selectedMember.phone}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Address</Label>
                  <p className="text-sm">{selectedMember.address}</p>
                </div>
              </div>

              {/* Financial Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Financial Information</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Shares Balance</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedMember.sharesBalance)}</p>
                  </div>
                  <div>
                    <Label>Savings Balance</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedMember.savingsBalance)}</p>
                  </div>
                  <div>
                    <Label>Total with Organization</Label>
                    <p className="text-sm font-medium text-blue-600">{formatCurrency(selectedMember.sharesBalance + selectedMember.savingsBalance)}</p>
                  </div>
                  <div>
                    <Label>Loan Balance</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedMember.loanBalance)}</p>
                  </div>
                  <div>
                    <Label>Interest Due</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedMember.interestBalance)}</p>
                  </div>
                  <div>
                    <Label>Society Dues</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedMember.societyDues)}</p>
                  </div>
                </div>
              </div>

              {/* Loan Information */}
              {(() => {
                const loanInfo = LoanCalculator.calculateLoanInfo(selectedMember);
                return loanInfo ? (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Loan Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Loan Start Date</Label>
                        <p className="text-sm">{selectedMember.loanStartDate?.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label>Loan End Date</Label>
                        <p className="text-sm">{loanInfo.loanEndDate?.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <p className="text-sm">{selectedMember.loanDurationMonths} months</p>
                      </div>
                      <div>
                        <Label>Months Remaining</Label>
                        <p className={`text-sm font-medium ${loanInfo.isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                          {loanInfo.monthsRemaining} months
                        </p>
                      </div>
                      <div>
                        <Label>Interest Rate</Label>
                        <p className="text-sm">{selectedMember.loanInterestRate}% per annum</p>
                      </div>
                      <div>
                        <Label>Monthly Payment</Label>
                        <p className="text-sm">{formatCurrency(selectedMember.monthlyLoanPayment || 0)}</p>
                      </div>
                      <div>
                        <Label>Next Payment Due</Label>
                        <p className="text-sm">{loanInfo.nextPaymentDate?.toLocaleDateString() || 'N/A'}</p>
                      </div>
                      <div>
                        <Label>Loan Status</Label>
                        <p className={`text-sm font-medium ${LoanCalculator.getLoanStatusColor(loanInfo)}`}>
                          {LoanCalculator.getLoanStatusText(loanInfo)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Transaction History */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Recent Transactions (Last 12 Months)</h3>
                {memberTransactions.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {memberTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="text-sm">{transaction.date.toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {transaction.type.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className={`text-sm font-medium ${
                                transaction.type.includes('deposit') || transaction.type.includes('disbursement')
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {transaction.type.includes('deposit') || transaction.type.includes('disbursement') ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-sm">{transaction.description}</TableCell>
                              <TableCell className="text-sm">{transaction.referenceNumber || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No transactions found</p>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit functionality moved to Financial Updates page */}
    </div>
  );
}
