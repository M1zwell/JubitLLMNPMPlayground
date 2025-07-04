import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false,
  size = 'md'
}) => {
  const { theme, toggleTheme } = useTheme();
  
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  const iconSize = iconSizes[size];
  
  return (
    <button 
      onClick={toggleTheme}
      className={`flex items-center gap-2 ${className}`}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Moon size={iconSize} className="text-primary" />
      ) : (
        <Sun size={iconSize} className="text-primary" />
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;