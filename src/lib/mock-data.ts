import { User, Member, MembershipApplication, LoanApplication, Transaction } from '@/types';

// Mock users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@osuolale.com',
    password: 'admin123', // In real app, this would be hashed
    role: 'admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'john.doe@email.com',
    password: 'member123',
    role: 'member',
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    email: 'jane.smith@email.com',
    password: 'member123',
    role: 'member',
    createdAt: new Date('2024-02-15'),
  },
];

// Mock members
export const mockMembers: Member[] = [
  {
    id: 'm1',
    userId: '2',
    memberNumber: 'OSU001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+234-801-234-5678',
    address: '123 Lagos Street, Lagos',
    dateJoined: new Date('2024-02-01'),
    status: 'active',
    sharesBalance: 50000,
    savingsBalance: 150000,
    loanBalance: 75000,
    interestBalance: 5000,
    societyDues: 2000,
    loanStartDate: new Date('2024-01-15'),
    loanDurationMonths: 12,
    loanInterestRate: 15, // 15% annual
    monthlyLoanPayment: 7500,
  },
  {
    id: 'm2',
    userId: '3',
    memberNumber: 'OSU002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    phone: '+234-802-345-6789',
    address: '456 Abuja Road, Abuja',
    dateJoined: new Date('2024-02-15'),
    status: 'active',
    sharesBalance: 75000,
    savingsBalance: 200000,
    loanBalance: 0,
    interestBalance: 0,
    societyDues: 0,
  },
];

// Mock transactions for the last 12 months
export const mockTransactions: Transaction[] = [
  // John Doe transactions
  {
    id: 't1',
    memberId: 'm1',
    type: 'shares_deposit',
    amount: 25000,
    description: 'Initial share purchase',
    date: new Date('2024-02-01'),
    balanceAfter: 25000,
    referenceNumber: 'SH001',
    processedBy: 'admin',
  },
  {
    id: 't2',
    memberId: 'm1',
    type: 'savings_deposit',
    amount: 100000,
    description: 'Opening savings deposit',
    date: new Date('2024-02-01'),
    balanceAfter: 100000,
    referenceNumber: 'SV001',
    processedBy: 'admin',
  },
  {
    id: 't3',
    memberId: 'm1',
    type: 'loan_disbursement',
    amount: 100000,
    description: 'Business loan - 12 months @ 15%',
    date: new Date('2024-01-15'),
    balanceAfter: 100000,
    referenceNumber: 'LN001',
    processedBy: 'admin',
  },
  {
    id: 't4',
    memberId: 'm1',
    type: 'loan_payment',
    amount: 7500,
    description: 'Monthly loan payment - Feb 2024',
    date: new Date('2024-02-15'),
    balanceAfter: 92500,
    referenceNumber: 'LP001',
  },
  {
    id: 't5',
    memberId: 'm1',
    type: 'loan_payment',
    amount: 7500,
    description: 'Monthly loan payment - Mar 2024',
    date: new Date('2024-03-15'),
    balanceAfter: 85000,
    referenceNumber: 'LP002',
  },
  {
    id: 't6',
    memberId: 'm1',
    type: 'interest_charge',
    amount: 1250,
    description: 'Monthly interest charge - Feb 2024',
    date: new Date('2024-02-28'),
    balanceAfter: 6250,
    referenceNumber: 'INT001',
    processedBy: 'system',
  },
  {
    id: 't7',
    memberId: 'm1',
    type: 'shares_deposit',
    amount: 25000,
    description: 'Additional share purchase',
    date: new Date('2024-03-01'),
    balanceAfter: 50000,
    referenceNumber: 'SH002',
    processedBy: 'admin',
  },
  {
    id: 't8',
    memberId: 'm1',
    type: 'savings_deposit',
    amount: 50000,
    description: 'Monthly savings deposit',
    date: new Date('2024-03-01'),
    balanceAfter: 150000,
    referenceNumber: 'SV002',
  },

  // Jane Smith transactions
  {
    id: 't9',
    memberId: 'm2',
    type: 'shares_deposit',
    amount: 50000,
    description: 'Initial share purchase',
    date: new Date('2024-02-15'),
    balanceAfter: 50000,
    referenceNumber: 'SH003',
    processedBy: 'admin',
  },
  {
    id: 't10',
    memberId: 'm2',
    type: 'savings_deposit',
    amount: 150000,
    description: 'Opening savings deposit',
    date: new Date('2024-02-15'),
    balanceAfter: 150000,
    referenceNumber: 'SV003',
    processedBy: 'admin',
  },
  {
    id: 't11',
    memberId: 'm2',
    type: 'shares_deposit',
    amount: 25000,
    description: 'Additional share purchase',
    date: new Date('2024-03-01'),
    balanceAfter: 75000,
    referenceNumber: 'SH004',
    processedBy: 'admin',
  },
  {
    id: 't12',
    memberId: 'm2',
    type: 'savings_deposit',
    amount: 50000,
    description: 'Monthly savings deposit',
    date: new Date('2024-03-01'),
    balanceAfter: 200000,
    referenceNumber: 'SV004',
  },
];

