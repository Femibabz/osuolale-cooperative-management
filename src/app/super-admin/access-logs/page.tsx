'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/mock-data';
import { LoginSession } from '@/types';

export default function SuperAdminAccessLogsPage() {
  const [sessions, setSessions] = useState<LoginSession[]>([]);

  useEffect(() => {
    const loadSessions = async () => {
      const allSessions = await db.getLoginSessions();
      setSessions(allSessions);
    };
    loadSessions();
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Platform Access Logs</h2>
        <p className="text-muted-foreground">Monitor all login activity across the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Login Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id} className={session.isSuspicious ? 'bg-orange-50' : ''}>
                  <TableCell>{formatDate(session.loginTime)}</TableCell>
                  <TableCell className="font-medium">{session.userEmail}</TableCell>
                  <TableCell>
                    <Badge variant={session.userRole === 'super_admin' ? 'default' : 'secondary'}>
                      {session.userRole}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {session.deviceInfo.deviceType} - {session.deviceInfo.browser}
                  </TableCell>
                  <TableCell>
                    {session.locationInfo.city}, {session.locationInfo.country}
                  </TableCell>
                  <TableCell>
                    {session.sessionActive ? (
                      <Badge className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Ended</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
