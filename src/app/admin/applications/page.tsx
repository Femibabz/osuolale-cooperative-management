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
import { EmailService } from '@/lib/email-service';
import { MembershipApplication } from '@/types';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<MembershipApplication | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    const allApplications = db.getApplications();
    setApplications(allApplications);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const filteredApplications = applications.filter(app =>
    app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewApplication = (application: MembershipApplication) => {
    setSelectedApplication(application);
    setReviewNotes('');
    setIsDialogOpen(true);
  };

  const handleApproveApplication = async () => {
    if (!selectedApplication) return;

    try {
      setError('');
      setSuccess('');

      // Update application status
      const updatedApplication = db.updateApplication(selectedApplication.id, {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        reviewNotes,
      });

      if (updatedApplication) {
        // Create user account
        const user = db.createUser({
          email: selectedApplication.email,
          password: 'member123', // Default password
          role: 'member',
        });

        // Generate member number
        const memberCount = db.getMembers().length;
        const memberNumber = `OSU${String(memberCount + 1).padStart(3, '0')}`;

        // Create member record
        const newMember = db.createMember({
          userId: user.id,
          memberNumber,
          firstName: selectedApplication.firstName,
          lastName: selectedApplication.lastName,
          email: selectedApplication.email,
          phone: selectedApplication.phone,
          address: selectedApplication.address,
          status: 'active',
          sharesBalance: 0,
          savingsBalance: 0,
          loanBalance: 0,
          interestBalance: 0,
          societyDues: 0,
        });

        // Send approval email
        const emailSent = await EmailService.sendApprovalEmail({
          applicantName: `${selectedApplication.firstName} ${selectedApplication.lastName}`,
          applicantEmail: selectedApplication.email,
          memberNumber: newMember.memberNumber,
          loginEmail: selectedApplication.email,
          loginPassword: 'member123',
        });

        if (emailSent) {
          setSuccess('Application approved, member account created, and approval email sent');
        } else {
          setSuccess('Application approved and member account created (email notification failed)');
        }

        setIsDialogOpen(false);
        loadApplications();
      }
    } catch (err) {
      console.error('Error approving application:', err);
      setError('Failed to approve application. Please try again.');
    }
  };

  const handleRejectApplication = async () => {
    if (!selectedApplication) return;

    try {
      setError('');
      setSuccess('');

      const updatedApplication = db.updateApplication(selectedApplication.id, {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        reviewNotes,
      });

      if (updatedApplication) {
        // Send rejection email
        const emailSent = await EmailService.sendRejectionEmail({
          applicantName: `${selectedApplication.firstName} ${selectedApplication.lastName}`,
          applicantEmail: selectedApplication.email,
          rejectionReason: reviewNotes || 'Application did not meet current membership criteria.',
        });

        if (emailSent) {
          setSuccess('Application rejected and notification email sent');
        } else {
          setSuccess('Application rejected (email notification failed)');
        }

        setIsDialogOpen(false);
        loadApplications();
      }
    } catch (err) {
      console.error('Error rejecting application:', err);
      setError('Failed to reject application. Please try again.');
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
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Membership Applications</h2>
        <p className="text-muted-foreground">
          Review and approve membership applications
        </p>
      </div>

      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filteredApplications.length} application(s) found
        </span>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications List</CardTitle>
          <CardDescription>
            All membership applications awaiting review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Occupation</TableHead>
                <TableHead>Monthly Income</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    {application.firstName} {application.lastName}
                  </TableCell>
                  <TableCell>{application.email}</TableCell>
                  <TableCell>{application.occupation}</TableCell>
                  <TableCell>{formatCurrency(application.monthlyIncome)}</TableCell>
                  <TableCell>{application.appliedAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewApplication(application)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Application Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Membership Application</DialogTitle>
            <DialogDescription>
              Review applicant details and approve or reject the application
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-sm">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm">{selectedApplication.phone}</p>
                  </div>
                  <div>
                    <Label>Applied Date</Label>
                    <p className="text-sm">{selectedApplication.appliedAt.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Address</Label>
                  <p className="text-sm">{selectedApplication.address}</p>
                </div>
              </div>

              {/* Employment Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Employment Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Occupation</Label>
                    <p className="text-sm">{selectedApplication.occupation}</p>
                  </div>
                  <div>
                    <Label>Monthly Income</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedApplication.monthlyIncome)}</p>
                  </div>
                </div>
              </div>

              {/* Guarantor Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Guarantor Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Guarantor Name</Label>
                    <p className="text-sm">{selectedApplication.guarantorName}</p>
                  </div>
                  <div>
                    <Label>Guarantor Phone</Label>
                    <p className="text-sm">{selectedApplication.guarantorPhone}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Guarantor Address</Label>
                  <p className="text-sm">{selectedApplication.guarantorAddress}</p>
                </div>
              </div>

              {/* Review Notes */}
              {selectedApplication.status === 'pending' && (
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
              {selectedApplication.status !== 'pending' && selectedApplication.reviewNotes && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Review Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Reviewed By</Label>
                      <p className="text-sm">{selectedApplication.reviewedBy}</p>
                    </div>
                    <div>
                      <Label>Reviewed Date</Label>
                      <p className="text-sm">{selectedApplication.reviewedAt?.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Review Notes</Label>
                    <p className="text-sm">{selectedApplication.reviewNotes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedApplication.status === 'pending' && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleRejectApplication}>
                    Reject Application
                  </Button>
                  <Button onClick={handleApproveApplication}>
                    Approve & Create Member
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