// Mock membership applications
export const mockApplications: MembershipApplication[] = [
  {
    id: 'app1',
    firstName: 'David',
    lastName: 'Johnson',
    email: 'david.johnson@email.com',
    phone: '+234-803-456-7890',
    address: '789 Port Harcourt Street, Port Harcourt',
    occupation: 'Software Engineer',
    monthlyIncome: 250000,
    guarantorName: 'Sarah Johnson',
    guarantorPhone: '+234-804-567-8901',
    guarantorAddress: '790 Port Harcourt Street, Port Harcourt',
    status: 'pending',
    appliedAt: new Date('2024-03-01'),
  },
  {
    id: 'app2',
    firstName: 'Mary',
    lastName: 'Okafor',
    email: 'mary.okafor@email.com',
    phone: '+234-805-678-9012',
    address: '101 Kano Avenue, Kano',
    occupation: 'Teacher',
    monthlyIncome: 120000,
    guarantorName: 'Peter Okafor',
    guarantorPhone: '+234-806-789-0123',
    guarantorAddress: '102 Kano Avenue, Kano',
    status: 'pending',
    appliedAt: new Date('2024-03-05'),
  },
];

// Mock loan applications
export const mockLoanApplications: LoanApplication[] = [
  {
    id: 'loan1',
    memberId: 'm1',
    amount: 100000,
    purpose: 'Business expansion',
    duration: 12,
    status: 'pending',
    appliedAt: new Date('2024-03-10'),
  },
  {
    id: 'loan2',
    memberId: 'm2',
    amount: 50000,
    purpose: 'Emergency medical expenses',
    duration: 6,
    status: 'pending',
    appliedAt: new Date('2024-03-08'),
  },
];

