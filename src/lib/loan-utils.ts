import { Member } from '@/types';

/**
 * Get the months difference between two dates
 * Counts from the start date to the end date
 */
export function getMonthsDifference(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();

  return yearDiff * 12 + monthDiff;
}

/**
 * Check if loan is past 12 months and should have doubled interest rate
 */
export function shouldDoubleInterestRate(member: Member): boolean {
  if (!member.loanStartDate || !member.loanBalance || member.loanBalance <= 0) {
    return false;
  }

  const loanStartDate = new Date(member.loanStartDate);
  const now = new Date();
  const monthsSinceDisbursement = getMonthsDifference(loanStartDate, now);

  return monthsSinceDisbursement >= 12;
}

/**
 * Get the current interest rate (doubles after 12 months from disbursement)
 * Base rate: 1.5% per month
 * After 12 months: 3% per month
 */
export function getCurrentInterestRate(member: Member): number {
  const baseRate = 1.5; // 1.5% per month

  if (shouldDoubleInterestRate(member)) {
    return baseRate * 2; // 3% per month after 12 months
  }

  return baseRate;
}

/**
 * Calculate monthly interest on current outstanding loan balance
 * Interest = Loan Balance × Monthly Interest Rate
 */
export function calculateMonthlyInterest(member: Member): number {
  if (!member.loanBalance || member.loanBalance <= 0) {
    return 0;
  }

  const monthlyRate = getCurrentInterestRate(member);
  const interestAmount = (member.loanBalance * monthlyRate) / 100;

  return Math.round(interestAmount);
}

/**
 * Calculate interest for all unpaid months since last calculation
 * This accumulates interest month by month based on the outstanding balance
 *
 * IMPORTANT: Interest is calculated on the LOAN BALANCE, not added to it.
 * Interest accumulates in the interestBalance field separately.
 *
 * Timing: Interest is calculated at the BEGINNING of each month following loan approval
 * Example: Loan approved Dec 25 → First interest calculated Jan 1 for January
 */
export function calculateAccumulatedInterest(member: Member): {
  monthsToCalculate: number;
  totalInterest: number;
  newInterestBalance: number;
  breakdown: Array<{ month: number; balance: number; rate: number; interest: number }>;
} {
  if (!member.loanBalance || member.loanBalance <= 0) {
    return {
      monthsToCalculate: 0,
      totalInterest: 0,
      newInterestBalance: member.interestBalance || 0,
      breakdown: []
    };
  }

  const loanStartDate = new Date(member.loanStartDate || new Date());
  const now = new Date();

  // First interest is due at the beginning of the month FOLLOWING loan approval
  const firstInterestMonth = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth() + 1, 1);

  // If we haven't reached the first interest month yet, no calculation needed
  if (now < firstInterestMonth) {
    return {
      monthsToCalculate: 0,
      totalInterest: 0,
      newInterestBalance: member.interestBalance || 0,
      breakdown: []
    };
  }

  // Determine starting point for calculation
  const startCalcMonth = member.lastInterestCalculationDate
    ? new Date(new Date(member.lastInterestCalculationDate).getFullYear(),
               new Date(member.lastInterestCalculationDate).getMonth() + 1, 1)
    : firstInterestMonth;

  // Current month (as of day 1)
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate how many months of interest to charge
  const monthsToCalculate = getMonthsDifference(startCalcMonth, currentMonth);

  if (monthsToCalculate <= 0) {
    return {
      monthsToCalculate: 0,
      totalInterest: 0,
      newInterestBalance: member.interestBalance || 0,
      breakdown: []
    };
  }

  // Calculate interest for each month based on the CURRENT loan balance
  // The loan balance stays the same unless principal is paid
  let totalInterest = 0;
  const breakdown: Array<{ month: number; balance: number; rate: number; interest: number }> = [];

  for (let i = 0; i < monthsToCalculate; i++) {
    // Check if rate should be doubled based on months since disbursement
    const calcMonth = new Date(startCalcMonth.getFullYear(), startCalcMonth.getMonth() + i, 1);
    const monthsSinceDisbursement = getMonthsDifference(loanStartDate, calcMonth);

    const rate = monthsSinceDisbursement >= 12 ? 3.0 : 1.5;
    const monthlyInterest = (member.loanBalance * rate) / 100;

    totalInterest += monthlyInterest;
    breakdown.push({
      month: i + 1,
      balance: member.loanBalance,
      rate,
      interest: Math.round(monthlyInterest)
    });
  }

  totalInterest = Math.round(totalInterest);
  const newInterestBalance = (member.interestBalance || 0) + totalInterest;

  return {
    monthsToCalculate,
    totalInterest,
    newInterestBalance,
    breakdown
  };
}

/**
 * Process a loan payment
 * Payment is applied to: 1) Outstanding interest first, 2) Then principal
 *
 * After payment, if principal is reduced, next month's interest will be calculated
 * on the NEW reduced balance.
 */
