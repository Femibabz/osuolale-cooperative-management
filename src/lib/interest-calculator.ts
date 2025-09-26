import { db } from './mock-data';
import { Member } from '@/types';

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
   * This would typically be run monthly by the system
   */
  static applyMonthlyInterestCharges(processedBy: string = 'system'): {
    processed: number;
    totalInterestCharged: number;
    results: Array<{
      memberId: string;
      memberName: string;
      loanBalance: number;
      interestCharged: number;
      newInterestBalance: number;
    }>;
  } {
    const members = db.getMembers();
    const results: Array<{
      memberId: string;
      memberName: string;
      loanBalance: number;
      interestCharged: number;
      newInterestBalance: number;
    }> = [];

    let totalInterestCharged = 0;
    let processed = 0;

    members.forEach(member => {
      if (member.loanBalance && member.loanBalance > 0 && member.loanStartDate) {
        const monthlyInterest = this.calculateMonthlyInterest(member);

        if (monthlyInterest > 0) {
          const newInterestBalance = member.interestBalance + monthlyInterest;

          // Update member's interest balance
          db.updateMember(member.id, {
            interestBalance: newInterestBalance
          });

          // Create transaction record
          const referenceNumber = `INT${Date.now()}-${member.id}`;
          db.createTransaction({
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
    });

    return {
      processed,
      totalInterestCharged,
      results,
    };
  }

  /**
   * Get members who are due for interest charges
   * (have active loans but no interest charge in the current month)
   */
  static getMembersDueForInterest(): Member[] {
    const members = db.getMembers();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return members.filter(member => {
      if (!member.loanBalance || member.loanBalance <= 0 || !member.loanStartDate) {
        return false;
      }

      // Check if interest has already been charged this month
      const transactions = db.getTransactionsByMember(member.id, 1);
      const hasInterestThisMonth = transactions.some(transaction =>
        transaction.type === 'interest_charge' &&
        transaction.date.getMonth() === currentMonth &&
        transaction.date.getFullYear() === currentYear
      );

      return !hasInterestThisMonth;
    });
  }

  /**
   * Get interest summary for a specific member
   */
  static getMemberInterestSummary(memberId: string): {
    currentLoanBalance: number;
    currentInterestDue: number;
    monthlyInterestRate: number;
    nextMonthlyCharge: number;
    totalInterestPaid: number;
    totalInterestCharged: number;
  } | null {
    const member = db.getMemberById(memberId);
    if (!member) return null;

    const transactions = db.getTransactionsByMember(memberId, 12);

    const interestCharges = transactions.filter(t => t.type === 'interest_charge');
    const interestPayments = transactions.filter(t => t.type === 'interest_payment');

    const totalInterestCharged = interestCharges.reduce((sum, t) => sum + t.amount, 0);
    const totalInterestPaid = interestPayments.reduce((sum, t) => sum + t.amount, 0);

    const nextMonthlyCharge = this.calculateMonthlyInterest(member);

    return {
      currentLoanBalance: member.loanBalance,
      currentInterestDue: member.interestBalance,
      monthlyInterestRate: 0.015, // 1.5%
      nextMonthlyCharge,
      totalInterestPaid,
      totalInterestCharged,
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
