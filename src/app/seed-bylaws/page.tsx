'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockByLaws } from '@/lib/mock-data';
import { CheckCircle2, AlertCircle, Database, Upload } from 'lucide-react';

export default function SeedByLawsPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [results, setResults] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [existingCount, setExistingCount] = useState<number | null>(null);

  const checkExistingBylaws = async () => {
    if (!isSupabaseConfigured()) {
      setResults({ success: false, message: 'Supabase is not configured' });
      return;
    }

    try {
      const { data, error, count } = await supabase
        .from('bylaws')
        .select('*', { count: 'exact' });

      if (error) {
        setResults({ success: false, message: `Error checking bylaws: ${error.message}` });
        return;
      }

      setExistingCount(count || 0);
      setResults({ 
        success: true, 
        message: `Found ${count || 0} existing bylaws in Supabase`, 
        count: count || 0 
      });
    } catch (err: any) {
      setResults({ success: false, message: `Error: ${err.message}` });
    }
  };

  const seedBylaws = async () => {
    if (!isSupabaseConfigured()) {
      setResults({ success: false, message: 'Supabase is not configured. Please check your environment variables.' });
      return;
    }

    setIsSeeding(true);
    setResults(null);

    try {
      // First, delete all existing bylaws
      const { error: deleteError } = await supabase
        .from('bylaws')
        .delete()
        .gte('id', 'bl0'); // Delete all bylaws with id >= 'bl0'

      if (deleteError) {
        console.warn('Delete warning:', deleteError.message);
      }

      // Prepare bylaws data for insertion
      const bylawsToInsert = mockByLaws.map(bylaw => ({
        id: bylaw.id,
        society_id: bylaw.societyId,
        title: bylaw.title,
        content: bylaw.content,
        category: bylaw.category,
        created_by: bylaw.createdBy,
        created_at: bylaw.createdAt.toISOString(),
        updated_at: bylaw.updatedAt.toISOString(),
        is_active: bylaw.isActive
      }));

      // Insert new bylaws
      const { data, error: insertError } = await supabase
        .from('bylaws')
        .insert(bylawsToInsert)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert bylaws: ${insertError.message}`);
      }

      setResults({
        success: true,
        message: `Successfully seeded ${data?.length || mockByLaws.length} bylaws to Supabase!`,
        count: data?.length || mockByLaws.length
      });

      // Refresh the count
      await checkExistingBylaws();

    } catch (err: any) {
      setResults({
        success: false,
        message: `Seeding failed: ${err.message}`
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Database className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              Seed By-Laws to Supabase
            </CardTitle>
            <CardDescription className="text-sm">
              Upload the society by-laws to Supabase cloud database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Supabase Status */}
            <div className="p-3 sm:p-4 border rounded-lg bg-white">
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Supabase Status</h3>
              <div className="flex items-center">
                {isSupabaseConfigured() ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-700 text-sm">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-700 text-sm">Not Configured</span>
                  </>
                )}
              </div>
            </div>

            {/* Mock Data Info */}
            <div className="p-3 sm:p-4 border rounded-lg bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-2 text-blue-900 text-sm sm:text-base">Mock By-Laws Data</h3>
              <p className="text-blue-800 text-xs sm:text-sm">
                Ready to seed: <strong>{mockByLaws.length} by-laws</strong>
              </p>
              <ul className="mt-2 space-y-1 text-xs text-blue-700">
                {mockByLaws.map((bylaw, index) => (
                  <li key={bylaw.id}>
                    {index + 1}. {bylaw.title} ({bylaw.category})
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={checkExistingBylaws}
                variant="outline"
                className="flex-1"
                disabled={isSeeding}
              >
                <Database className="h-4 w-4 mr-2" />
                Check Existing Bylaws
              </Button>

              <Button
                onClick={seedBylaws}
                disabled={isSeeding || !isSupabaseConfigured()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isSeeding ? 'Seeding...' : 'Seed Bylaws'}
              </Button>
            </div>

            {/* Results */}
            {results && (
              <Alert variant={results.success ? "default" : "destructive"} className="mt-4">
                <div className="flex items-start">
                  {results.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                  )}
                  <div>
                    <AlertDescription className="text-sm">{results.message}</AlertDescription>
                    {results.count !== undefined && (
                      <p className="text-xs sm:text-sm mt-2 font-medium">
                        Total bylaws in database: {results.count}
                      </p>
                    )}
                  </div>
                </div>
              </Alert>
            )}

            {/* Instructions */}
            <div className="p-3 sm:p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold mb-2 text-yellow-900 text-sm sm:text-base">Instructions</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-yellow-800">
                <li>Click "Check Existing Bylaws" to see what's currently in Supabase</li>
                <li>Click "Seed Bylaws" to upload all by-laws</li>
                <li>This will replace existing bylaws with fresh data</li>
                <li>After seeding, bylaws will appear everywhere in the app</li>
              </ol>
            </div>

            {/* Back Button */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                ← Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