export function processLoanPayment(
  member: Member,
  paymentAmount: number
): {
  interestPaid: number;
  principalPaid: number;
  newInterestBalance: number;
  newLoanBalance: number;
  remainingPayment: number;
} {
  let remainingPayment = paymentAmount;
  let interestPaid = 0;
  let principalPaid = 0;

  // First, pay off outstanding interest
  const outstandingInterest = member.interestBalance || 0;
  if (outstandingInterest > 0 && remainingPayment > 0) {
    interestPaid = Math.min(remainingPayment, outstandingInterest);
    remainingPayment -= interestPaid;
  }

  // Then, pay off principal
  const outstandingLoan = member.loanBalance || 0;
  if (outstandingLoan > 0 && remainingPayment > 0) {
    principalPaid = Math.min(remainingPayment, outstandingLoan);
    remainingPayment -= principalPaid;
  }

  return {
    interestPaid,
    principalPaid,
    newInterestBalance: (member.interestBalance || 0) - interestPaid,
    newLoanBalance: (member.loanBalance || 0) - principalPaid,
    remainingPayment
  };
}

/**
 * Get the next interest due date (first day of next month)
 * Updated to align with Day 1 interest calculation
 */
export function getNextInterestDueDate(member: Member): Date | null {
  if (!member.loanStartDate || !member.loanBalance || member.loanBalance <= 0) {
    return null;
  }

  const now = new Date();
  const loanStartDate = new Date(member.loanStartDate);

  // First interest month is the month following loan approval
  const firstInterestMonth = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth() + 1, 1);

  // If we haven't reached first interest month yet, that's the next due date
  if (now < firstInterestMonth) {
    return firstInterestMonth;
  }

  // Otherwise, next interest is due at the beginning of next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

/**
 * Get projected interest for next month
 * This shows members what interest will be charged on the 1st of next month
 * Example: Loan approved Dec 25 → Shows "Interest due Jan 1: ₦150,000"
 */
export function getNextMonthInterestPreview(member: Member): {
  dueDate: Date | null;
  amount: number;
  rate: number;
  message: string;
} | null {
  if (!member.loanStartDate || !member.loanBalance || member.loanBalance <= 0) {
    return null;
  }

  const now = new Date();
  const loanStartDate = new Date(member.loanStartDate);
  const firstInterestMonth = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth() + 1, 1);

  // Determine when next interest is due
  let dueDate: Date;
  let monthName: string;

  if (now < firstInterestMonth) {
    // Loan approved but first interest not yet due
    dueDate = firstInterestMonth;
    monthName = firstInterestMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else {
    // Regular case: next interest due at beginning of next month
    dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    monthName = dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Calculate months since disbursement to determine rate
  const monthsSinceDisbursement = getMonthsDifference(loanStartDate, dueDate);
  const rate = monthsSinceDisbursement >= 12 ? 3.0 : 1.5;
  const amount = Math.round((member.loanBalance * rate) / 100);

  const message = now < firstInterestMonth
    ? `First interest of ${formatNaira(amount)} will be charged on ${dueDate.toLocaleDateString()} for ${monthName}`
    : `Interest of ${formatNaira(amount)} will be charged on ${dueDate.toLocaleDateString()} for ${monthName}`;

  return {
    dueDate,
    amount,
    rate,
    message
  };
}

/**
 * Format currency in Nigerian Naira
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get a comprehensive summary of loan status
 */
export function getLoanSummary(member: Member): {
  hasActiveLoan: boolean;
  loanBalance: number;
  interestBalance: number;
  totalOwed: number;
  monthsSinceDisbursement: number;
  currentMonthlyRate: number;
  nextMonthInterest: number;
  isPenaltyRate: boolean;
  nextInterestDueDate: Date | null;
  monthsOverdue: number;
  isOverdue: boolean;
  monthsRemaining: number;
  loanEndDate: Date | null;
  nextPaymentDate: Date | null;
  interestDue: number;
} | null {
  const hasActiveLoan = (member.loanBalance || 0) > 0;

  if (!hasActiveLoan) {
    return null;
  }

  const loanBalance = member.loanBalance || 0;
  const interestBalance = member.interestBalance || 0;
  const totalOwed = loanBalance + interestBalance;

  const monthsSinceDisbursement = member.loanStartDate
    ? getMonthsDifference(new Date(member.loanStartDate), new Date())
    : 0;

  const currentMonthlyRate = getCurrentInterestRate(member);
  const nextMonthInterest = (loanBalance * currentMonthlyRate) / 100;
  const isPenaltyRate = shouldDoubleInterestRate(member);
  const nextInterestDueDate = getNextInterestDueDate(member);

  // Calculate if loan is overdue (more than loan duration months)
  const loanDurationMonths = member.loanDurationMonths || 12;
  const monthsOverdue = Math.max(0, monthsSinceDisbursement - loanDurationMonths);
  const isOverdue = monthsOverdue > 0;

  // Calculate months remaining until loan maturity
  const monthsRemaining = Math.max(0, loanDurationMonths - monthsSinceDisbursement);

  // Calculate loan end date
  const loanEndDate = member.loanStartDate
    ? new Date(
        new Date(member.loanStartDate).getFullYear(),
        new Date(member.loanStartDate).getMonth() + loanDurationMonths,
        new Date(member.loanStartDate).getDate()
      )
    : null;

  return {
    hasActiveLoan,
    loanBalance,
    interestBalance,
    totalOwed,
    monthsSinceDisbursement,
    currentMonthlyRate,
    nextMonthInterest: Math.round(nextMonthInterest),
    isPenaltyRate,
    nextInterestDueDate,
    monthsOverdue,
    isOverdue,
    monthsRemaining,
    loanEndDate,
    nextPaymentDate: nextInterestDueDate, // Alias for nextInterestDueDate
    interestDue: interestBalance, // Alias for interestBalance
  };
}
