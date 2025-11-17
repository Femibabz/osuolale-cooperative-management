'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/mock-data';
import { Society } from '@/types';

export default function SocietiesPage() {
  const [societies, setSocieties] = useState<Society[]>([]);

  useEffect(() => {
    const allSocieties = db.getAllSocieties();
    setSocieties(allSocieties);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-NG');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Societies Management</h2>
        <p className="text-muted-foreground">View and monitor all cooperative societies</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Societies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Total Assets</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {societies.map((society) => (
                <TableRow key={society.id}>
                  <TableCell className="font-medium">{society.name}</TableCell>
                  <TableCell>{society.registrationNumber}</TableCell>
                  <TableCell>{society.memberCount}</TableCell>
                  <TableCell>{formatCurrency(society.totalSavings + society.totalShares)}</TableCell>
                  <TableCell>
                    <Badge className={society.status === 'active' ? 'bg-green-600' : 'bg-gray-500'}>
                      {society.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(society.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
