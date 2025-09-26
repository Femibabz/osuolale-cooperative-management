'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Save, X, User, MapPin, Phone, Mail, Calendar, CreditCard, Camera, Upload } from 'lucide-react';
import { db } from '@/lib/mock-data';
import { Member } from '@/types';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    annualIncome: '',
  });

  const [originalData, setOriginalData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    annualIncome: '',
  });

  useEffect(() => {
    if (user) {
      const memberData = db.getMemberByUserId(user.id);
      if (memberData) {
        setMember(memberData);

        // Load profile image from localStorage
        const storedImage = localStorage.getItem(`profile_image_${memberData.id}`);
        if (storedImage) {
          setProfileImage(storedImage);
        }

        const profileData = {
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          email: memberData.email,
          phone: memberData.phone,
          address: memberData.address,
          occupation: (memberData as any).occupation || '',
          annualIncome: (memberData as any).annualIncome ? (memberData as any).annualIncome.toString() : '',
        };
        setFormData(profileData);
        setOriginalData(profileData);
      }
    }
  }, [user]);

  // Redirect if not member
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'member')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'member') {
    return null;
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Unable to load member information</p>
          <Button onClick={() => router.push('/member')} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfileImage(result);
        // Store in localStorage
        localStorage.setItem(`profile_image_${member.id}`, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First name and last name are required');
        return;
      }

      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }

      if (!formData.phone.trim()) {
        setError('Phone number is required');
        return;
      }

      if (!formData.address.trim()) {
        setError('Address is required');
        return;
      }

      // Check if email is already taken by another user (if email changed)
      if (formData.email !== originalData.email) {
        const existingUser = db.findUserByEmail(formData.email);
        if (existingUser && existingUser.id !== user.id) {
          setError('This email address is already in use by another member');
          return;
        }
      }

      // Update member information
      const updatedMember = db.updateMember(member.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        ...(formData.occupation && { occupation: formData.occupation.trim() }),
        ...(formData.annualIncome && { annualIncome: parseFloat(formData.annualIncome) }),
      } as any);

      if (updatedMember) {
        // Create a transaction record for profile update
        db.createTransaction({
          memberId: member.id,
          type: 'profile_update',
          amount: 0,
          description: `Profile updated: ${Object.keys(formData).filter(key =>
            formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData]
          ).join(', ')}`,
          date: new Date(),
          balanceAfter: member.savingsBalance,
          referenceNumber: `PRF${Date.now()}`,
          processedBy: user.email,
        });

        setMember(updatedMember);
        const newData = {
          firstName: updatedMember.firstName,
          lastName: updatedMember.lastName,
          email: updatedMember.email,
          phone: updatedMember.phone,
          address: updatedMember.address,
          occupation: (updatedMember as any).occupation || '',
          annualIncome: (updatedMember as any).annualIncome ? (updatedMember as any).annualIncome.toString() : '',
        };
        setOriginalData(newData);
        setIsEditing(false);
        setSuccess('Profile updated successfully');
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const getInitials = () => {
    return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Member Profile</h2>
          <p className="text-muted-foreground">
            View and update your personal information
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Picture & Basic Info */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative inline-block">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-200">
                    {getInitials()}
                  </div>
                )}
                {isEditing && (
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {isEditing && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">Max 5MB, JPG/PNG</p>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <div className="text-center">
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">MEMBER NUMBER</Label>
                  <p className="text-sm font-bold">{member.memberNumber}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">DATE JOINED</Label>
                  <p className="text-sm flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {member.dateJoined.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Shares Balance:</span>
                <span className="text-sm font-medium">{formatCurrency(member.sharesBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Savings Balance:</span>
                <span className="text-sm font-medium">{formatCurrency(member.savingsBalance)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total with Organization:</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(member.sharesBalance + member.savingsBalance)}
                </span>
              </div>
              {(member.loanBalance > 0 || member.interestBalance > 0) && (
                <>
                  <Separator />
                  {member.loanBalance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Outstanding Loan:</span>
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrency(member.loanBalance)}
                      </span>
                    </div>
                  )}
                  {member.interestBalance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Interest Due:</span>
                      <span className="text-sm font-medium text-orange-600">
                        {formatCurrency(member.interestBalance)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Personal Information Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                {isEditing
                  ? "Update your personal details below. Changes will be reflected across the system."
                  : "Your current personal information as stored in our system."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        required
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-gray-50 rounded-md border">
                        {member.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        required
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-gray-50 rounded-md border">
                        {member.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email Address *
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      required
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-gray-50 rounded-md border">
                      {member.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Phone Number *
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      required
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-gray-50 rounded-md border">
                      {member.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Address *
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your full address"
                      rows={3}
                      required
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-gray-50 rounded-md border min-h-[80px]">
                      {member.address}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    {isEditing ? (
                      <Input
                        id="occupation"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleInputChange}
                        placeholder="Enter your occupation"
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-gray-50 rounded-md border">
                        {(member as any).occupation || 'Not specified'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annualIncome">Annual Income (NGN)</Label>
                    {isEditing ? (
                      <Input
                        id="annualIncome"
                        name="annualIncome"
                        type="number"
                        value={formData.annualIncome}
                        onChange={handleInputChange}
                        placeholder="Enter your annual income"
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-gray-50 rounded-md border">
                        {(member as any).annualIncome ? formatCurrency((member as any).annualIncome) : 'Not specified'}
                      </p>
                    )}
                  </div>
                </div>

                {isEditing && hasChanges && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-800 mb-2">Changes to be saved:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {Object.keys(formData).filter(key =>
                        formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData]
                      ).map(key => (
                        <li key={key}>
                          • {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                          <span className="line-through mx-1">{originalData[key as keyof typeof originalData]}</span>
                          → <span className="font-medium">{formData[key as keyof typeof formData]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
