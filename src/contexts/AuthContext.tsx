'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { db } from '@/lib/mock-data';
import { AutomaticInterestService } from '@/lib/automatic-interest-service';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  needsMonthlyProcessing: boolean;
  lastProcessingInfo: {
    month: string;
    date: Date;
    membersProcessed: number;
    totalInterest: number;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsMonthlyProcessing, setNeedsMonthlyProcessing] = useState(false);
  const [lastProcessingInfo, setLastProcessingInfo] = useState<{
    month: string;
    date: Date;
    membersProcessed: number;
    totalInterest: number;
  } | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('osuolale_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Check if monthly processing is needed
    setNeedsMonthlyProcessing(AutomaticInterestService.needsProcessing());

    // Get last processing info
    const lastProcessing = AutomaticInterestService.getLastProcessingResult();
    if (lastProcessing) {
      setLastProcessingInfo({
        month: AutomaticInterestService.getMonthName(lastProcessing.month),
        date: lastProcessing.processedAt,
        membersProcessed: lastProcessing.result.processedMembers,
        totalInterest: lastProcessing.result.totalInterestCharged
      });
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = db.findUserByEmail(email);

    if (foundUser && foundUser.password === password) {
      setUser(foundUser);
      localStorage.setItem('osuolale_user', JSON.stringify(foundUser));

      // Check if monthly processing is needed after login
      setNeedsMonthlyProcessing(AutomaticInterestService.needsProcessing());

      // Update last processing info
      const lastProcessing = AutomaticInterestService.getLastProcessingResult();
      if (lastProcessing) {
        setLastProcessingInfo({
          month: AutomaticInterestService.getMonthName(lastProcessing.month),
          date: lastProcessing.processedAt,
          membersProcessed: lastProcessing.result.processedMembers,
          totalInterest: lastProcessing.result.totalInterestCharged
        });
      }

      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('osuolale_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      needsMonthlyProcessing,
      lastProcessingInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
