import { User, Member, MembershipApplication, LoanApplication, Transaction, ByLaw, LoginSession, Society } from '@/types';
import { DatabaseService } from './database-service';

// Mock societies
export const mockSocieties: Society[] = [
  {
    id: 'soc1',
    name: 'OsuOlale Cooperative Society',
    registrationNumber: 'OSU-2024-001',
    address: '123 Society Avenue, Lagos',
    phone: '+234-800-123-4567',
    email: 'admin@osuolale.com',
    createdAt: new Date('2024-01-01'),
    status: 'active',
    adminUserId: '1',
    memberCount: 2,
    totalSavings: 350000,
    totalLoans: 75000,
    totalShares: 125000,
  },
];

// Mock users
export const mockUsers: User[] = [
  {
    id: '0',
    email: 'platform@admin.com',
    password: 'superadmin123', // Super admin for platform management
    role: 'super_admin',
    createdAt: new Date('2023-01-01'),
    isActive: true,
  },
  {
    id: '1',
    email: 'admin@osuolale.com',
    password: 'admin123', // In real app, this would be hashed
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    societyId: 'soc1',
    isActive: true,
  },
  {
    id: '2',
    email: 'john.doe@email.com',
    password: 'member123',
    role: 'member',
    createdAt: new Date('2024-02-01'),
    societyId: 'soc1',
    isActive: true,
  },
  {
    id: '3',
    email: 'jane.smith@email.com',
    password: 'member123',
    role: 'member',
    createdAt: new Date('2024-02-15'),
    societyId: 'soc1',
    isActive: true,
  },
];

