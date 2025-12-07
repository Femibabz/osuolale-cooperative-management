'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/mock-data';
import { Member } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function SuperAdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const allMembers = await db.getMembers();
      setMembers(allMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLoanEligibilityOverride = async (memberId: string, currentValue: boolean) => {
    try {
      const updated = await db.updateMember(memberId, {
        loanEligibilityOverride: !currentValue
      });

      if (updated) {
        setMembers(members.map(m => m.id === memberId ? updated : m));
        setMessage({
          type: 'success',
          text: `Loan eligibility override ${!currentValue ? 'enabled' : 'disabled'} for member`
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update member'
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getMembershipDuration = (dateJoined: Date) => {
    const months = Math.floor((new Date().getTime() - new Date(dateJoined).getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Member Management</h1>
        <p className="text-gray-600 mt-2">Manage member settings and overrides</p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Loan Eligibility Override</CardTitle>
          <CardDescription>
            Enable members to apply for loans before the 6-month membership requirement.
            Useful for testing or special cases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No members found</p>
            ) : (
              members.map((member) => {
                const monthsAsMember = getMembershipDuration(member.dateJoined);
                const meetsRequirement = monthsAsMember >= 6;
                const hasOverride = member.loanEligibilityOverride === true;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{member.memberNumber} • {member.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {member.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Member for {monthsAsMember} month{monthsAsMember !== 1 ? 's' : ''}
                            </span>
                            {meetsRequirement ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                ✓ Eligible
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                Needs {6 - monthsAsMember} more months
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {hasOverride && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          Override Active
                        </Badge>
                      )}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`override-${member.id}`}
                          checked={hasOverride}
                          onCheckedChange={() => toggleLoanEligibilityOverride(member.id, hasOverride)}
                        />
                        <Label htmlFor={`override-${member.id}`} className="text-sm font-medium cursor-pointer">
                          {hasOverride ? 'Disable Override' : 'Enable Override'}
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How Loan Eligibility Override Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• <strong>Normal Requirement:</strong> Members must be active for 6 months before applying for loans</p>
          <p>• <strong>With Override:</strong> Members can apply for loans immediately, bypassing the 6-month rule</p>
          <p>• <strong>Use Cases:</strong> Testing loan workflows, special member privileges, or exceptional circumstances</p>
          <p>• <strong>Note:</strong> Other eligibility requirements (no outstanding balances) still apply</p>
        </CardContent>
      </Card>
    </div>
  );
}
