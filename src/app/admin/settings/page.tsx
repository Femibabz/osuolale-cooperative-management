'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/mock-data';

export default function AdminSettings() {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    loanInterestRate: settings.loanInterestRate,
    standardLoanTermMonths: settings.standardLoanTermMonths,
    newMemberLoanEligibilityMonths: settings.newMemberLoanEligibilityMonths,
    loanToSharesSavingsRatio: settings.loanToSharesSavingsRatio,
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Update form data when settings change
  useEffect(() => {
    setFormData({
      loanInterestRate: settings.loanInterestRate,
      standardLoanTermMonths: settings.standardLoanTermMonths,
      newMemberLoanEligibilityMonths: settings.newMemberLoanEligibilityMonths,
      loanToSharesSavingsRatio: settings.loanToSharesSavingsRatio,
    });
  }, [settings]);

  const handleInputChange = (field: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');

    try {
      // Validate inputs
      if (formData.loanInterestRate < 0 || formData.loanInterestRate > 50) {
        throw new Error('Interest rate must be between 0% and 50%');
      }
      if (formData.standardLoanTermMonths < 1 || formData.standardLoanTermMonths > 120) {
        throw new Error('Loan term must be between 1 and 120 months');
      }
      if (formData.newMemberLoanEligibilityMonths < 0 || formData.newMemberLoanEligibilityMonths > 24) {
        throw new Error('New member eligibility period must be between 0 and 24 months');
      }
      if (formData.loanToSharesSavingsRatio < 1 || formData.loanToSharesSavingsRatio > 10) {
        throw new Error('Loan to shares/savings ratio must be between 1 and 10');
      }

      updateSettings({
        ...formData,
        updatedBy: user?.id || 'admin'
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const handlePasswordReset = async () => {
    setPasswordStatus('saving');

    try {
      // Validate password inputs
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        throw new Error('Please fill in all password fields');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      // Verify current password first
      if (!user || user.password !== passwordData.currentPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update the user's password in the database
      const updatedUser = db.updateUser(user.id, { password: passwordData.newPassword });
      if (!updatedUser) {
        throw new Error('Failed to update password');
      }

      setPasswordStatus('saved');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordDialogOpen(false);
      setTimeout(() => setPasswordStatus('idle'), 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      setPasswordStatus('error');
      setTimeout(() => setPasswordStatus('idle'), 5000);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure default values and system settings for your cooperative society
        </p>
      </div>

      {/* Status Alerts */}
      {saveStatus === 'saved' && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Error saving settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {passwordStatus === 'saved' && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Password reset successfully!
          </AlertDescription>
        </Alert>
      )}

      {passwordStatus === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Error resetting password. Please check your current password and try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Loan Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Settings</CardTitle>
            <CardDescription>
              Configure default loan parameters and requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                type="number"
                id="interestRate"
                value={formData.loanInterestRate}
                onChange={(e) => handleInputChange('loanInterestRate', e.target.value)}
                step="0.1"
                min="0"
                max="50"
                placeholder="1.5"
              />
              <p className="text-xs text-muted-foreground">
                Annual percentage rate for loans (default: 1.5%)
              </p>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="loanTerm">Standard Loan Term (months)</Label>
              <Input
                type="number"
                id="loanTerm"
                value={formData.standardLoanTermMonths}
                onChange={(e) => handleInputChange('standardLoanTermMonths', e.target.value)}
                min="1"
                max="120"
                placeholder="12"
              />
              <p className="text-xs text-muted-foreground">
                Default loan duration in months (default: 12 months)
              </p>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="eligibilityPeriod">New Member Eligibility Period (months)</Label>
              <Input
                type="number"
                id="eligibilityPeriod"
                value={formData.newMemberLoanEligibilityMonths}
                onChange={(e) => handleInputChange('newMemberLoanEligibilityMonths', e.target.value)}
                min="0"
                max="24"
                placeholder="6"
              />
              <p className="text-xs text-muted-foreground">
                Months before new members can apply for loans (default: 6 months)
              </p>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="loanRatio">Loan to Shares + Savings Ratio</Label>
              <Input
                type="number"
                id="loanRatio"
                value={formData.loanToSharesSavingsRatio}
                onChange={(e) => handleInputChange('loanToSharesSavingsRatio', e.target.value)}
                step="0.1"
                min="1"
                max="10"
                placeholder="2"
              />
              <p className="text-xs text-muted-foreground">
                Maximum loan as multiple of member's shares + savings (default: 2x)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Settings</CardTitle>
            <CardDescription>
              Administrative functions and account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Password Management</Label>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Reset Admin Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Reset Admin Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and create a new password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="currentPassword" className="text-right">
                        Current
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        className="col-span-3"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="newPassword" className="text-right">
                        New
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        className="col-span-3"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="confirmPassword" className="text-right">
                        Confirm
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="col-span-3"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={handlePasswordReset}
                      disabled={passwordStatus === 'saving'}
                    >
                      {passwordStatus === 'saving' ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              <Label>Last Updated</Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(settings.lastUpdated)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Updated By</Label>
              <p className="text-sm text-muted-foreground">
                {settings.updatedBy === 'system' ? 'System Default' : `Admin ID: ${settings.updatedBy}`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={saveStatus === 'saving'}
          size="lg"
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
