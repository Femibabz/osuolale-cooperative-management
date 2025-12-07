'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/mock-data';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onLogout: () => void;
}

export default function PasswordChangeModal({
  isOpen,
  onClose,
  onSuccess,
  onLogout,
}: PasswordChangeModalProps) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('User not found. Please login again.');
      return;
    }

    // Validate current password
    if (currentPassword !== user.password) {
      setError('Current password is incorrect');
      return;
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    // Check if new password is same as current
    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateSuccess = await db.updateUserPassword(user.id, newPassword);

      if (updateSuccess) {
        setSuccess('Password updated successfully! You will be logged out. Please login with your new password.');

        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Wait 2 seconds then logout
        setTimeout(() => {
          onSuccess();
          onLogout();
        }, 2000);
      } else {
        setError('Failed to update password. Please try again.');
      }
    } catch (err) {
      console.error('Password update error:', err);
      setError('An error occurred while updating password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Don't allow closing if it's first login
    if (user?.isFirstLogin) {
      setError('You must change your password before continuing');
      return;
    }
    onClose();
  };

  const getPasswordStrength = (password: string): { strength: string; color: string; width: string } => {
    if (password.length === 0) return { strength: '', color: '', width: '0%' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { strength: 'Weak', color: 'bg-red-500', width: '33%' };
    if (score <= 4) return { strength: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { strength: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg sm:text-xl">
            <Lock className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
            Change Password
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {user?.isFirstLogin ? (
              <span className="text-orange-600 font-medium">
                For security reasons, you must change your default password before continuing.
              </span>
            ) : (
              'Update your account password'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mt-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-sm sm:text-base">
              Current Password *
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="pr-10 text-sm sm:text-base"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm sm:text-base">
              New Password *
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10 text-sm sm:text-base"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Password Strength:</span>
                  <span className={`font-medium ${
                    passwordStrength.strength === 'Weak' ? 'text-red-600' :
                    passwordStrength.strength === 'Medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div
                    className={`${passwordStrength.color} h-1.5 sm:h-2 rounded-full transition-all duration-300`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 sm:p-3 mt-2">
              <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1">Password must contain:</p>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-0.5">
                <li className="flex items-center">
                  <span className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                    {newPassword.length >= 8 ? '✓' : '○'}
                  </span>
                  <span className="ml-1">At least 8 characters</span>
                </li>
                <li className="flex items-center">
                  <span className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                    {/[A-Z]/.test(newPassword) ? '✓' : '○'}
                  </span>
                  <span className="ml-1">One uppercase letter</span>
                </li>
                <li className="flex items-center">
                  <span className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                    {/[a-z]/.test(newPassword) ? '✓' : '○'}
                  </span>
                  <span className="ml-1">One lowercase letter</span>
                </li>
                <li className="flex items-center">
                  <span className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                    {/[0-9]/.test(newPassword) ? '✓' : '○'}
                  </span>
                  <span className="ml-1">One number</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm sm:text-base">
              Confirm New Password *
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pr-10 text-sm sm:text-base"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs sm:text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Passwords do not match
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs sm:text-sm text-green-600 flex items-center">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Passwords match
              </p>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            {!user?.isFirstLogin && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="order-2 sm:order-1 text-sm sm:text-base"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="order-1 sm:order-2 flex-1 text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </div>

          {user?.isFirstLogin && (
            <p className="text-xs sm:text-sm text-center text-gray-600 mt-2">
              You must change your password to continue using the system
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
