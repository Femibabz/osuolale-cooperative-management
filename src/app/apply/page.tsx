'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Book, Users, DollarSign, Scale, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '@/lib/mock-data';
import { ByLaw } from '@/types';

export default function ApplyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [byLaws, setByLaws] = useState<ByLaw[]>([]);
  const [selectedByLaw, setSelectedByLaw] = useState<ByLaw | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showByLaws, setShowByLaws] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    guarantor1MemberId: '',
    guarantor2MemberId: '',
  });

  useEffect(() => {
    // Load active by-laws and members for prospective members
    const loadData = async () => {
      const activeByLaws = await db.getActiveByLaws();
      setByLaws(activeByLaws);

      // Load all active members for guarantor selection
      const allMembers = await db.getMembers();
      const activeMembers = allMembers.filter(m => m.status === 'active');
      setMembers(activeMembers);
    };
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'guarantor1MemberId', 'guarantor2MemberId'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

      if (missingFields.length > 0) {
        setError('Please fill in all required fields including both guarantors');
        return;
      }

      // Validate guarantors are different
      if (formData.guarantor1MemberId === formData.guarantor2MemberId) {
        setError('Please select two different guarantors');
        return;
      }

      // Get guarantor details
      const guarantor1 = members.find(m => m.id === formData.guarantor1MemberId);
      const guarantor2 = members.find(m => m.id === formData.guarantor2MemberId);

      if (!guarantor1 || !guarantor2) {
        setError('Invalid guarantor selection');
        return;
      }

      // Create application with guarantor details
      const application = await db.createApplication({
        societyId: 'soc1',
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        guarantor1MemberId: guarantor1.id,
        guarantor1Name: `${guarantor1.firstName} ${guarantor1.lastName}`,
        guarantor1MemberNumber: guarantor1.memberNumber,
        guarantor2MemberId: guarantor2.id,
        guarantor2Name: `${guarantor2.firstName} ${guarantor2.lastName}`,
        guarantor2MemberNumber: guarantor2.memberNumber,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'membership':
        return <Users className="h-4 w-4" />;
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'governance':
        return <Scale className="h-4 w-4" />;
      case 'general':
        return <Book className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'membership':
        return 'bg-blue-100 text-blue-800';
      case 'financial':
        return 'bg-green-100 text-green-800';
      case 'governance':
        return 'bg-purple-100 text-purple-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openViewModal = (bylaw: ByLaw) => {
    setSelectedByLaw(bylaw);
    setIsViewModalOpen(true);
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className={line.trim() === '' ? 'mb-4' : 'mb-2'}>
        {line}
      </p>
    ));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Application Submitted!</CardTitle>
            <CardDescription className="text-center">
              Your membership application has been received and is being reviewed by our administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              You will be contacted via email once your application has been processed.
              Redirecting to home page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-3 sm:px-4 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Membership Application</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Join OsuOlale Cooperative Society</p>
        </div>

        {/* Society By-Laws Section */}
        {byLaws.length > 0 && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Society By-Laws
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Review our society's governing principles before applying for membership
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowByLaws(!showByLaws)}
                  className="shrink-0 w-full sm:w-auto">
                  {showByLaws ? (
                    <>
                      Hide <ChevronUp className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      View <ChevronDown className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            {showByLaws && (
              <CardContent>
                <div className="space-y-3">
                  {byLaws.map((bylaw) => (
                    <div
                      key={bylaw.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="text-blue-600 mt-0.5">
                          {getCategoryIcon(bylaw.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{bylaw.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                            {bylaw.content.substring(0, 60)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2">
                        <Badge className={`${getCategoryBadgeColor(bylaw.category)} text-xs`}>
                          {bylaw.category.charAt(0).toUpperCase() + bylaw.category.slice(1)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewModal(bylaw)}
                          className="text-xs">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Read</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs sm:text-sm text-blue-800">
                    📘 Please review all by-laws to understand your rights and responsibilities as a member.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Please provide accurate information for your membership application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+234-xxx-xxx-xxxx"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your full address"
                  required
                />
              </div>

              {/* Guarantor Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Guarantor Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You must provide two guarantors who are current active members of the society
                </p>

                <div className="space-y-6">
                  {/* First Guarantor */}
                  <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3">First Guarantor *</h4>
                    <div className="space-y-2">
                      <Label htmlFor="guarantor1">Select Member</Label>
                      <Select
                        value={formData.guarantor1MemberId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, guarantor1MemberId: value }))}
                      >
                        <SelectTrigger id="guarantor1">
                          <SelectValue placeholder="Select a society member" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem
                              key={member.id}
                              value={member.id}
                              disabled={member.id === formData.guarantor2MemberId}
                            >
                              {member.memberNumber} - {member.firstName} {member.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.guarantor1MemberId && (() => {
                        const selected = members.find(m => m.id === formData.guarantor1MemberId);
                        return selected ? (
                          <div className="mt-2 text-sm text-blue-700">
                            <p><strong>Name:</strong> {selected.firstName} {selected.lastName}</p>
                            <p className="text-xs text-blue-600 italic">Contact information will be verified by admin</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* Second Guarantor */}
                  <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                    <h4 className="font-medium text-green-900 mb-3">Second Guarantor *</h4>
                    <div className="space-y-2">
                      <Label htmlFor="guarantor2">Select Member</Label>
                      <Select
                        value={formData.guarantor2MemberId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, guarantor2MemberId: value }))}
                      >
                        <SelectTrigger id="guarantor2">
                          <SelectValue placeholder="Select a different society member" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem
                              key={member.id}
                              value={member.id}
                              disabled={member.id === formData.guarantor1MemberId}
                            >
                              {member.memberNumber} - {member.firstName} {member.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.guarantor2MemberId && (() => {
                        const selected = members.find(m => m.id === formData.guarantor2MemberId);
                        return selected ? (
                          <div className="mt-2 text-sm text-green-700">
                            <p><strong>Name:</strong> {selected.firstName} {selected.lastName}</p>
                            <p className="text-xs text-green-600 italic">Contact information will be verified by admin</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {formData.guarantor1MemberId && formData.guarantor2MemberId && formData.guarantor1MemberId === formData.guarantor2MemberId && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        You must select two different guarantors
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* By-Law View Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-xl">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">
                    {selectedByLaw && getCategoryIcon(selectedByLaw.category)}
                  </div>
                  <span>{selectedByLaw?.title}</span>
                </div>
                <Badge className={getCategoryBadgeColor(selectedByLaw?.category || '')}>
                  {selectedByLaw?.category ?
                    selectedByLaw.category.charAt(0).toUpperCase() + selectedByLaw.category.slice(1) :
                    'Unknown'
                  }
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Published on {selectedByLaw && new Date(selectedByLaw.createdAt).toLocaleDateString()}
                {selectedByLaw && selectedByLaw.createdAt.getTime() !== selectedByLaw.updatedAt.getTime() &&
                  ` • Last updated on ${new Date(selectedByLaw.updatedAt).toLocaleDateString()}`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="prose prose-lg max-w-none">
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="text-gray-800 leading-relaxed">
                    {selectedByLaw && formatContent(selectedByLaw.content)}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
