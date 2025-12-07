'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search } from 'lucide-react';
import { db } from '@/lib/mock-data';
import { Member, Transaction } from '@/types';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('12');

  // Load member and transactions data
  useEffect(() => {
    const loadTransactions = async () => {
      if (user?.role === 'member') {
        const memberData = await db.getMemberByUserId(user.id);

        if (memberData) {
          setMember(memberData);
          const memberTransactions = await db.getTransactionsByMember(memberData.id, parseInt(filterPeriod));
          setTransactions(memberTransactions);
          setFilteredTransactions(memberTransactions);
        }
      }
    };

    loadTransactions();
  }, [user, filterPeriod]);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filterType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getTransactionTypeColor = (type: string) => {
    if (type.includes('deposit') || type.includes('disbursement')) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  const getTransactionTypeIcon = (type: string) => {
    if (type.includes('deposit') || type.includes('disbursement')) {
      return '+';
    }
    return '-';
  };

  const downloadCSV = () => {
    if (!filteredTransactions.length) {
      alert('No transactions to download');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Description', 'Reference'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(transaction => [
        transaction.date.toLocaleDateString(),
        transaction.type.replace('_', ' ').toUpperCase(),
        transaction.amount,
        `"${transaction.description}"`,
        transaction.referenceNumber || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${member?.memberNumber || 'member'}_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!member) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  const totalCredits = filteredTransactions
    .filter(t => t.type.includes('deposit') || t.type.includes('disbursement'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = filteredTransactions
    .filter(t => !t.type.includes('deposit') && !t.type.includes('disbursement'))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
        <p className="text-muted-foreground">
          Complete financial transaction record for {member.memberNumber}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCredits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Deposits & disbursements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Payments & charges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterPeriod}</div>
            <p className="text-xs text-muted-foreground">
              Months of history
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Actions</CardTitle>
          <CardDescription>
            Filter transactions and download your financial records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Transactions</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search description, reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Transaction Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="shares_deposit">Shares Deposit</SelectItem>
                  <SelectItem value="savings_deposit">Savings Deposit</SelectItem>
                  <SelectItem value="loan_disbursement">Loan Disbursement</SelectItem>
                  <SelectItem value="loan_payment">Loan Payment</SelectItem>
                  <SelectItem value="interest_charge">Interest Charge</SelectItem>
                  <SelectItem value="interest_payment">Interest Payment</SelectItem>
                  <SelectItem value="profile_update">Profile Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period-filter">Time Period</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 1 month</SelectItem>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                  <SelectItem value="24">Last 24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Download Options</Label>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>
            Detailed view of your financial transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions && filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Processed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {transaction.date.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transaction.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-sm font-medium ${getTransactionTypeColor(transaction.type)}`}>
                        {getTransactionTypeIcon(transaction.type)}{formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.referenceNumber || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.processedBy || 'System'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg text-muted-foreground mb-2">No transactions found</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || filterType !== 'all'
                  ? "Try adjusting your filters or search terms."
                  : "You haven't made any transactions yet."}
              </p>
              {(searchTerm || filterType !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
