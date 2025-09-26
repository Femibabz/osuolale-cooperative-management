'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings } from '@/types';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  id: 'default',
  loanInterestRate: 1.5,
  standardLoanTermMonths: 12,
  newMemberLoanEligibilityMonths: 6,
  loanToSharesSavingsRatio: 2,
  lastUpdated: new Date(),
  updatedBy: 'system'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load settings from localStorage or use defaults
    const loadSettings = () => {
      try {
        const storedSettings = localStorage.getItem('cooperative-settings');
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          // Convert date strings back to Date objects
          parsed.lastUpdated = new Date(parsed.lastUpdated);
          setSettings(parsed);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Fall back to default settings
        setSettings(defaultSettings);
      }
      setIsLoading(false);
    };

    loadSettings();
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings: Settings = {
      ...settings,
      ...newSettings,
      lastUpdated: new Date(),
    };

    setSettings(updatedSettings);

    // Save to localStorage
    try {
      localStorage.setItem('cooperative-settings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
