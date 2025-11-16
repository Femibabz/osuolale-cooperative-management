import { supabase, isSupabaseConfigured } from './supabase';
import {
  User, Member, MembershipApplication, LoanApplication,
  Transaction, ByLaw, LoginSession, Society
} from '@/types';

// Helper to convert database timestamps to Date objects
const convertDates = (obj: any, dateFields: string[]) => {
  const converted = { ...obj };
  dateFields.forEach(field => {
    if (converted[field]) {
      converted[field] = new Date(converted[field]);
    }
  });
  return converted;
};

export class DatabaseService {
  private static useSupabase = isSupabaseConfigured();

  // ==================== USERS ====================

  static async getUsers(): Promise<User[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return (data || []).map(u => convertDates(u, ['created_at']));
    }
    // Fallback to localStorage
    const stored = localStorage.getItem('osuolale_users');
    return stored ? JSON.parse(stored).map((u: any) => convertDates(u, ['createdAt'])) : [];
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (error) return null;
      return data ? convertDates(data, ['created_at']) : null;
    }
    // Fallback
    const users = await this.getUsers();
    return users.find(u => u.email === email) || null;
  }

  static async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          password: userData.password,
          role: userData.role,
          society_id: userData.societyId,
          is_active: userData.isActive ?? true,
          is_first_login: userData.isFirstLogin ?? true
        }])
        .select()
        .single();
      if (error) throw error;
      return convertDates(data, ['created_at']);
    }
    // Fallback
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    const users = await this.getUsers();
    users.push(newUser);
    localStorage.setItem('osuolale_users', JSON.stringify(users));
    return newUser;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .update({
          email: updates.email,
          password: updates.password,
          role: updates.role,
          society_id: updates.societyId,
          is_active: updates.isActive,
          is_first_login: updates.isFirstLogin
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data ? convertDates(data, ['created_at']) : null;
    }
    // Fallback
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    localStorage.setItem('osuolale_users', JSON.stringify(users));
    return users[index];
  }

  // ==================== APPLICATIONS ====================

  static async getApplications(): Promise<MembershipApplication[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('membership_applications')
        .select('*')
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(a => convertDates(a, ['applied_at', 'reviewed_at']));
    }
    // Fallback
    const stored = localStorage.getItem('osuolale_applications');
    return stored ? JSON.parse(stored).map((a: any) => convertDates(a, ['appliedAt', 'reviewedAt'])) : [];
  }

  static async createApplication(appData: Omit<MembershipApplication, 'id' | 'appliedAt' | 'status'>): Promise<MembershipApplication> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('membership_applications')
        .insert([{
          society_id: appData.societyId,
          first_name: appData.firstName,
          last_name: appData.lastName,
          email: appData.email,
          phone: appData.phone,
          address: appData.address,
          occupation: appData.occupation,
          monthly_income: appData.monthlyIncome,
          guarantor_name: appData.guarantorName,
          guarantor_phone: appData.guarantorPhone,
          guarantor_address: appData.guarantorAddress,
          status: 'pending'
        }])
        .select()
        .single();
      if (error) throw error;
      return convertDates(data, ['applied_at', 'reviewed_at']);
    }
    // Fallback
    const newApp: MembershipApplication = {
      ...appData,
      id: Date.now().toString(),
      appliedAt: new Date(),
      status: 'pending'
    };
    const apps = await this.getApplications();
    apps.unshift(newApp);
    localStorage.setItem('osuolale_applications', JSON.stringify(apps));
    return newApp;
  }

  static async updateApplication(id: string, updates: Partial<MembershipApplication>): Promise<MembershipApplication | null> {
    if (this.useSupabase) {
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.reviewedAt) dbUpdates.reviewed_at = updates.reviewedAt;
      if (updates.reviewedBy) dbUpdates.reviewed_by = updates.reviewedBy;
      if (updates.reviewNotes) dbUpdates.review_notes = updates.reviewNotes;

      const { data, error } = await supabase
        .from('membership_applications')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data ? convertDates(data, ['applied_at', 'reviewed_at']) : null;
    }
    // Fallback
    const apps = await this.getApplications();
    const index = apps.findIndex(a => a.id === id);
    if (index === -1) return null;
    apps[index] = { ...apps[index], ...updates };
    localStorage.setItem('osuolale_applications', JSON.stringify(apps));
    return apps[index];
  }

  // ==================== MEMBERS ====================

  static async getMembers(): Promise<Member[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase.from('members').select('*');
      if (error) throw error;
      return (data || []).map(m => convertDates(m, ['date_joined', 'loan_start_date']));
    }
    // Fallback
    const stored = localStorage.getItem('osuolale_members');
    return stored ? JSON.parse(stored).map((m: any) => convertDates(m, ['dateJoined', 'loanStartDate'])) : [];
  }

  static async getMemberById(id: string): Promise<Member | null> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data ? convertDates(data, ['date_joined', 'loan_start_date']) : null;
    }
    const members = await this.getMembers();
    return members.find(m => m.id === id) || null;
  }

  static async getMemberByUserId(userId: string): Promise<Member | null> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) return null;
      return data ? convertDates(data, ['date_joined', 'loan_start_date']) : null;
    }
    const members = await this.getMembers();
    return members.find(m => m.userId === userId) || null;
  }

  static async createMember(memberData: Omit<Member, 'id' | 'dateJoined'>): Promise<Member> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('members')
        .insert([{
          user_id: memberData.userId,
          society_id: memberData.societyId,
          member_number: memberData.memberNumber,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          email: memberData.email,
          phone: memberData.phone,
          address: memberData.address,
          status: memberData.status,
          occupation: memberData.occupation,
          annual_income: memberData.annualIncome,
          shares_balance: memberData.sharesBalance,
          savings_balance: memberData.savingsBalance,
          loan_balance: memberData.loanBalance,
          interest_balance: memberData.interestBalance,
          society_dues: memberData.societyDues,
          loan_start_date: memberData.loanStartDate,
          loan_duration_months: memberData.loanDurationMonths,
          loan_interest_rate: memberData.loanInterestRate,
          monthly_loan_payment: memberData.monthlyLoanPayment
        }])
        .select()
        .single();
      if (error) throw error;
      return convertDates(data, ['date_joined', 'loan_start_date']);
    }
    // Fallback
    const newMember: Member = {
      ...memberData,
      id: Date.now().toString(),
      dateJoined: new Date()
    };
    const members = await this.getMembers();
    members.push(newMember);
    localStorage.setItem('osuolale_members', JSON.stringify(members));
    return newMember;
  }

  static async updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
    if (this.useSupabase) {
      const dbUpdates: any = {};
      if (updates.firstName) dbUpdates.first_name = updates.firstName;
      if (updates.lastName) dbUpdates.last_name = updates.lastName;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.phone) dbUpdates.phone = updates.phone;
      if (updates.address) dbUpdates.address = updates.address;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.sharesBalance !== undefined) dbUpdates.shares_balance = updates.sharesBalance;
      if (updates.savingsBalance !== undefined) dbUpdates.savings_balance = updates.savingsBalance;
      if (updates.loanBalance !== undefined) dbUpdates.loan_balance = updates.loanBalance;
      if (updates.interestBalance !== undefined) dbUpdates.interest_balance = updates.interestBalance;
      if (updates.societyDues !== undefined) dbUpdates.society_dues = updates.societyDues;
      if (updates.loanStartDate !== undefined) dbUpdates.loan_start_date = updates.loanStartDate;
      if (updates.loanDurationMonths !== undefined) dbUpdates.loan_duration_months = updates.loanDurationMonths;
      if (updates.loanInterestRate !== undefined) dbUpdates.loan_interest_rate = updates.loanInterestRate;
      if (updates.monthlyLoanPayment !== undefined) dbUpdates.monthly_loan_payment = updates.monthlyLoanPayment;
      if (updates.occupation) dbUpdates.occupation = updates.occupation;
      if (updates.annualIncome !== undefined) dbUpdates.annual_income = updates.annualIncome;

      const { data, error } = await supabase
        .from('members')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data ? convertDates(data, ['date_joined', 'loan_start_date']) : null;
    }
    // Fallback
    const members = await this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return null;
    members[index] = { ...members[index], ...updates };
    localStorage.setItem('osuolale_members', JSON.stringify(members));
    return members[index];
  }

  // ==================== TRANSACTIONS ====================

  static async getTransactions(): Promise<Transaction[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []).map(t => convertDates(t, ['date']));
    }
    // Fallback
    const stored = localStorage.getItem('osuolale_transactions');
    return stored ? JSON.parse(stored).map((t: any) => convertDates(t, ['date'])) : [];
  }

  static async getTransactionsByMember(memberId: string): Promise<Transaction[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', memberId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []).map(t => convertDates(t, ['date']));
    }
    const transactions = await this.getTransactions();
    return transactions.filter(t => t.memberId === memberId);
  }

  static async createTransaction(txData: Omit<Transaction, 'id'>): Promise<Transaction> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          member_id: txData.memberId,
          type: txData.type,
          amount: txData.amount,
          description: txData.description,
          date: txData.date,
          balance_after: txData.balanceAfter,
          reference_number: txData.referenceNumber,
          processed_by: txData.processedBy
        }])
        .select()
        .single();
      if (error) throw error;
      return convertDates(data, ['date']);
    }
    // Fallback
    const newTx: Transaction = {
      ...txData,
      id: Date.now().toString()
    };
    const transactions = await this.getTransactions();
    transactions.unshift(newTx);
    localStorage.setItem('osuolale_transactions', JSON.stringify(transactions));
    return newTx;
  }

  // ==================== BYLAWS ====================

  static async getByLaws(): Promise<ByLaw[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('bylaws')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(b => convertDates(b, ['created_at', 'updated_at']));
    }
    // Fallback
    const stored = localStorage.getItem('osuolale_bylaws');
    return stored ? JSON.parse(stored).map((b: any) => convertDates(b, ['createdAt', 'updatedAt'])) : [];
  }

  static async getActiveByLaws(): Promise<ByLaw[]> {
    const bylaws = await this.getByLaws();
    return bylaws.filter(b => b.isActive);
  }

  static async createByLaw(bylawData: Omit<ByLaw, 'id' | 'createdAt' | 'updatedAt'>): Promise<ByLaw> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('bylaws')
        .insert([{
          society_id: bylawData.societyId,
          title: bylawData.title,
          content: bylawData.content,
          category: bylawData.category,
          created_by: bylawData.createdBy,
          is_active: bylawData.isActive
        }])
        .select()
        .single();
      if (error) throw error;
      return convertDates(data, ['created_at', 'updated_at']);
    }
    // Fallback
    const newBylaw: ByLaw = {
      ...bylawData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const bylaws = await this.getByLaws();
    bylaws.push(newBylaw);
    localStorage.setItem('osuolale_bylaws', JSON.stringify(bylaws));
    return newBylaw;
  }

  static async updateByLaw(id: string, updates: Partial<ByLaw>): Promise<ByLaw | null> {
    if (this.useSupabase) {
      const dbUpdates: any = { updated_at: new Date() };
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.content) dbUpdates.content = updates.content;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('bylaws')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data ? convertDates(data, ['created_at', 'updated_at']) : null;
    }
    // Fallback
    const bylaws = await this.getByLaws();
    const index = bylaws.findIndex(b => b.id === id);
    if (index === -1) return null;
    bylaws[index] = { ...bylaws[index], ...updates, updatedAt: new Date() };
    localStorage.setItem('osuolale_bylaws', JSON.stringify(bylaws));
    return bylaws[index];
  }

  static async deleteByLaw(id: string): Promise<boolean> {
    if (this.useSupabase) {
      const { error } = await supabase.from('bylaws').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    // Fallback
    const bylaws = await this.getByLaws();
    const filtered = bylaws.filter(b => b.id !== id);
    if (filtered.length === bylaws.length) return false;
    localStorage.setItem('osuolale_bylaws', JSON.stringify(filtered));
    return true;
  }

  // ==================== LOGIN SESSIONS ====================

  static async createLoginSession(sessionData: Omit<LoginSession, 'id'>): Promise<LoginSession> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('login_sessions')
        .insert([{
          user_id: sessionData.userId,
          user_email: sessionData.userEmail,
          user_role: sessionData.userRole,
          society_id: sessionData.societyId,
          login_time: sessionData.loginTime,
          device_info: sessionData.deviceInfo,
          location_info: sessionData.locationInfo,
          session_active: sessionData.sessionActive,
          is_suspicious: sessionData.isSuspicious,
          suspicious_reasons: sessionData.suspiciousReasons
        }])
        .select()
        .single();
      if (error) throw error;
      return convertDates(data, ['login_time', 'logout_time']);
    }
    // Fallback
    const newSession: LoginSession = {
      ...sessionData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    const stored = localStorage.getItem('osuolale_login_sessions');
    const sessions = stored ? JSON.parse(stored) : [];
    sessions.push(newSession);
    localStorage.setItem('osuolale_login_sessions', JSON.stringify(sessions));
    return newSession;
  }

  static async getLoginSessions(): Promise<LoginSession[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('login_sessions')
        .select('*')
        .order('login_time', { ascending: false });
      if (error) throw error;
      return (data || []).map(s => convertDates(s, ['login_time', 'logout_time']));
    }
    // Fallback
    const stored = localStorage.getItem('osuolale_login_sessions');
    return stored ? JSON.parse(stored).map((s: any) => convertDates(s, ['loginTime', 'logoutTime'])) : [];
  }

  static async endLoginSession(sessionId: string): Promise<boolean> {
    if (this.useSupabase) {
      const { error } = await supabase
        .from('login_sessions')
        .update({ logout_time: new Date(), session_active: false })
        .eq('id', sessionId);
      if (error) throw error;
      return true;
    }
    // Fallback
    const sessions = await this.getLoginSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index === -1) return false;
    sessions[index].logoutTime = new Date();
    sessions[index].sessionActive = false;
    localStorage.setItem('osuolale_login_sessions', JSON.stringify(sessions));
    return true;
  }

  // ==================== LOAN APPLICATIONS ====================

  static async getLoanApplications(): Promise<LoanApplication[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(l => convertDates(l, ['applied_at', 'reviewed_at', 'disbursed_at']));
    }
    // Fallback
    const stored = localStorage.getItem('osuolale_loan_applications');
    return stored ? JSON.parse(stored).map((l: any) => convertDates(l, ['appliedAt', 'reviewedAt', 'disbursedAt'])) : [];
  }

  static async createLoanApplication(loanData: Omit<LoanApplication, 'id' | 'appliedAt' | 'status'>): Promise<LoanApplication> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('loan_applications')
        .insert([{
          member_id: loanData.memberId,
          amount: loanData.amount,
          purpose: loanData.purpose,
          duration: loanData.duration,
          status: 'pending'
        }])
        .select()
        .single();
      if (error) throw error;
      return convertDates(data, ['applied_at', 'reviewed_at', 'disbursed_at']);
    }
    // Fallback
    const newLoan: LoanApplication = {
      ...loanData,
      id: Date.now().toString(),
      appliedAt: new Date(),
      status: 'pending'
    };
    const loans = await this.getLoanApplications();
    loans.unshift(newLoan);
    localStorage.setItem('osuolale_loan_applications', JSON.stringify(loans));
    return newLoan;
  }

  static async updateLoanApplication(id: string, updates: Partial<LoanApplication>): Promise<LoanApplication | null> {
    if (this.useSupabase) {
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.reviewedAt) dbUpdates.reviewed_at = updates.reviewedAt;
      if (updates.reviewedBy) dbUpdates.reviewed_by = updates.reviewedBy;
      if (updates.reviewNotes) dbUpdates.review_notes = updates.reviewNotes;
      if (updates.disbursedAt) dbUpdates.disbursed_at = updates.disbursedAt;

      const { data, error } = await supabase
        .from('loan_applications')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data ? convertDates(data, ['applied_at', 'reviewed_at', 'disbursed_at']) : null;
    }
    // Fallback
    const loans = await this.getLoanApplications();
    const index = loans.findIndex(l => l.id === id);
    if (index === -1) return null;
    loans[index] = { ...loans[index], ...updates };
    localStorage.setItem('osuolale_loan_applications', JSON.stringify(loans));
    return loans[index];
  }

  // ==================== SOCIETIES ====================

  static async getSocieties(): Promise<Society[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase.from('societies').select('*');
      if (error) throw error;
      return (data || []).map(s => convertDates(s, ['created_at']));
    }
    // Fallback
    const stored = localStorage.getItem('osuolale_societies');
    return stored ? JSON.parse(stored).map((s: any) => convertDates(s, ['createdAt'])) : [];
  }
}
