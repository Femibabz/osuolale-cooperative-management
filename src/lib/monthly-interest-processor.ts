import { Member, Settings } from '@/types';
import { LoanCalculator } from './loan-utils';
import { db } from './mock-data';

export interface MonthlyProcessingResult {
  processedMembers: number;
  totalInterestCharged: number;
  memberResults: Array<{
    memberId: string;
    memberName: string;
    loanBalance: number;
    previousInterestBalance: number;
    newInterestBalance: number;
    interestCharged: number;
    transactions: string[];
  }>;
}

export class MonthlyInterestProcessor {
  static processAllMembers(settings: Settings): MonthlyProcessingResult {
    const members = db.getMembers();
    const result: MonthlyProcessingResult = {
      processedMembers: 0,
      totalInterestCharged: 0,
      memberResults: []
    };

    const processingDate = new Date();

    for (const member of members) {
      // Skip members without active loans
      if (!member.loanBalance || member.loanBalance <= 0) {
        continue;
      }

      const previousInterestBalance = member.interestBalance;

      // Process monthly interest for this member
      const monthlyResult = LoanCalculator.processMonthlyInterest(member, settings);

      if (monthlyResult.newInterestCharge > 0) {
        // Add new interest charge to existing interest balance (accumulate)
        const newInterestBalance = member.interestBalance + monthlyResult.newInterestCharge;
        const transactionDescriptions: string[] = [];

        // Create interest charge transaction
        db.createTransaction({
          memberId: member.id,
          type: 'interest_charge',
          amount: monthlyResult.newInterestCharge,
          description: `Monthly interest at ${settings.loanInterestRate}% annual rate on principal ${LoanCalculator.formatCurrency(member.loanBalance)}`,
          date: processingDate,
          balanceAfter: newInterestBalance,
          referenceNumber: `INT${Date.now()}_${member.id}`,
          processedBy: 'system',
        });

        transactionDescriptions.push(`Charged ${LoanCalculator.formatCurrency(monthlyResult.newInterestCharge)} interest on ${LoanCalculator.formatCurrency(member.loanBalance)} principal`);
        result.totalInterestCharged += monthlyResult.newInterestCharge;

        // Update member with new interest balance (loan balance stays the same)
        db.updateMember(member.id, {
          interestBalance: newInterestBalance,
        });

        // Add to results
        result.memberResults.push({
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          loanBalance: member.loanBalance, // Loan balance never changes
          previousInterestBalance,
          newInterestBalance,
          interestCharged: monthlyResult.newInterestCharge,
          transactions: transactionDescriptions
        });

        result.processedMembers++;
      }
    }

    return result;
  }

  static formatProcessingResult(result: MonthlyProcessingResult): string {
    let report = `Monthly Interest Processing Report\n`;
    report += `=====================================\n`;
    report += `Date: ${new Date().toLocaleDateString()}\n`;
    report += `Members Processed: ${result.processedMembers}\n`;
    report += `Total Interest Charged: ${LoanCalculator.formatCurrency(result.totalInterestCharged)}\n\n`;

    if (result.memberResults.length > 0) {
      report += `Member Details:\n`;
      report += `===============\n`;

      for (const memberResult of result.memberResults) {
        report += `\n${memberResult.memberName} (${memberResult.memberId}):\n`;
        report += `  Loan: ${LoanCalculator.formatCurrency(memberResult.loanBalance)}\n`;
        report += `  Previous Interest: ${LoanCalculator.formatCurrency(memberResult.previousInterestBalance)}\n`;
        report += `  New Interest: ${LoanCalculator.formatCurrency(memberResult.newInterestBalance)}\n`;
        report += `  📈 Interest Charged: ${LoanCalculator.formatCurrency(memberResult.interestCharged)}\n`;

        memberResult.transactions.forEach(transaction => {
          report += `     • ${transaction}\n`;
        });
      }
    }

    return report;
  }
}
