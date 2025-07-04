import React, { forwardRef } from 'react';
import { Box } from './Box';
import { cn } from '../../lib/utils';

interface CardProps extends React.ComponentProps<typeof Box> {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader = ({ children, className }: CardHeaderProps) => {
  return (
    <div className={cn('card-header border-b border-slate-600 p-4', className)}>
      {children}
    </div>
  );
};

const CardBody = ({ children, className }: CardBodyProps) => {
  return (
    <div className={cn('card-body p-4', className)}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className }: CardFooterProps) => {
  return (
    <div className={cn('card-footer border-t border-slate-600 p-4', className)}>
      {children}
    </div>
  );
};

export const Card = forwardRef<HTMLElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...rest
}, ref) => {
  const cardClasses = cn(
    // Base styles
    'card bg-slate-800 transition-all duration-200',
    
    // Variant styles
    variant === 'default' && 'border border-slate-600 rounded-lg',
    variant === 'outlined' && 'border-2 border-slate-500 rounded-lg bg-transparent',
    variant === 'elevated' && 'border border-slate-600 rounded-lg shadow-lg',
    variant === 'filled' && 'bg-slate-700 rounded-lg border-0',
    
    // Padding variants
    padding === 'none' && '',
    padding === 'sm' && !children?.toString().includes('card-header') && !children?.toString().includes('card-body') && 'p-3',
    padding === 'md' && !children?.toString().includes('card-header') && !children?.toString().includes('card-body') && 'p-4',
    padding === 'lg' && !children?.toString().includes('card-header') && !children?.toString().includes('card-body') && 'p-6',
    
    className
  );

  return (
    <Box ref={ref} className={cardClasses} {...rest}>
      {children}
    </Box>
  );
});

Card.displayName = 'Card';

// Attach sub-components
(Card as any).Header = CardHeader;
(Card as any).Body = CardBody;
(Card as any).Footer = CardFooter;

export { CardHeader, CardBody, CardFooter };