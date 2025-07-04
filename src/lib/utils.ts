import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Event handler utility to standardize (value, event) pattern
export function createEventHandler<T = any>(
  callback: (value: T, event: React.SyntheticEvent) => void | boolean
) {
  return (event: React.SyntheticEvent) => {
    const target = event.target as HTMLInputElement;
    const value = target.value as T;
    
    const result = callback(value, event);
    if (result === false) {
      event.preventDefault();
    }
  };
}

// Prop merging utility
export function mergeProps(...propObjects: Record<string, any>[]) {
  const merged: Record<string, any> = {};
  
  for (const props of propObjects) {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'className') {
        merged[key] = cn(merged[key], value);
      } else if (key === 'style') {
        merged[key] = { ...merged[key], ...value };
      } else if (typeof value === 'function' && typeof merged[key] === 'function') {
        // Queue callbacks
        const prevCallback = merged[key];
        merged[key] = (...args: any[]) => {
          prevCallback(...args);
          value(...args);
        };
      } else {
        merged[key] = value;
      }
    }
  }
  
  return merged;
}

// Theme tokens
export const theme = {
  colors: {
    primary: {
      50: '#f0f4ff',
      100: '#e0edff',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      900: '#312e81',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      900: '#0f172a',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      900: '#78350f',
    },
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      900: '#7f1d1d',
    },
  },
  spacing: {
    0: '0px',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
} as const;