// Mock storage functions (would be replaced with real database)
export class MockDatabase {
  private users: User[] = [];
  private members: Member[] = [];
  private applications: MembershipApplication[] = [];
  private loanApplications: LoanApplication[] = [];
  private transactions: Transaction[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem('osuolale_users');
      const storedMembers = localStorage.getItem('osuolale_members');
      const storedApplications = localStorage.getItem('osuolale_applications');
      const storedLoanApplications = localStorage.getItem('osuolale_loan_applications');
      const storedTransactions = localStorage.getItem('osuolale_transactions');

      this.users = storedUsers ? JSON.parse(storedUsers) : [...mockUsers];
      this.members = storedMembers ? JSON.parse(storedMembers) : [...mockMembers];
      this.applications = storedApplications ? JSON.parse(storedApplications) : [...mockApplications];
      this.loanApplications = storedLoanApplications ? JSON.parse(storedLoanApplications) : [...mockLoanApplications];
      this.transactions = storedTransactions ? JSON.parse(storedTransactions) : [...mockTransactions];

      // Convert date strings back to Date objects
      this.users.forEach(user => {
        user.createdAt = new Date(user.createdAt);
      });

      this.members.forEach(member => {
        member.dateJoined = new Date(member.dateJoined);
        if (member.loanStartDate) member.loanStartDate = new Date(member.loanStartDate);
      });

      this.applications.forEach(app => {
        app.appliedAt = new Date(app.appliedAt);
        if (app.reviewedAt) app.reviewedAt = new Date(app.reviewedAt);
      });

      this.loanApplications.forEach(loan => {
        loan.appliedAt = new Date(loan.appliedAt);
        if (loan.reviewedAt) loan.reviewedAt = new Date(loan.reviewedAt);
      });

      this.transactions.forEach(transaction => {
        transaction.date = new Date(transaction.date);
      });
    } else {
      // Server-side fallback
      this.users = [...mockUsers];
      this.members = [...mockMembers];
      this.applications = [...mockApplications];
      this.loanApplications = [...mockLoanApplications];
      this.transactions = [...mockTransactions];
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('osuolale_users', JSON.stringify(this.users));
      localStorage.setItem('osuolale_members', JSON.stringify(this.members));
      localStorage.setItem('osuolale_applications', JSON.stringify(this.applications));
      localStorage.setItem('osuolale_loan_applications', JSON.stringify(this.loanApplications));
      localStorage.setItem('osuolale_transactions', JSON.stringify(this.transactions));
    }
  }

  // User methods
  findUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    this.users.push(newUser);
    this.saveToStorage();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      this.saveToStorage();
      return this.users[index];
    }
    return undefined;
  }

  // Member methods
  getMembers(): Member[] {
    return [...this.members];
  }

  getMemberByUserId(userId: string): Member | undefined {
    return this.members.find(member => member.userId === userId);
  }

  getMemberById(id: string): Member | undefined {
    return this.members.find(member => member.id === id);
  }

  updateMember(id: string, updates: Partial<Member>): Member | undefined {
    const index = this.members.findIndex(member => member.id === id);
    if (index !== -1) {
      this.members[index] = { ...this.members[index], ...updates };
      this.saveToStorage();
      return this.members[index];
    }
    return undefined;
  }

  createMember(member: Omit<Member, 'id' | 'dateJoined'>): Member {
    const newMember: Member = {
      ...member,
      id: Date.now().toString(),
      dateJoined: new Date(),
    };
    this.members.push(newMember);
    this.saveToStorage();
    return newMember;
  }

  // Application methods
  getApplications(): MembershipApplication[] {
    return [...this.applications];
  }

  updateApplication(id: string, updates: Partial<MembershipApplication>): MembershipApplication | undefined {
    const index = this.applications.findIndex(app => app.id === id);
    if (index !== -1) {
      this.applications[index] = { ...this.applications[index], ...updates };
      this.saveToStorage();
      return this.applications[index];
    }
    return undefined;
  }

  createApplication(application: Omit<MembershipApplication, 'id' | 'appliedAt' | 'status'>): MembershipApplication {
    const newApplication: MembershipApplication = {
      ...application,
      id: Date.now().toString(),
      appliedAt: new Date(),
      status: 'pending',
    };
    this.applications.push(newApplication);
    this.saveToStorage();
    return newApplication;
  }

  // Loan application methods
  getLoanApplications(): LoanApplication[] {
    return [...this.loanApplications];
  }

  getLoanApplicationsByMember(memberId: string): LoanApplication[] {
    return this.loanApplications.filter(loan => loan.memberId === memberId);
  }

  updateLoanApplication(id: string, updates: Partial<LoanApplication>): LoanApplication | undefined {
    const index = this.loanApplications.findIndex(loan => loan.id === id);
    if (index !== -1) {
      this.loanApplications[index] = { ...this.loanApplications[index], ...updates };
      this.saveToStorage();
      return this.loanApplications[index];
    }
    return undefined;
  }

  createLoanApplication(application: Omit<LoanApplication, 'id' | 'appliedAt' | 'status'>): LoanApplication {
    const newApplication: LoanApplication = {
      ...application,
      id: Date.now().toString(),
      appliedAt: new Date(),
      status: 'pending',
    };
    this.loanApplications.push(newApplication);
    this.saveToStorage();
    return newApplication;
  }

  // Transaction methods
  getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  getTransactionsByMember(memberId: string, monthsBack: number = 12): Transaction[] {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);

    return this.transactions
      .filter(transaction =>
        transaction.memberId === memberId &&
        transaction.date >= cutoffDate
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  createTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    this.transactions.push(newTransaction);
    this.saveToStorage();
    return newTransaction;
  }
}

export const db = new MockDatabase();
