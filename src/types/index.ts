export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
  createdAt: Date;
}

export interface Member {
  id: string;
  userId: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateJoined: Date;
  status: 'active' | 'inactive' | 'suspended';

  // Personal details
  occupation?: string;
  annualIncome?: number;

  // Financial balances
  sharesBalance: number;
  savingsBalance: number;
  loanBalance: number;
  interestBalance: number;
  societyDues: number;

  // Loan details
  loanStartDate?: Date;
  loanDurationMonths?: number;
  loanInterestRate?: number; // Annual percentage rate
  monthlyLoanPayment?: number;
}

export interface MembershipApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  occupation: string;
  monthlyIncome: number;
  guarantorName: string;
  guarantorPhone: string;
  guarantorAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface LoanApplication {
  id: string;
  memberId: string;
  amount: number;
  purpose: string;
  duration: number; // in months
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  disbursedAt?: Date;
}

export interface Transaction {
  id: string;
  memberId: string;
  type: 'shares_deposit' | 'shares_withdrawal' | 'savings_deposit' | 'savings_withdrawal' | 'loan_disbursement' | 'loan_payment' | 'interest_charge' | 'interest_payment' | 'interest_compound' | 'dues_payment' | 'profile_update';
  amount: number;
  description: string;
  date: Date;
  balanceAfter: number;
  referenceNumber?: string;
  processedBy?: string; // admin who processed it
}

export interface DashboardStats {
  totalMembers: number;
  pendingApplications: number;
  pendingLoans: number;
  totalSavings: number;
  totalLoans: number;
  totalShares: number;
  totalWithOrganization: number;
}

export interface Settings {
  id: string;
  loanInterestRate: number; // Annual percentage rate (default: 1.5%)
  standardLoanTermMonths: number; // Default loan term in months (default: 12)
  newMemberLoanEligibilityMonths: number; // Months before new member can apply for loan (default: 6)
  loanToSharesSavingsRatio: number; // Loan request limit as multiple of shares+savings (default: 2)
  lastUpdated: Date;
  updatedBy: string; // Admin ID who last updated settings
}
