import React, { forwardRef } from 'react';
import { Box } from './Box';
import { cn } from '../../lib/utils';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

interface ButtonAddonProps {
  children: React.ReactNode;
}

interface ButtonTextProps {
  children: React.ReactNode;
}

const ButtonAddon = ({ children }: ButtonAddonProps) => {
  return (
    <span className="button-addon flex items-center justify-center">
      {children}
    </span>
  );
};

const ButtonText = ({ children }: ButtonTextProps) => {
  return (
    <span className="button-text">
      {children}
    </span>
  );
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...rest
}, ref) => {
  const baseClasses = cn(
    // Base styles
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    
    // Size variants
    size === 'sm' && 'px-3 py-1.5 text-sm rounded-md',
    size === 'md' && 'px-4 py-2 text-sm rounded-lg',
    size === 'lg' && 'px-6 py-3 text-base rounded-lg',
    
    // Variant styles
    variant === 'primary' && [
      'bg-indigo-600 text-white hover:bg-indigo-700',
      'focus:ring-indigo-500 focus:ring-offset-slate-800'
    ],
    variant === 'secondary' && [
      'bg-slate-600 text-white hover:bg-slate-700',
      'focus:ring-slate-500 focus:ring-offset-slate-800'
    ],
    variant === 'success' && [
      'bg-green-600 text-white hover:bg-green-700',
      'focus:ring-green-500 focus:ring-offset-slate-800'
    ],
    variant === 'warning' && [
      'bg-yellow-600 text-white hover:bg-yellow-700',
      'focus:ring-yellow-500 focus:ring-offset-slate-800'
    ],
    variant === 'danger' && [
      'bg-red-600 text-white hover:bg-red-700',
      'focus:ring-red-500 focus:ring-offset-slate-800'
    ],
    variant === 'ghost' && [
      'bg-transparent text-slate-300 hover:bg-slate-700 hover:text-white',
      'focus:ring-slate-500 focus:ring-offset-slate-800'
    ],
    variant === 'outline' && [
      'bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white',
      'focus:ring-slate-500 focus:ring-offset-slate-800'
    ],
    
    // Loading state
    loading && 'cursor-wait',
    
    className
  );

  return (
    <Box
      tag="button"
      ref={ref}
      className={baseClasses}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <ButtonAddon>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        </ButtonAddon>
      )}
      {children}
    </Box>
  );
});

Button.displayName = 'Button';

// Attach sub-components
(Button as any).Addon = ButtonAddon;
(Button as any).Text = ButtonText;

export { ButtonAddon, ButtonText };