import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  showLabel = false,
  size = 'md'
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  const iconSize = iconSizes[size];
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];
  
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];
  
  const handleSelect = (langCode: 'en' | 'zh') => {
    setLanguage(langCode);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${className}`}
        title={t('language')}
      >
        <Globe size={iconSize} className="text-primary" />
        {showLabel && (
          <span className="text-sm font-medium">
            {currentLanguage.flag} {language === 'en' ? 'EN' : 'ZH'}
          </span>
        )}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 card-minimal overflow-hidden z-20">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code as 'en' | 'zh')}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 
                  ${language === lang.code ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/10'}`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;