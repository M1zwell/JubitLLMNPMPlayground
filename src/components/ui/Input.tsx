import React, { forwardRef, useState } from 'react';
import { Box } from './Box';
import { cn, createEventHandler } from '../../lib/utils';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  variant?: 'default' | 'filled' | 'flushed';
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'valid' | 'invalid';
  
  // Controlled/uncontrolled pattern
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void | boolean;
  
  // Add-ons
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  
  // Helper text
  helperText?: string;
  errorText?: string;
}

interface InputAddonProps {
  children: React.ReactNode;
  position?: 'left' | 'right';
}

const InputAddon = ({ children, position = 'left' }: InputAddonProps) => {
  return (
    <div className={cn(
      'input-addon flex items-center justify-center px-3 bg-slate-700 border border-slate-600',
      position === 'left' && 'rounded-l-lg border-r-0',
      position === 'right' && 'rounded-r-lg border-l-0'
    )}>
      {children}
    </div>
  );
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  size = 'md',
  state = 'default',
  value,
  defaultValue,
  onChange,
  leftAddon,
  rightAddon,
  helperText,
  errorText,
  className,
  disabled,
  ...rest
}, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const isControlled = value !== undefined;
  const inputValue = isControlled ? value : internalValue;

  const handleChange = createEventHandler<string>((newValue, event) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    if (onChange) {
      return onChange(newValue, event as React.ChangeEvent<HTMLInputElement>);
    }
  });

  const inputClasses = cn(
    // Base styles
    'w-full bg-slate-700 border text-white placeholder-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
    'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
    
    // Size variants
    size === 'sm' && 'px-3 py-2 text-sm',
    size === 'md' && 'px-4 py-2.5 text-sm',
    size === 'lg' && 'px-4 py-3 text-base',
    
    // Variant styles
    variant === 'default' && 'border-slate-600 rounded-lg',
    variant === 'filled' && 'border-transparent bg-slate-600 rounded-lg',
    variant === 'flushed' && 'border-0 border-b-2 border-slate-600 rounded-none bg-transparent px-0',
    
    // State styles
    state === 'valid' && 'border-green-500 focus:ring-green-500',
    state === 'invalid' && 'border-red-500 focus:ring-red-500',
    
    // Addon adjustments
    leftAddon && 'rounded-l-none border-l-0',
    rightAddon && 'rounded-r-none border-r-0',
    
    className
  );

  const containerClasses = cn(
    'input-container',
    leftAddon || rightAddon ? 'flex items-center' : ''
  );

  const inputElement = (
    <input
      ref={ref}
      className={inputClasses}
      value={inputValue}
      onChange={handleChange}
      disabled={disabled}
      {...rest}
    />
  );

  return (
    <Box className="input-wrapper">
      <div className={containerClasses}>
        {leftAddon && <InputAddon position="left">{leftAddon}</InputAddon>}
        {inputElement}
        {rightAddon && <InputAddon position="right">{rightAddon}</InputAddon>}
      </div>
      
      {(helperText || errorText) && (
        <Box mt={1} className="text-xs">
          {state === 'invalid' && errorText ? (
            <span className="text-red-400">{errorText}</span>
          ) : (
            <span className="text-slate-400">{helperText}</span>
          )}
        </Box>
      )}
    </Box>
  );
});

Input.displayName = 'Input';

// Attach sub-components
(Input as any).Addon = InputAddon;

export { InputAddon };