import React, { forwardRef } from 'react';
import { Box } from './Box';
import { cn } from '../../lib/utils';

interface FlexProps extends React.ComponentProps<typeof Box> {
  // Flexbox-specific props
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  wrap?: 'wrap' | 'wrap-reverse' | 'nowrap';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  alignContent?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly' | 'stretch';
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32;
  gapX?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32;
  gapY?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32;
  
  // Flex item props
  grow?: boolean | number;
  shrink?: boolean | number;
  basis?: 'auto' | 'full' | number | string;
}

export const Flex = forwardRef<HTMLElement, FlexProps>(({
  direction = 'row',
  wrap,
  justify,
  align,
  alignContent,
  gap,
  gapX,
  gapY,
  grow,
  shrink,
  basis,
  className,
  ...rest
}, ref) => {
  const flexClasses = cn(
    'flex',
    
    // Direction
    direction === 'row' && 'flex-row',
    direction === 'row-reverse' && 'flex-row-reverse',
    direction === 'col' && 'flex-col',
    direction === 'col-reverse' && 'flex-col-reverse',
    
    // Wrap
    wrap === 'wrap' && 'flex-wrap',
    wrap === 'wrap-reverse' && 'flex-wrap-reverse',
    wrap === 'nowrap' && 'flex-nowrap',
    
    // Justify content
    justify === 'start' && 'justify-start',
    justify === 'end' && 'justify-end',
    justify === 'center' && 'justify-center',
    justify === 'between' && 'justify-between',
    justify === 'around' && 'justify-around',
    justify === 'evenly' && 'justify-evenly',
    
    // Align items
    align === 'start' && 'items-start',
    align === 'end' && 'items-end',
    align === 'center' && 'items-center',
    align === 'baseline' && 'items-baseline',
    align === 'stretch' && 'items-stretch',
    
    // Align content
    alignContent === 'start' && 'content-start',
    alignContent === 'end' && 'content-end',
    alignContent === 'center' && 'content-center',
    alignContent === 'between' && 'content-between',
    alignContent === 'around' && 'content-around',
    alignContent === 'evenly' && 'content-evenly',
    alignContent === 'stretch' && 'content-stretch',
    
    // Gap
    gap !== undefined && `gap-${gap}`,
    gapX !== undefined && `gap-x-${gapX}`,
    gapY !== undefined && `gap-y-${gapY}`,
    
    // Flex item properties
    grow === true && 'flex-grow',
    grow === false && 'flex-grow-0',
    typeof grow === 'number' && `flex-grow-${grow}`,
    
    shrink === true && 'flex-shrink',
    shrink === false && 'flex-shrink-0',
    typeof shrink === 'number' && `flex-shrink-${shrink}`,
    
    basis === 'auto' && 'flex-basis-auto',
    basis === 'full' && 'flex-basis-full',
    typeof basis === 'number' && `flex-basis-${basis}`,
    typeof basis === 'string' && basis !== 'auto' && basis !== 'full' && `flex-basis-[${basis}]`,
    
    className
  );

  return <Box ref={ref} className={flexClasses} {...rest} />;
});

Flex.displayName = 'Flex';