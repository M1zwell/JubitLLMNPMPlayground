import React from 'react';
import { ExternalLink, Globe, Code, FileText, Shield } from 'lucide-react';

interface OfficialDocumentationCardProps {
  provider: {
    name: string;
    flag: string;
    homepage?: string;
    apiDocs?: string;
    modelsDocs?: string;
  };
  isVerified?: boolean;
}

const OfficialDocumentationCard: React.FC<OfficialDocumentationCardProps> = ({ 
  provider, 
  isVerified = false 
}) => {
  return (
    <div className="bg-gray-800/10 rounded-lg p-4 hover:bg-gray-800/15 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{provider.flag}</span>
        <h4 className="font-bold">{provider.name}</h4>
        {isVerified && (
          <Shield className="text-green-400" size={14} title="Verified Official" />
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        {provider.homepage && (
          <a 
            href={provider.homepage} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Globe size={12} />
            Official Homepage
            <ExternalLink size={10} />
          </a>
        )}
        
        {provider.apiDocs && (
          <a 
            href={provider.apiDocs} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Code size={12} />
            API Documentation
            <ExternalLink size={10} />
          </a>
        )}
        
        {provider.modelsDocs && (
          <a 
            href={provider.modelsDocs} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <FileText size={12} />
            Model Documentation
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
};

export default OfficialDocumentationCard;