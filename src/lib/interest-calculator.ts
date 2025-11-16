import { db } from './mock-data';
import { Member } from '@/types';
import { LoanCalculator } from './loan-utils';

export class InterestCalculator {
  /**
   * Calculate monthly interest charge for a member
   * 1.5% monthly on remaining loan balance
   */
  static calculateMonthlyInterest(member: Member): number {
    if (!member.loanBalance || member.loanBalance <= 0) {
      return 0;
    }

    const monthlyInterestRate = 0.015; // 1.5% monthly
    return member.loanBalance * monthlyInterestRate;
  }

  /**
   * Apply monthly interest charges to all members with active loans
   * Interest is charged starting from the month the loan was issued
   */
  static async applyMonthlyInterestCharges(processedBy: string = 'system'): Promise<{
    processed: number;
    totalInterestCharged: number;
    results: Array<{
      memberId: string;
      memberName: string;
      loanBalance: number;
      interestCharged: number;
      newInterestBalance: number;
    }>;
  }> {
    const members = await db.getMembers();
    const results: Array<{
      memberId: string;
      memberName: string;
      loanBalance: number;
      interestCharged: number;
      newInterestBalance: number;
    }> = [];

    let totalInterestCharged = 0;
    let processed = 0;

    for (const member of members) {
      if (member.loanBalance && member.loanBalance > 0 && member.loanStartDate) {
        // Check if interest should be charged this month
        // Interest starts from the month the loan was issued
        const shouldChargeInterest = await this.shouldChargeInterestThisMonth(member);

        if (shouldChargeInterest) {
          const monthlyInterest = this.calculateMonthlyInterest(member);

          if (monthlyInterest > 0) {
            const newInterestBalance = member.interestBalance + monthlyInterest;

            // Update member's interest balance
            await db.updateMember(member.id, {
              interestBalance: newInterestBalance
            });

            // Create transaction record
            const referenceNumber = `INT${Date.now()}-${member.id}`;
            await db.createTransaction({
              memberId: member.id,
              type: 'interest_charge',
              amount: monthlyInterest,
              description: `Monthly interest charge (1.5% on loan balance)`,
              date: new Date(),
              balanceAfter: newInterestBalance,
              referenceNumber,
              processedBy,
            });

            results.push({
              memberId: member.id,
              memberName: `${member.firstName} ${member.lastName}`,
              loanBalance: member.loanBalance,
              interestCharged: monthlyInterest,
              newInterestBalance,
            });

            totalInterestCharged += monthlyInterest;
            processed++;
          }
        }
      }
    }

    return {
      processed,
      totalInterestCharged,
      results,
    };
  }

