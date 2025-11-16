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

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    monthlyIncome: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorAddress: '',
  });

  useEffect(() => {
    // Load active by-laws for prospective members
    const loadByLaws = async () => {
      const activeByLaws = await db.getActiveByLaws();
      setByLaws(activeByLaws);
    };
    loadByLaws();
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
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'occupation', 'monthlyIncome', 'guarantorName', 'guarantorPhone', 'guarantorAddress'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

      if (missingFields.length > 0) {
        setError('Please fill in all required fields');
        return;
      }

      // Create application
      const application = await db.createApplication({
        societyId: 'soc1',
        ...formData,
        monthlyIncome: parseFloat(formData.monthlyIncome),
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Membership Application</h1>
          <p className="mt-2 text-gray-600">Join OsuOlale Cooperative Society</p>
        </div>

        {/* Society By-Laws Section */}
        {byLaws.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Society By-Laws
                  </CardTitle>
                  <CardDescription>
                    Review our society's governing principles before applying for membership
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowByLaws(!showByLaws)}
                  className="shrink-0">
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
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-600">
                          {getCategoryIcon(bylaw.category)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{bylaw.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {bylaw.content.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getCategoryBadgeColor(bylaw.category)}>
                          {bylaw.category.charAt(0).toUpperCase() + bylaw.category.slice(1)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewModal(bylaw)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Read
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
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

              {/* Employment Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Employment Information</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation *</Label>
                    <Input
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      placeholder="Your current occupation"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Monthly Income (NGN) *</Label>
                    <Input
                      id="monthlyIncome"
                      name="monthlyIncome"
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={handleInputChange}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Guarantor Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Guarantor Information</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guarantorName">Guarantor Full Name *</Label>
                    <Input
                      id="guarantorName"
                      name="guarantorName"
                      value={formData.guarantorName}
                      onChange={handleInputChange}
                      placeholder="Full name of your guarantor"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorPhone">Guarantor Phone Number *</Label>
                    <Input
                      id="guarantorPhone"
                      name="guarantorPhone"
                      value={formData.guarantorPhone}
                      onChange={handleInputChange}
                      placeholder="+234-xxx-xxx-xxxx"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorAddress">Guarantor Address *</Label>
                    <Textarea
                      id="guarantorAddress"
                      name="guarantorAddress"
                      value={formData.guarantorAddress}
                      onChange={handleInputChange}
                      placeholder="Full address of your guarantor"
                      required
                    />
                  </div>
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
