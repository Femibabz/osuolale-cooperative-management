import { Member, Settings } from '@/types';

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
  static calculateLoanInfo(member: Member, settings?: Settings): LoanInfo | null {
    // If member has no active loan
    if (!member.loanBalance || member.loanBalance <= 0 || !member.loanStartDate) {
      return null;
    }

    const now = new Date();
    const loanStartDate = member.loanStartDate;
    const loanDurationMonths = member.loanDurationMonths || settings?.standardLoanTermMonths || 12;
    const annualInterestRate = member.loanInterestRate || settings?.loanInterestRate || 1.5;
    const monthlyInterestRate = annualInterestRate / 100; // Convert percentage to decimal

    // Calculate loan end date (12 months from approval/start date)
    const loanEndDate = new Date(loanStartDate);
    loanEndDate.setMonth(loanEndDate.getMonth() + loanDurationMonths);

    // Calculate months elapsed since loan start
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
    let nextPaymentDate: Date | null = null;
    if (!isOverdue && member.loanBalance > 0) {
      nextPaymentDate = new Date(loanStartDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + monthsElapsed + 1);
      // If we're in the same month as approval, set it to next month
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

  static isEligibleForLoan(member: Member, settings: Settings): { eligible: boolean; reason?: string } {
    // Check if member has been with the organization long enough
    const membershipDuration = this.getMonthsDifference(member.dateJoined, new Date());
    if (membershipDuration < settings.newMemberLoanEligibilityMonths) {
      return {
        eligible: false,
        reason: `Must be a member for at least ${settings.newMemberLoanEligibilityMonths} months. Current tenure: ${membershipDuration} months.`
      };
    }

    // Check if member has an existing active loan
    if (member.loanBalance > 0) {
      return {
        eligible: false,
        reason: 'Cannot apply for a new loan while having an outstanding loan balance.'
      };
    }

    return { eligible: true };
  }

  static getMaxLoanAmount(member: Member, settings: Settings): number {
    const totalSharesAndSavings = member.sharesBalance + member.savingsBalance;
    return totalSharesAndSavings * settings.loanToSharesSavingsRatio;
  }

  static validateLoanAmount(amount: number, member: Member, settings: Settings): { valid: boolean; error?: string } {
    const maxAmount = this.getMaxLoanAmount(member, settings);

    if (amount <= 0) {
      return { valid: false, error: 'Loan amount must be greater than zero.' };
    }

    if (amount > maxAmount) {
      return {
        valid: false,
        error: `Maximum loan amount is ${this.formatCurrency(maxAmount)} (${settings.loanToSharesSavingsRatio}x your shares and savings).`
      };
    }

    return { valid: true };
  }

  static processMonthlyInterest(member: Member, settings: Settings): {
    newInterestCharge: number;
    transactions: Array<{
      type: string;
      amount: number;
      description: string;
      processedBy: string;
    }>;
  } {
    const transactions: Array<{
      type: string;
      amount: number;
      description: string;
      processedBy: string;
    }> = [];

    let newInterestCharge = 0;

    // Only process if member has an active loan
    if (member.loanBalance <= 0 || !member.loanStartDate) {
      return { newInterestCharge, transactions };
    }

    const monthlyInterestRate = (settings.loanInterestRate / 100); // Convert to decimal

    // Calculate new interest ALWAYS on original loan principal only
    // Never compound interest into principal - just accumulate in interest balance
    newInterestCharge = member.loanBalance * monthlyInterestRate;

    transactions.push({
      type: 'interest_charge',
      amount: newInterestCharge,
      description: `Monthly interest at ${settings.loanInterestRate}% annual rate on principal ${this.formatCurrency(member.loanBalance)}`,
      processedBy: 'system'
    });

    return { newInterestCharge, transactions };
  }

  static getRemainingLoanMonths(member: Member, settings?: Settings): number {
    if (!member.loanBalance || member.loanBalance <= 0 || !member.loanStartDate) {
      return 0;
    }

    const loanDurationMonths = member.loanDurationMonths || settings?.standardLoanTermMonths || 12;
    const monthsElapsed = this.getMonthsDifference(member.loanStartDate, new Date());

    return Math.max(0, loanDurationMonths - monthsElapsed);
  }

  static isLoanOverdue(member: Member, settings?: Settings): boolean {
    if (!member.loanBalance || member.loanBalance <= 0 || !member.loanStartDate) {
      return false;
    }

    const remainingMonths = this.getRemainingLoanMonths(member, settings);
    return remainingMonths <= 0;
  }
}
