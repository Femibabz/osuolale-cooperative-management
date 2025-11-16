'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/lib/mock-data';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function TestConnectionPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult('');

    try {
      // Check if Supabase is configured
      const configured = isSupabaseConfigured();

      if (!configured) {
        setTestResult('❌ Supabase NOT configured - using localStorage (device-specific data)');
        setIsLoading(false);
        return;
      }

      // Try to fetch applications from database
      const applications = await db.getApplications();

      setTestResult(`✅ Supabase CONNECTED! Found ${applications.length} applications in cloud database.

This means:
- Data is now shared across ALL devices
- Applications submitted on Phone A will appear on Computer B
- Ready for multi-device testing!`);

    } catch (error) {
      console.error('Connection error:', error);
      setTestResult(`❌ Connection failed: ${error}

Please check:
1. .env.local file exists in osuolale-mvp folder (not in src!)
2. NEXT_PUBLIC_SUPABASE_URL is set correctly
3. NEXT_PUBLIC_SUPABASE_ANON_KEY is set correctly
4. Dev server was restarted after creating .env.local`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection Test</CardTitle>
            <CardDescription>
              Test if your app is connected to Supabase cloud database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testConnection}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>

            {testResult && (
              <Alert className={testResult.includes('✅') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                <AlertDescription className="whitespace-pre-wrap font-mono text-sm">
                  {testResult}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What This Tests:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Checks if Supabase credentials are configured</li>
                <li>✓ Attempts to fetch data from cloud database</li>
                <li>✓ Confirms cross-device data sharing is working</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Testing Cross-Device:</h3>
              <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
                <li>Run this test on your computer - should show ✅</li>
                <li>Go to /apply on mobile phone - submit application</li>
                <li>Go to /admin/applications on computer - see the application!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