// Mock bylaws
export const mockByLaws: ByLaw[] = [
  {
    id: 'bl1',
    societyId: 'soc1',
    title: 'Membership Eligibility and Requirements',
    content: `1. Any individual of sound mind and at least 18 years of age may apply for membership in the OsuOlale Cooperative Society.

2. All prospective members must:
   - Complete the membership application form with accurate information
   - Provide a valid guarantor who is a current member in good standing
   - Pay the required membership fees and initial share capital
   - Attend a mandatory orientation session

3. Membership becomes effective upon approval by the Board of Directors and payment of all required fees.

4. Members must maintain active participation by:
   - Making regular monthly contributions to their savings account
   - Attending at least 75% of general meetings annually
   - Participating in society activities and programs`,
    category: 'membership',
    createdBy: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isActive: true,
  },
  {
    id: 'bl2',
    societyId: 'soc1',
    title: 'Share Capital and Savings Contributions',
    content: `1. SHARE CAPITAL:
   - Minimum initial share capital: ₦50,000
   - Shares may be purchased in multiples of ₦10,000
   - Members may increase their share capital at any time
   - Share capital is refundable upon voluntary withdrawal or termination of membership

2. MONTHLY SAVINGS:
   - All members must contribute a minimum of ₦5,000 monthly to their savings account
   - Savings contributions are due on or before the 5th day of each month
   - Late payments may attract a penalty of 2% of the amount due
   - Savings are withdrawable subject to the society's withdrawal policy

3. DIVIDENDS:
   - Annual dividends are distributed based on share capital held
   - Dividend rates are determined by the Board based on annual performance
   - Members may choose to reinvest dividends or receive cash payment`,
    category: 'financial',
    createdBy: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isActive: true,
  },
  {
    id: 'bl3',
    societyId: 'soc1',
    title: 'Loan Policies and Procedures',
    content: `1. LOAN ELIGIBILITY:
   - Must be a member in good standing for at least 6 months
   - Must have made regular monthly savings contributions
   - No outstanding defaulted loans
   - Must provide acceptable collateral or guarantors

2. LOAN LIMITS:
   - Maximum loan amount: 3 times member's total savings and share capital
   - First-time borrowers: Maximum of ₦200,000
   - Subsequent loans based on repayment history

3. INTEREST RATES:
   - Standard loan interest rate: 15% per annum (reducing balance)
   - Emergency loans (up to ₦50,000): 12% per annum
   - Business expansion loans: 18% per annum

4. REPAYMENT TERMS:
   - Repayment period: 6 to 24 months
   - Monthly installment payments required
   - Early repayment allowed without penalty
   - Late payment penalty: 3% of overdue amount per month

5. LOAN DEFAULT:
   - Failure to pay for 3 consecutive months constitutes default
   - Society may recover from guarantor or collateral
   - Defaulters not eligible for new loans until fully cleared`,
    category: 'financial',
    createdBy: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
    isActive: true,
  },
  {
    id: 'bl4',
    societyId: 'soc1',
    title: 'Governance and Decision Making',
    content: `1. BOARD OF DIRECTORS:
   - Elected by members at the Annual General Meeting
   - Term of office: 2 years (renewable once)
   - Minimum of 5 directors, maximum of 9
   - Board meets quarterly or as needed

2. GENERAL MEETINGS:
   - Annual General Meeting (AGM) held in January each year
   - Special meetings may be called with 14 days notice
   - Quorum: 50% of total membership
   - Decisions by simple majority unless otherwise stated

3. VOTING RIGHTS:
   - Each member has one vote regardless of share capital
   - Voting by proxy allowed with written authorization
   - Secret ballot for elections and sensitive matters

4. FINANCIAL ACCOUNTABILITY:
   - Annual financial statements audited by external auditor
   - Financial reports presented at AGM
   - Members have right to inspect society's books with reasonable notice`,
    category: 'governance',
    createdBy: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isActive: true,
  },
  {
    id: 'bl5',
    societyId: 'soc1',
    title: 'Member Rights and Responsibilities',
    content: `MEMBER RIGHTS:
1. Participate in all society activities and programs
2. Vote on all matters requiring member approval
3. Access to society's financial information
4. Fair treatment in loan applications and other services
5. Receive share of annual surplus/dividends
6. Voluntary withdrawal with proper notice

MEMBER RESPONSIBILITIES:
1. Pay all dues and contributions on time
2. Attend general meetings regularly
3. Serve on committees when appointed
4. Maintain confidentiality of society information
5. Promote the society's interests and reputation
6. Comply with all bylaws and regulations
7. Update personal information when changes occur

DISCIPLINARY ACTIONS:
- Violations may result in warnings, fines, suspension, or expulsion
- Members have right to fair hearing before disciplinary action
- Appeals may be made to the Board of Directors`,
    category: 'membership',
    createdBy: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isActive: true,
  },
  {
    id: 'bl6',
    societyId: 'soc1',
    title: 'Withdrawal and Termination of Membership',
    content: `1. VOLUNTARY WITHDRAWAL:
   - Member must submit written notice 30 days in advance
   - All outstanding loans must be cleared
   - Share capital refunded within 60 days after clearance
   - Savings balance paid immediately upon clearance
   - Accrued dividends paid as per policy

2. INVOLUNTARY TERMINATION:
   Membership may be terminated for:
   - Gross misconduct or violation of bylaws
   - Criminal conviction affecting society's reputation
   - Continued failure to meet financial obligations
   - Actions detrimental to the society

3. DEATH OF MEMBER:
   - Share capital and savings paid to designated beneficiary or next of kin
   - Outstanding loans recovered from estate or insurance
   - Benefits processed within 90 days of notification

4. INACTIVE MEMBERSHIP:
   - Failure to make contributions for 12 consecutive months
   - Automatic conversion to inactive status
   - Reactivation allowed upon payment of arrears`,
    category: 'membership',
    createdBy: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isActive: true,
  },
];

