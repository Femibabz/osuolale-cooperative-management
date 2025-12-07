'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/lib/mock-data';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function TestConnectionPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [writeTestResult, setWriteTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWriteLoading, setIsWriteLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string>('');
  const [keepTestRecord, setKeepTestRecord] = useState(true); // Keep record by default

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult('');
    setDiagnostics('');

    try {
      // Step 1: Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      let diagInfo = '🔍 DIAGNOSTICS:\n\n';
      diagInfo += `Environment Variables Status:\n`;
      diagInfo += `- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set (length: ' + supabaseUrl.length + ')' : '❌ NOT SET'}\n`;
      diagInfo += `- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set (length: ' + supabaseKey.length + ')' : '❌ NOT SET'}\n`;
      diagInfo += `\nURL Preview: ${supabaseUrl.substring(0, 30)}...\n`;
      diagInfo += `Key Preview: ${supabaseKey.substring(0, 30)}...\n\n`;

      setDiagnostics(diagInfo);

      // Step 2: Check if Supabase is configured
      const configured = isSupabaseConfigured();

      if (!configured) {
        setTestResult(`❌ Supabase NOT configured

Environment variables are not properly set.

Please check:
1. Variables are named EXACTLY:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
2. Values are copied correctly from Supabase
3. Site was redeployed after adding variables
4. No extra spaces in variable names or values

Currently using localStorage (device-specific data)`);
        setIsLoading(false);
        return;
      }

      diagInfo += `✅ Supabase client configured\n`;
      diagInfo += `Attempting database connection...\n\n`;
      setDiagnostics(diagInfo);

      // Step 3: Try to fetch applications from database
      const applications = await db.getApplications();

      diagInfo += `✅ Database query successful!\n`;
      diagInfo += `Found ${applications.length} applications\n\n`;
      setDiagnostics(diagInfo);

      setTestResult(`✅ Supabase CONNECTED! Found ${applications.length} applications in cloud database.

This means:
- ✅ Environment variables are correctly set
- ✅ Database connection is working
- ✅ Data queries are successful

⚠️ IMPORTANT: Run the WRITE TEST below to ensure data can be saved!`);

    } catch (error: any) {
      console.error('Connection error:', error);

      let diagInfo = diagnostics + `\n❌ Error occurred:\n`;
      diagInfo += `Error message: ${error.message || error}\n`;
      diagInfo += `Error type: ${error.name || 'Unknown'}\n\n`;
      setDiagnostics(diagInfo);

      setTestResult(`❌ Connection failed: ${error.message || error}

Possible issues:
1. Database schema not run in Supabase SQL Editor
   → Go to Supabase → SQL Editor → Run supabase-schema.sql

2. Incorrect environment variable values
   → Check Netlify Site Settings → Environment Variables
   → Verify URL and Key match your Supabase project

3. Supabase project paused/inactive
   → Check your Supabase dashboard
   → Ensure project is "Active"

4. Network/CORS issue
   → Check browser console for detailed errors
   → Press F12 to open developer tools`);
    } finally {
      setIsLoading(false);
    }
  };

  const testWrite = async () => {
    setIsWriteLoading(true);
    setWriteTestResult('');

    try {
      // Check if Supabase is configured
      const configured = isSupabaseConfigured();
      if (!configured) {
        setWriteTestResult('❌ Supabase not configured. Run CONNECTION TEST first.');
        setIsWriteLoading(false);
        return;
      }

      // Try to insert a test application
      const testApplication = {
        society_id: 'soc1',
        first_name: 'Test',
        last_name: 'WriteTest',
        email: `test${Date.now()}@example.com`,
        phone: '+234-800-000-0000',
        address: 'Test Address',
        occupation: 'Test Occupation',
        monthly_income: 50000,
        guarantor_name: 'Test Guarantor',
        guarantor_phone: '+234-800-000-0001',
        guarantor_address: 'Guarantor Address',
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('membership_applications')
        .insert([testApplication])
        .select()
        .single();

      if (error) {
        console.error('Write error:', error);

        // Check if it's an RLS policy error
        if (error.message.includes('row-level security') || error.message.includes('policy') || error.code === '42501') {
          setWriteTestResult(`❌ WRITE FAILED - Row Level Security (RLS) Policy Error

**THIS IS YOUR PROBLEM!** Supabase is blocking database writes.

**SOLUTION (Follow these exact steps):**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "+ New query" button
5. Open the file "fix-rls-policies.sql" from your GitHub repo
6. Copy ALL the SQL and paste it into the SQL Editor
7. Click "RUN" button (bottom right)
8. Wait for "Success" message
9. Come back here and click "Test Write" again

**What's happening:**
Your database has Row Level Security enabled (good for security!), but the
policies aren't configured to allow the anon key to insert data. The SQL
script will fix this by creating proper policies.

**Technical Details:**
Error: ${error.message}
Code: ${error.code || 'N/A'}`);
        } else if (error.message.includes('violates foreign key constraint') || error.code === '23503') {
          setWriteTestResult(`❌ WRITE FAILED - Missing Society Record

**The test needs a society record with id 'soc1' to exist first.**

**SOLUTION:**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Click "+ New query"
4. Run this SQL to create the society:

INSERT INTO societies (id, name, registration_number, address, phone, email, status, admin_user_id, member_count, total_savings, total_loans, total_shares)
VALUES (
  'soc1',
  'OsuOlale Cooperative Society',
  'OSU-2024-001',
  '123 Society Avenue, Lagos',
  '+234-800-123-4567',
  'admin@osuolale.com',
  'active',
  '1',
  2,
  350000,
  75000,
  125000
);

5. Click RUN
6. Come back and click "Test Write" again

**Technical Details:**
Error: ${error.message}
Code: ${error.code || 'N/A'}`);
        } else {
          setWriteTestResult(`❌ WRITE FAILED - ${error.message}

**Error Type:** ${error.code || 'Unknown'}

**Possible causes:**

1. **Database schema not run** (tables don't exist)
   → Go to Supabase → SQL Editor
   → Run the entire supabase-schema.sql file
   → Then run fix-rls-policies.sql

2. **RLS policy blocking insert**
   → Run fix-rls-policies.sql in Supabase SQL Editor

3. **Missing society record**
   → Run the society insert SQL from above

**Full Error Details:**
Message: ${error.message}
Code: ${error.code || 'N/A'}
Details: ${error.details || 'N/A'}
Hint: ${error.hint || 'N/A'}`);
        }
            } else {
        // Success! Optionally clean up the test record
        let statusMessage = '';
        if (keepTestRecord) {
          statusMessage = `

- Record ID: ${data.id}
- Email: ${testApplication.email}

**To verify in Supabase:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Table Editor" → "membership_applications"  
4. You should see this test record!
5. ⚠️ DELETE it manually after verification

 **This proves the database write is working!**`;
        } else {
          if (data && data.id) {
            await supabase
              .from('membership_applications')
              .delete()
              .eq('id', data.id);
          }
          statusMessage = `

- Record was created with ID: ${data.id}
- Successfully inserted then removed  
- ✅ Check "Keep test record" below to verify in Supabase`;
        }

        setWriteTestResult(`✅ WRITE TEST SUCCESSFUL!

**Excellent!** Database writes are working perfectly.

**What this means:**
- ✅ Environment variables are correct
- ✅ Database connection is working  
- ✅ RLS policies are properly configured
- ✅ Membership applications WILL save to Supabase
- ✅ Data is shared across ALL devices
${statusMessage}


**Next Steps:**
1. Go to /apply and submit a real membership application
2. Log in as admin on another device
3. You should see the application appear!`);
      }

    } catch (error: any) {
      console.error('Write test error:', error);
      setWriteTestResult(`❌ UNEXPECTED ERROR: ${error.message || error}

This is likely a database schema or configuration issue.

Check browser console (F12) for detailed error information.

Common fixes:
1. Run supabase-schema.sql in Supabase SQL Editor
2. Run fix-rls-policies.sql in Supabase SQL Editor
3. Verify your Supabase project is active (not paused)`);
    } finally {
      setIsWriteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection & Write Test</CardTitle>
            <CardDescription>
              Diagnose and fix database connection and write issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Connection Test */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-semibold text-lg">Test Connection (Read Access)</h3>
              </div>
              <p className="text-sm text-gray-600 ml-10">
                Verifies environment variables and database connectivity
              </p>
              <Button
                onClick={testConnection}
                disabled={isLoading}
                className="w-full ml-10"
              >
                {isLoading ? 'Testing Connection...' : 'Run Connection Test'}
              </Button>

              {diagnostics && (
                <Alert className="ml-10">
                  <AlertDescription>
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {diagnostics}
                    </pre>
                  </AlertDescription>
                </Alert>
              )}

              {testResult && (
                <Alert className={`ml-10 ${testResult.includes('✅') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                  <AlertDescription>
                    <pre className="text-sm whitespace-pre-wrap">
                      {testResult}
                    </pre>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Step 2: Write Test */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-semibold text-lg">Test Write Operations (CRITICAL)</h3>
              </div>
              <p className="text-sm text-gray-600 ml-10">
                Verifies that membership applications can be saved to database
              </p>
              <div className="ml-10 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ This test will likely show your issue! Run this to diagnose why applications aren't saving.
                </p>
              
              {/* Keep Test Record Checkbox */}
              <div className="ml-10 flex items-center space-x-2 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <input
                  type="checkbox"
                  id="keepRecord"
                  checked={keepTestRecord}
                  onChange={(e) => setKeepTestRecord(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="keepRecord" className="text-sm text-gray-700 cursor-pointer flex-1">
                  <strong>Keep test record in database</strong> (so you can verify it in Supabase Table Editor - remember to delete it after!)
                </label>
              </div>
              </div>
              <Button
                onClick={testWrite}
                disabled={isWriteLoading}
                className="w-full ml-10 bg-orange-600 hover:bg-orange-700"
              >
                {isWriteLoading ? 'Testing Write Access...' : 'Run Write Test'}
              </Button>

              {writeTestResult && (
                <Alert className={`ml-10 ${writeTestResult.includes('✅') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                  <AlertDescription>
                    <pre className="text-sm whitespace-pre-wrap">
                      {writeTestResult}
                    </pre>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Troubleshooting Guide */}
            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold mb-3 text-lg">📚 Troubleshooting Guide</h3>
              <div className="text-sm space-y-4 text-gray-700 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="font-semibold text-red-600 mb-2">❌ If Connection Test fails:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Verify environment variables in Netlify Deploy Settings</li>
                    <li>Ensure you redeployed after adding variables</li>
                    <li>Run supabase-schema.sql in Supabase SQL Editor</li>
                    <li>Check Supabase project is active (not paused)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-orange-600 mb-2">⚠️ If Write Test fails (MOST LIKELY YOUR ISSUE):</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Most Common:</strong> Run fix-rls-policies.sql in Supabase SQL Editor</li>
                    <li>Ensure supabase-schema.sql was run completely</li>
                    <li>Create society record with id 'soc1' (see error message for SQL)</li>
                    <li>Verify your anon key has proper permissions</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="font-semibold text-blue-800 mb-1">💡 Pro Tip:</p>
                  <p className="text-blue-700">
                    95% of write failures are RLS policy issues. Running fix-rls-policies.sql
                    will almost certainly fix your problem!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links Card */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-teal-600 hover:underline font-medium"
            >
              → Open Supabase Dashboard (SQL Editor)
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-teal-600 hover:underline font-medium"
            >
              → GitHub (get fix-rls-policies.sql)
            </a>
            <Link
              href="/apply"
              className="block text-teal-600 hover:underline font-medium"
            >
              → Submit Test Application
            </Link>
            <Link
              href="/"
              className="block text-teal-600 hover:underline font-medium"
            >
              → Back to Login/Home
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
