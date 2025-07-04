import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

// Spacing and sizing types
type SpacingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;
type SizeValue = 'auto' | 'full' | 'screen' | 'min' | 'max' | 'fit' | number | string;

interface BoxProps extends Omit<React.HTMLAttributes<HTMLElement>, 'color'> {
  // Tag prop - can be any HTML element or React component
  tag?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
  
  // Margin props
  m?: SpacingValue;
  mt?: SpacingValue;
  mr?: SpacingValue;
  mb?: SpacingValue;
  ml?: SpacingValue;
  mx?: SpacingValue;
  my?: SpacingValue;
  
  // Padding props
  p?: SpacingValue;
  pt?: SpacingValue;
  pr?: SpacingValue;
  pb?: SpacingValue;
  pl?: SpacingValue;
  px?: SpacingValue;
  py?: SpacingValue;
  
  // Size props
  w?: SizeValue;
  h?: SizeValue;
  wMax?: SizeValue;
  hMax?: SizeValue;
  wMin?: SizeValue;
  hMin?: SizeValue;
  
  // Display props
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'hidden';
  
  // Position props
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  
  // Background and border
  bg?: string;
  border?: boolean | string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  // Shadow
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  // Theme variant
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  
  children?: React.ReactNode;
}

// Utility function to convert spacing values to Tailwind classes
const getSpacingClass = (prefix: string, value?: SpacingValue): string => {
  if (value === undefined) return '';
  return `${prefix}-${value}`;
};

// Utility function to convert size values to Tailwind classes
const getSizeClass = (prefix: string, value?: SizeValue): string => {
  if (value === undefined) return '';
  
  if (typeof value === 'number') {
    return `${prefix}-${value}`;
  }
  
  switch (value) {
    case 'auto': return `${prefix}-auto`;
    case 'full': return `${prefix}-full`;
    case 'screen': return `${prefix}-screen`;
    case 'min': return `${prefix}-min`;
    case 'max': return `${prefix}-max`;
    case 'fit': return `${prefix}-fit`;
    default: return `${prefix}-[${value}]`;
  }
};

export const Box = forwardRef<HTMLElement, BoxProps>(({
  tag: Component = 'div',
  className,
  children,
  
  // Margin props
  m, mt, mr, mb, ml, mx, my,
  
  // Padding props
  p, pt, pr, pb, pl, px, py,
  
  // Size props
  w, h, wMax, hMax, wMin, hMin,
  
  // Other props
  display,
  position,
  bg,
  border,
  borderRadius,
  shadow,
  variant,
  
  ...rest
}, ref) => {
  const classes = cn(
    // Base styles
    'box-border',
    
    // Margin classes
    getSpacingClass('m', m),
    getSpacingClass('mt', mt),
    getSpacingClass('mr', mr),
    getSpacingClass('mb', mb),
    getSpacingClass('ml', ml),
    getSpacingClass('mx', mx),
    getSpacingClass('my', my),
    
    // Padding classes
    getSpacingClass('p', p),
    getSpacingClass('pt', pt),
    getSpacingClass('pr', pr),
    getSpacingClass('pb', pb),
    getSpacingClass('pl', pl),
    getSpacingClass('px', px),
    getSpacingClass('py', py),
    
    // Size classes
    getSizeClass('w', w),
    getSizeClass('h', h),
    getSizeClass('max-w', wMax),
    getSizeClass('max-h', hMax),
    getSizeClass('min-w', wMin),
    getSizeClass('min-h', hMin),
    
    // Display
    display && `${display === 'hidden' ? 'hidden' : display === 'block' ? 'block' : display === 'inline' ? 'inline' : display === 'inline-block' ? 'inline-block' : display === 'flex' ? 'flex' : display === 'inline-flex' ? 'inline-flex' : display === 'grid' ? 'grid' : ''}`,
    
    // Position
    position && `${position}`,
    
    // Background
    bg && (bg.startsWith('bg-') ? bg : `bg-${bg}`),
    
    // Border
    border === true && 'border',
    typeof border === 'string' && border,
    
    // Border radius
    borderRadius && `rounded${borderRadius === 'none' ? '-none' : borderRadius === 'sm' ? '-sm' : borderRadius === 'md' ? '' : borderRadius === 'lg' ? '-lg' : borderRadius === 'xl' ? '-xl' : borderRadius === 'full' ? '-full' : ''}`,
    
    // Shadow
    shadow && `shadow${shadow === 'none' ? '-none' : shadow === 'sm' ? '-sm' : shadow === 'md' ? '' : shadow === 'lg' ? '-lg' : shadow === 'xl' ? '-xl' : shadow === '2xl' ? '-2xl' : ''}`,
    
    // Variant styles
    variant === 'primary' && 'bg-indigo-600 text-white',
    variant === 'secondary' && 'bg-slate-600 text-white',
    variant === 'success' && 'bg-green-600 text-white',
    variant === 'warning' && 'bg-yellow-600 text-white',
    variant === 'danger' && 'bg-red-600 text-white',
    variant === 'info' && 'bg-blue-600 text-white',
    
    className
  );

  return (
    <Component ref={ref} className={classes} {...rest}>
      {children}
    </Component>
  );
});

Box.displayName = 'Box';