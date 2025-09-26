'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { AutomaticInterestService } from '@/lib/automatic-interest-service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoanCalculator } from '@/lib/loan-utils';

export default function AutomaticInterestProcessor() {
  const { user, needsMonthlyProcessing } = useAuth();
  const { settings } = useSettings();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedThisSession, setProcessedThisSession] = useState(false);
  const [processingResult, setProcessingResult] = useState<{
    success: boolean;
    membersProcessed: number;
    totalInterest: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const runAutomaticProcessing = async () => {
      // Only run for admin users, when processing is needed, and not already processed this session
      if (!user || user.role !== 'admin' || !needsMonthlyProcessing || processedThisSession) {
        return;
      }

      setIsProcessing(true);

      try {
        const result = await AutomaticInterestService.processCurrentMonth(settings);

        if (result.processed && result.result) {
          setProcessingResult({
            success: true,
            membersProcessed: result.result.processedMembers,
            totalInterest: result.result.totalInterestCharged
          });
          setProcessedThisSession(true);
        } else if (result.error) {
          setProcessingResult({
            success: false,
            membersProcessed: 0,
            totalInterest: 0,
            error: result.error
          });
        }
      } catch (error) {
        setProcessingResult({
          success: false,
          membersProcessed: 0,
          totalInterest: 0,
          error: 'Failed to process monthly interest automatically'
        });
      } finally {
        setIsProcessing(false);
      }
    };

    runAutomaticProcessing();
  }, [user, needsMonthlyProcessing, processedThisSession, settings]);

  // Don't render anything if not admin or no processing needed
  if (!user || user.role !== 'admin' || (!isProcessing && !processingResult)) {
    return null;
  }

  return (
    <div className="mb-4">
      {isProcessing && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            🔄 Processing monthly interest automatically... Please wait.
          </AlertDescription>
        </Alert>
      )}

      {processingResult && (
        <Alert className={processingResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertDescription className={processingResult.success ? "text-green-800" : "text-red-800"}>
            {processingResult.success ? (
              <>
                ✅ Monthly interest processed automatically! {processingResult.membersProcessed} member(s) processed,
                total interest charged: {LoanCalculator.formatCurrency(processingResult.totalInterest)}
              </>
            ) : (
              <>
                ❌ Automatic interest processing failed: {processingResult.error}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
