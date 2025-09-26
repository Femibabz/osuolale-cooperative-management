import { Settings } from '@/types';
import { MonthlyInterestProcessor, MonthlyProcessingResult } from './monthly-interest-processor';

export interface ProcessingHistory {
  month: string; // Format: "YYYY-MM"
  processedAt: Date;
  result: MonthlyProcessingResult;
}

export class AutomaticInterestService {
  private static readonly STORAGE_KEY = 'osuolale_processing_history';

  static getProcessingHistory(): ProcessingHistory[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as ProcessingHistory[];
    // Convert date strings back to Date objects
    return history.map(entry => ({
      ...entry,
      processedAt: new Date(entry.processedAt)
    }));
  }

  static saveProcessingRecord(record: ProcessingHistory): void {
    if (typeof window === 'undefined') return;

    const history = this.getProcessingHistory();
    // Remove any existing record for the same month (shouldn't happen, but just in case)
    const filteredHistory = history.filter(entry => entry.month !== record.month);
    filteredHistory.push(record);

    // Keep only last 12 months of history
    filteredHistory.sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime());
    const recentHistory = filteredHistory.slice(0, 12);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentHistory));
  }

  static getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  static wasMonthProcessed(monthKey: string): boolean {
    const history = this.getProcessingHistory();
    return history.some(entry => entry.month === monthKey);
  }

  static needsProcessing(): boolean {
    const currentMonth = this.getCurrentMonthKey();
    return !this.wasMonthProcessed(currentMonth);
  }

  static async processCurrentMonth(settings: Settings): Promise<{
    processed: boolean;
    result?: MonthlyProcessingResult;
    error?: string;
  }> {
    const currentMonth = this.getCurrentMonthKey();

    // Check if already processed this month
    if (this.wasMonthProcessed(currentMonth)) {
      return { processed: false };
    }

    try {
      // Process monthly interest for all members
      const result = MonthlyInterestProcessor.processAllMembers(settings);

      // Save processing record
      const record: ProcessingHistory = {
        month: currentMonth,
        processedAt: new Date(),
        result
      };

      this.saveProcessingRecord(record);

      return { processed: true, result };
    } catch (error) {
      console.error('Error processing monthly interest:', error);
      return {
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static getLastProcessingResult(): ProcessingHistory | null {
    const history = this.getProcessingHistory();
    if (history.length === 0) return null;

    // Return the most recent processing
    return history.sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime())[0];
  }

  static getMonthName(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
}
