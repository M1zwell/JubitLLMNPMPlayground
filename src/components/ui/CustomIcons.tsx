import React from 'react';

interface IconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getIconClass = (size: string = 'md') => {
  const baseClass = 'icon';
  switch (size) {
    case 'sm': return `${baseClass} icon-sm`;
    case 'lg': return `${baseClass} icon-lg`;
    default: return baseClass;
  }
};

export const BrainIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <path d="M12 2C7.58 2 4 5.58 4 10c0 2.5 1.19 4.72 3.04 6.16L8 20h8l.96-3.84C18.81 14.72 20 12.5 20 10c0-4.42-3.58-8-8-8z"/>
    <path d="M9 12h6M9 16h6"/>
  </svg>
);

export const PackageIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <path d="M12 2l9 4.9V17l-9 5-9-5V6.9L12 2z"/>
    <path d="M12 12l9-4.9M12 12V22M12 12L3 7.1"/>
  </svg>
);

export const WorkflowIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <rect x="3" y="3" width="6" height="6" rx="1"/>
    <rect x="15" y="3" width="6" height="6" rx="1"/>
    <rect x="9" y="15" width="6" height="6" rx="1"/>
    <path d="M6 9v6l3 3M18 9v6l-3 3"/>
  </svg>
);

export const ChartIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <path d="M3 3v18h18"/>
    <path d="M18 17V9M13 17v-6M8 17v-4"/>
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

export const XIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

export const ArrowIcon: React.FC<IconProps & { direction?: 'up' | 'down' | 'left' | 'right' }> = ({ 
  size = 'md', 
  className = '', 
  direction = 'right' 
}) => {
  const rotations = {
    right: '',
    left: 'rotate-180',
    up: '-rotate-90',
    down: 'rotate-90'
  };

  return (
    <svg className={`${getIconClass(size)} ${className} ${rotations[direction]}`} viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
};

export const SearchIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

export const LightbulbIcon: React.FC<IconProps> = ({ size = 'md', className = '' }) => (
  <svg className={`${getIconClass(size)} ${className}`} viewBox="0 0 24 24">
    <path d="M9 21h6"/>
    <path d="M12 17h.01"/>
    <path d="M12 3a4 4 0 0 0-4 4 7.12 7.12 0 0 0 2.17 5 3.33 3.33 0 0 1 1.83 3"/>
    <path d="M12 3a4 4 0 0 1 4 4 7.12 7.12 0 0 1-2.17 5 3.33 3.33 0 0 0-1.83 3"/>
  </svg>
);