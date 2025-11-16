import { Member } from '@/types';

export interface LoanInfo {
  monthsRemaining: number;
  interestDue: number;
  monthlyInterestCharge: number;
  totalAmountDue: number;
  isOverdue: boolean;
  nextPaymentDate: Date | null;
  loanEndDate: Date | null;
}

export class LoanCalculator {
  static calculateLoanInfo(member: Member): LoanInfo | null {
    // If member has no active loan
    if (!member.loanBalance || member.loanBalance <= 0 || !member.loanStartDate) {
      return null;
    }

    const now = new Date();
    const loanStartDate = member.loanStartDate;
    const loanDurationMonths = 12; // Standard 12-month duration
    const monthlyInterestRate = 0.015; // 1.5% monthly

    // Calculate loan end date (12 months from approval/start date)
    const loanEndDate = new Date(loanStartDate);
    loanEndDate.setMonth(loanEndDate.getMonth() + loanDurationMonths);

    // Calculate months elapsed since loan start (including the first month)
    const monthsElapsed = this.getMonthsDifference(loanStartDate, now);

    // Calculate months remaining
    const monthsRemaining = Math.max(0, loanDurationMonths - monthsElapsed);

    // Calculate monthly interest charge on remaining loan balance (1.5% monthly)
    const monthlyInterestCharge = member.loanBalance * monthlyInterestRate;

    // Interest due is the accumulated unpaid interest
    const interestDue = member.interestBalance || 0;

    // Total amount due (principal + interest)
    const totalAmountDue = member.loanBalance + interestDue;

    // Check if loan is overdue (past 12 months from approval)
    const isOverdue = monthsElapsed > loanDurationMonths;

    // Calculate next payment date (monthly from approval date)
    // Interest is due starting from the same month the loan was issued
    let nextPaymentDate: Date | null = null;
    if (!isOverdue && member.loanBalance > 0) {
      nextPaymentDate = new Date(loanStartDate);
      // First payment is due in the same month as loan approval
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + monthsElapsed);

      // If the calculated date is in the past, move to next month
      if (nextPaymentDate <= now) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
    }

    return {
      monthsRemaining,
      interestDue,
      monthlyInterestCharge,
      totalAmountDue,
      isOverdue,
      nextPaymentDate,
      loanEndDate,
    };
  }

  /**
   * Recalculate monthly payment based on remaining loan balance
   * This should be called whenever a loan payment is made
   */
  static recalculateMonthlyPayment(member: Member): number {
    if (!member.loanBalance || member.loanBalance <= 0 || !member.loanStartDate) {
      return 0;
    }

    const now = new Date();
    const loanStartDate = member.loanStartDate;
    const loanDurationMonths = 12; // Standard 12-month duration

    // Calculate months elapsed and remaining
    const monthsElapsed = this.getMonthsDifference(loanStartDate, now);
    const monthsRemaining = Math.max(1, loanDurationMonths - monthsElapsed); // At least 1 month

    // Calculate new monthly payment based on remaining balance and remaining months
    const newMonthlyPayment = member.loanBalance / monthsRemaining;

    return newMonthlyPayment;
  }

  /**
   * Get the number of months that should have interest charged
   * Interest starts from the month the loan was issued
   */
  static getMonthsForInterestCharging(loanStartDate: Date, currentDate: Date = new Date()): number {
    // Interest is due starting from the month the loan was issued
    const monthsElapsed = this.getMonthsDifference(loanStartDate, currentDate);
    return Math.max(0, monthsElapsed + 1); // +1 because interest starts from month 1
  }

  static getMonthsDifference(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  }

  static getLoanStatusColor(loanInfo: LoanInfo | null): string {
    if (!loanInfo) return 'text-gray-500';
    if (loanInfo.isOverdue) return 'text-red-600';
    if (loanInfo.monthsRemaining <= 2) return 'text-orange-600';
    return 'text-green-600';
  }

  static getLoanStatusText(loanInfo: LoanInfo | null): string {
    if (!loanInfo) return 'No active loan';
    if (loanInfo.isOverdue) return 'Overdue';
    if (loanInfo.monthsRemaining <= 2) return 'Due soon';
    return 'On track';
  }
}
