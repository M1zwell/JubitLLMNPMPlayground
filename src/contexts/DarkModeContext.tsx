import React, { createContext, useContext, useEffect, useState } from 'react';

type DarkModePreference = 'auto' | 'light' | 'dark';

interface DarkModeContextType {
  darkMode: boolean;
  preference: DarkModePreference;
  setPreference: (preference: DarkModePreference) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<DarkModePreference>('auto');
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkModePreference') as DarkModePreference;
    if (saved && ['auto', 'light', 'dark'].includes(saved)) {
      setPreferenceState(saved);
    }

    // Listen to system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calculate actual dark mode state
  const darkMode =
    preference === 'dark' ? true :
    preference === 'light' ? false :
    systemPrefersDark; // auto

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save preference to localStorage
  const setPreference = (newPreference: DarkModePreference) => {
    setPreferenceState(newPreference);
    localStorage.setItem('darkModePreference', newPreference);
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