// Mock members
export const mockMembers: Member[] = [
  {
    id: 'm1',
    userId: '2',
    societyId: 'soc1',
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
    societyId: 'soc1',
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
    societyId: 'soc1',
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
    societyId: 'soc1',
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

// Database wrapper - uses Supabase if configured, localStorage as fallback
export class MockDatabase {
  constructor() {
    // Initialize with mock data if localStorage is empty and Supabase is not configured
    this.initializeData();
  }

  private async initializeData() {
    if (typeof window !== 'undefined') {
      try {
        // Check if we have any users
        const users = await DatabaseService.getUsers();

        // If no users exist, initialize with mock data
        if (users.length === 0) {
          console.log('Initializing with mock data...');

          // Initialize societies
          for (const society of mockSocieties) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('osuolale_societies', JSON.stringify(mockSocieties));
            }
          }

          // Initialize users
          for (const user of mockUsers) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('osuolale_users', JSON.stringify(mockUsers));
            }
          }

          // Initialize members
          if (typeof window !== 'undefined') {
            localStorage.setItem('osuolale_members', JSON.stringify(mockMembers));
            localStorage.setItem('osuolale_applications', JSON.stringify(mockApplications));
            localStorage.setItem('osuolale_loan_applications', JSON.stringify(mockLoanApplications));
            localStorage.setItem('osuolale_transactions', JSON.stringify(mockTransactions));
            localStorage.setItem('osuolale_bylaws', JSON.stringify(mockByLaws));
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    }
  }

  // User methods
  async findUserByEmail(email: string): Promise<User | undefined> {
    const user = await DatabaseService.findUserByEmail(email);
    return user || undefined;
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return DatabaseService.createUser(user);
  }

  updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    return DatabaseService.updateUser(id, updates).then(u => u || undefined);
  }

  async updateUserPassword(id: string, newPassword: string): Promise<boolean> {
    const user = await DatabaseService.updateUser(id, { password: newPassword, isFirstLogin: false });
    return Boolean(user);
  }

  // Member methods
  getMembers(): Promise<Member[]> {
    return DatabaseService.getMembers();
  }

  getMemberByUserId(userId: string): Promise<Member | undefined> {
    return DatabaseService.getMemberByUserId(userId).then(m => m || undefined);
  }

  getMemberById(id: string): Promise<Member | undefined> {
    return DatabaseService.getMemberById(id).then(m => m || undefined);
  }

  updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined> {
    return DatabaseService.updateMember(id, updates).then(m => m || undefined);
  }

  createMember(member: Omit<Member, 'id' | 'dateJoined'>): Promise<Member> {
    return DatabaseService.createMember(member);
  }

  // Application methods
  getApplications(): Promise<MembershipApplication[]> {
    return DatabaseService.getApplications();
  }

  updateApplication(id: string, updates: Partial<MembershipApplication>): Promise<MembershipApplication | undefined> {
    return DatabaseService.updateApplication(id, updates).then(a => a || undefined);
  }

  createApplication(application: Omit<MembershipApplication, 'id' | 'appliedAt' | 'status'>): Promise<MembershipApplication> {
    return DatabaseService.createApplication(application);
  }

  // Loan application methods
  getLoanApplications(): Promise<LoanApplication[]> {
    return DatabaseService.getLoanApplications();
  }

  async getLoanApplicationsByMember(memberId: string): Promise<LoanApplication[]> {
    const loans = await DatabaseService.getLoanApplications();
    return loans.filter(l => l.memberId === memberId);
  }

  updateLoanApplication(id: string, updates: Partial<LoanApplication>): Promise<LoanApplication | undefined> {
    return DatabaseService.updateLoanApplication(id, updates).then(l => l || undefined);
  }

  createLoanApplication(application: Omit<LoanApplication, 'id' | 'appliedAt' | 'status'>): Promise<LoanApplication> {
    return DatabaseService.createLoanApplication(application);
  }

  // Transaction methods
  getTransactions(): Promise<Transaction[]> {
    return DatabaseService.getTransactions();
  }

  async getTransactionsByMember(memberId: string, monthsBack: number = 12): Promise<Transaction[]> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);

    const transactions = await DatabaseService.getTransactionsByMember(memberId);
    return transactions
      .filter(t => t.date >= cutoffDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    return DatabaseService.createTransaction(transaction);
  }

  // By-laws methods
  async getByLaws(): Promise<ByLaw[]> {
    const bylaws = await DatabaseService.getByLaws();
    return bylaws.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getActiveByLaws(): Promise<ByLaw[]> {
    return DatabaseService.getActiveByLaws();
  }

  async getByLawsByCategory(category: string): Promise<ByLaw[]> {
    const bylaws = await DatabaseService.getActiveByLaws();
    return bylaws.filter(b => b.category === category);
  }

  async getByLawById(id: string): Promise<ByLaw | undefined> {
    const bylaws = await DatabaseService.getByLaws();
    return bylaws.find(b => b.id === id);
  }

  createByLaw(bylaw: Omit<ByLaw, 'id' | 'createdAt' | 'updatedAt'>): Promise<ByLaw> {
    return DatabaseService.createByLaw(bylaw);
  }

  updateByLaw(id: string, updates: Partial<Omit<ByLaw, 'id' | 'createdAt'>>): Promise<ByLaw | undefined> {
    return DatabaseService.updateByLaw(id, updates).then(b => b || undefined);
  }

  deleteByLaw(id: string): Promise<boolean> {
    return DatabaseService.deleteByLaw(id);
  }

  // Login session methods
  getLoginSessions(): Promise<LoginSession[]> {
    return DatabaseService.getLoginSessions();
  }

  async getLoginSessionsByUser(userId: string): Promise<LoginSession[]> {
    const sessions = await DatabaseService.getLoginSessions();
    return sessions.filter(s => s.userId === userId);
  }

  async getAdminLoginSessions(limit?: number): Promise<LoginSession[]> {
    const sessions = await DatabaseService.getLoginSessions();
    const adminSessions = sessions.filter(s => s.userRole === 'admin');
    return limit ? adminSessions.slice(0, limit) : adminSessions;
  }

  async createLoginSession(session: Omit<LoginSession, 'id'>): Promise<LoginSession> {
    // Check for suspicious activity
    const userPreviousSessions = await this.getLoginSessionsByUser(session.userId);
    const newSession = { ...session };

    if (userPreviousSessions.length > 0) {
      const suspiciousReasons: string[] = [];
      const lastSession = userPreviousSessions[0];

      if (lastSession.locationInfo.country &&
          session.locationInfo.country &&
          lastSession.locationInfo.country !== session.locationInfo.country) {
        suspiciousReasons.push('Login from different country');
      }

      if (lastSession.deviceInfo.deviceType !== session.deviceInfo.deviceType) {
        suspiciousReasons.push('Different device type');
      }

      if (lastSession.deviceInfo.os !== session.deviceInfo.os) {
        suspiciousReasons.push('Different operating system');
      }

      if (lastSession.deviceInfo.browser !== session.deviceInfo.browser) {
        suspiciousReasons.push('Different browser');
      }

      if (suspiciousReasons.length > 0) {
        newSession.isSuspicious = true;
        newSession.suspiciousReasons = suspiciousReasons;
      }
    }

    return DatabaseService.createLoginSession(newSession);
  }

  endLoginSession(sessionId: string): Promise<boolean> {
    return DatabaseService.endLoginSession(sessionId);
  }

  // Super Admin methods
  getAllSocieties(): Promise<Society[]> {
    return DatabaseService.getSocieties();
  }

  async getSocietyById(id: string): Promise<Society | undefined> {
    const societies = await DatabaseService.getSocieties();
    return societies.find(s => s.id === id);
  }

  getAllUsers(): Promise<User[]> {
    return DatabaseService.getUsers();
  }

  getAllMembers(): Promise<Member[]> {
    return DatabaseService.getMembers();
  }

  async getMembersBySociety(societyId: string): Promise<Member[]> {
    const members = await DatabaseService.getMembers();
    return members.filter(m => m.societyId === societyId);
  }

  async getApplicationsBySociety(societyId: string): Promise<MembershipApplication[]> {
    const apps = await DatabaseService.getApplications();
    return apps.filter(a => a.societyId === societyId);
  }

  async toggleUserActive(userId: string): Promise<boolean> {
    const users = await DatabaseService.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    const updated = await DatabaseService.updateUser(userId, { isActive: !user.isActive });
    return Boolean(updated);
  }

  async getPlatformStatistics() {
    const societies = await DatabaseService.getSocieties();
    const users = await DatabaseService.getUsers();
    const members = await DatabaseService.getMembers();
    const applications = await DatabaseService.getApplications();

    const activeSocieties = societies.filter(s => s.status === 'active').length;
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive !== false).length;
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'active').length;
    const totalSavings = members.reduce((sum, m) => sum + m.savingsBalance, 0);
    const totalLoans = members.reduce((sum, m) => sum + m.loanBalance, 0);
    const totalShares = members.reduce((sum, m) => sum + m.sharesBalance, 0);
    const pendingApplications = applications.filter(a => a.status === 'pending').length;

    return {
      activeSocieties,
      totalSocieties: societies.length,
      totalUsers,
      activeUsers,
      totalMembers,
      activeMembers,
      totalSavings,
      totalLoans,
      totalShares,
      totalWithPlatform: totalSavings + totalShares,
      pendingApplications,
    };
  }

  updateSociety(id: string, updates: Partial<Society>): Promise<Society | undefined> {
    // This would need to be implemented in DatabaseService
    return Promise.resolve(undefined);
  }
}

export const db = new MockDatabase();
