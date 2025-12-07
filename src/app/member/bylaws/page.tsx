'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Book, Users, DollarSign, Scale, Eye } from 'lucide-react';
import { db } from '@/lib/mock-data';
import { ByLaw } from '@/types';

export default function MemberByLawsPage() {
  const { user } = useAuth();
  const [byLaws, setByLaws] = useState<ByLaw[]>([]);
  const [selectedByLaw, setSelectedByLaw] = useState<ByLaw | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Load only active by-laws for members
    const loadByLaws = async () => {
      const activeByLaws = await db.getActiveByLaws();
      setByLaws(activeByLaws);
    };

    loadByLaws();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'membership':
        return <Users className="h-5 w-5" />;
      case 'financial':
        return <DollarSign className="h-5 w-5" />;
      case 'governance':
        return <Scale className="h-5 w-5" />;
      case 'general':
        return <Book className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
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

  const getByLawsByCategory = (category: string) => {
    if (category === 'all') return byLaws;
    return byLaws.filter(bylaw => bylaw.category === category);
  };

  const openViewModal = (bylaw: ByLaw) => {
    setSelectedByLaw(bylaw);
    setIsViewModalOpen(true);
  };

  const formatContent = (content: string) => {
    // Simple formatting: preserve line breaks and add some basic structure
    return content.split('\n').map((line, index) => (
      <p key={index} className={line.trim() === '' ? 'mb-4' : 'mb-2'}>
        {line}
      </p>
    ));
  };

  const categories = [
    { id: 'all', label: 'All By-Laws', icon: <FileText className="h-4 w-4" /> },
    { id: 'membership', label: 'Membership', icon: <Users className="h-4 w-4" /> },
    { id: 'financial', label: 'Financial', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'governance', label: 'Governance', icon: <Scale className="h-4 w-4" /> },
    { id: 'general', label: 'General', icon: <Book className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Society By-Laws</h1>
        <p className="text-gray-600 mt-1">
          Review the official by-laws that govern our cooperative society
        </p>
      </div>

      {byLaws.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No By-Laws Available</h3>
            <p className="text-gray-600">
              The society by-laws are currently being prepared. Please check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center"
              >
                {category.icon}
                <span className="ml-2">{category.label}</span>
              </Button>
            ))}
          </div>

          {/* By-Laws List */}
          <div className="grid gap-4">
            {getByLawsByCategory(selectedCategory).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedCategory === 'all' ? 'No By-Laws Available' : `No ${categories.find(c => c.id === selectedCategory)?.label} By-Laws`}
                  </h3>
                  <p className="text-gray-600">
                    {selectedCategory === 'all'
                      ? 'The society by-laws are currently being prepared.'
                      : 'There are currently no by-laws in this category.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              getByLawsByCategory(selectedCategory).map((bylaw) => (
                <Card key={bylaw.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-blue-600">
                          {getCategoryIcon(bylaw.category)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{bylaw.title}</CardTitle>
                          <CardDescription className="mt-1">
                            Last updated on {new Date(bylaw.updatedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getCategoryBadgeColor(bylaw.category)}>
                        {bylaw.category.charAt(0).toUpperCase() + bylaw.category.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {bylaw.content.substring(0, 150)}...
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewModal(bylaw)}
                        className="ml-4 shrink-0"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Read
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* View Modal */}
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
  );
}
