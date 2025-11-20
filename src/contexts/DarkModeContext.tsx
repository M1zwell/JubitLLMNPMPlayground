import React, { createContext, useContext, useEffect, useState } from 'react';

type DarkModePreference = 'auto' | 'light' | 'dark';

interface DarkModeContextType {
  darkMode: boolean;
  preference: DarkModePreference;
  setPreference: (preference: DarkModePreference) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  // Always use dark mode - no toggle needed
  const preference: DarkModePreference = 'dark';
  const darkMode = true;

  // Apply dark mode class to document - always enabled
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Placeholder function - dark mode is always enabled
  const setPreference = (newPreference: DarkModePreference) => {
    // Dark mode is permanently enabled
    console.log('Dark mode is permanently enabled');
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, preference, setPreference }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}