  /**
   * Check if interest should be charged for a member this month
   * Interest starts from the month the loan was issued (month 1), not month 2
   */
  static async shouldChargeInterestThisMonth(member: Member): Promise<boolean> {
    if (!member.loanBalance || member.loanBalance <= 0 || !member.loanStartDate) {
      return false;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const loanStartDate = member.loanStartDate;

    // Check if we've passed the loan start month (interest starts from month 1)
    const loanStartMonth = loanStartDate.getMonth();
    const loanStartYear = loanStartDate.getFullYear();

    // Interest should be charged starting from the same month the loan was issued
    const shouldStartCharging =
      (currentYear > loanStartYear) ||
      (currentYear === loanStartYear && currentMonth >= loanStartMonth);

    if (!shouldStartCharging) {
      return false;
    }

    // Check if interest has already been charged this month
    const transactions = await db.getTransactionsByMember(member.id, 1);
    const hasInterestThisMonth = transactions.some(transaction =>
      transaction.type === 'interest_charge' &&
      transaction.date.getMonth() === currentMonth &&
      transaction.date.getFullYear() === currentYear
    );

    return !hasInterestThisMonth;
  }

  /**
   * Process a loan payment and recalculate monthly payment amount
   * This automatically recalculates the monthly payment based on remaining balance and months
   */
  static async processLoanPayment(
    memberId: string,
    paymentAmount: number,
    interestPayment: number = 0,
    processedBy: string = 'member'
  ): Promise<{
    success: boolean;
    message: string;
    newLoanBalance: number;
    newInterestBalance: number;
    newMonthlyPayment: number;
    monthsRemaining: number;
  }> {
    const member = await db.getMemberById(memberId);
    if (!member) {
      return {
        success: false,
        message: 'Member not found',
        newLoanBalance: 0,
        newInterestBalance: 0,
        newMonthlyPayment: 0,
        monthsRemaining: 0,
      };
    }

    if (paymentAmount <= 0) {
      return {
        success: false,
        message: 'Payment amount must be greater than zero',
        newLoanBalance: member.loanBalance,
        newInterestBalance: member.interestBalance,
        newMonthlyPayment: member.monthlyLoanPayment || 0,
        monthsRemaining: 0,
      };
    }

    // Calculate new balances
    const newInterestBalance = Math.max(0, member.interestBalance - interestPayment);
    const principalPayment = paymentAmount - interestPayment;
    const newLoanBalance = Math.max(0, member.loanBalance - principalPayment);

    // Calculate months remaining and new monthly payment
    let newMonthlyPayment = 0;
    let monthsRemaining = 0;

    if (newLoanBalance > 0 && member.loanStartDate) {
      // Calculate months elapsed since loan start
      const now = new Date();
      const monthsElapsed = LoanCalculator.getMonthsDifference(member.loanStartDate, now);
      const totalLoanDuration = 12; // Standard 12-month duration
      monthsRemaining = Math.max(1, totalLoanDuration - monthsElapsed);

      // Recalculate monthly payment: remaining balance / remaining months
      newMonthlyPayment = newLoanBalance / monthsRemaining;
    }

    // Update member record
    await db.updateMember(memberId, {
      loanBalance: newLoanBalance,
      interestBalance: newInterestBalance,
      monthlyLoanPayment: newMonthlyPayment,
    });

    // Create transaction records
    const referenceNumber = `PAY${Date.now()}`;

    // Record loan payment
    if (principalPayment > 0) {
      await db.createTransaction({
        memberId,
        type: 'loan_payment',
        amount: principalPayment,
        description: `Loan principal payment (New monthly payment: ${this.formatCurrency(newMonthlyPayment)})`,
        date: new Date(),
        balanceAfter: newLoanBalance,
        referenceNumber: `${referenceNumber}-PRIN`,
        processedBy,
      });
    }

    // Record interest payment
    if (interestPayment > 0) {
      await db.createTransaction({
        memberId,
        type: 'interest_payment',
        amount: interestPayment,
        description: `Interest payment`,
        date: new Date(),
        balanceAfter: newInterestBalance,
        referenceNumber: `${referenceNumber}-INT`,
        processedBy,
      });
    }

    return {
      success: true,
      message: `Payment processed successfully. Monthly payment recalculated to ${this.formatCurrency(newMonthlyPayment)} over ${monthsRemaining} remaining months`,
      newLoanBalance,
      newInterestBalance,
      newMonthlyPayment,
      monthsRemaining,
    };
  }

  /**
   * Get members who are due for interest charges
   */
  static async getMembersDueForInterest(): Promise<Member[]> {
    const members = await db.getMembers();

    const result: Member[] = [];
    for (const member of members) {
      if (await this.shouldChargeInterestThisMonth(member)) {
        result.push(member);
      }
    }
    return result;
  }

  /**
   * Get interest summary for a specific member
   */
  static async getMemberInterestSummary(memberId: string): Promise<{
    currentLoanBalance: number;
    currentInterestDue: number;
    monthlyInterestRate: number;
    nextMonthlyCharge: number;
    totalInterestPaid: number;
    totalInterestCharged: number;
    monthsWithInterest: number;
  } | null> {
    const member = await db.getMemberById(memberId);
    if (!member) return null;

    const transactions = await db.getTransactionsByMember(memberId, 12);

    const interestCharges = transactions.filter(t => t.type === 'interest_charge');
    const interestPayments = transactions.filter(t => t.type === 'interest_payment');

    const totalInterestCharged = interestCharges.reduce((sum, t) => sum + t.amount, 0);
    const totalInterestPaid = interestPayments.reduce((sum, t) => sum + t.amount, 0);

    const nextMonthlyCharge = this.calculateMonthlyInterest(member);

    // Calculate how many months should have interest (starting from loan issue month)
    const monthsWithInterest = member.loanStartDate ?
      LoanCalculator.getMonthsForInterestCharging(member.loanStartDate) : 0;

    return {
      currentLoanBalance: member.loanBalance,
      currentInterestDue: member.interestBalance,
      monthlyInterestRate: 0.015, // 1.5%
      nextMonthlyCharge,
      totalInterestPaid,
      totalInterestCharged,
      monthsWithInterest,
    };
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  }
}
