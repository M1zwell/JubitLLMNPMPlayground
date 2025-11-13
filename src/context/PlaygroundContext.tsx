import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the possible views in the application
export type PlaygroundView =
  | 'integrated-hub'
  | 'llm-market'
  | 'llm-playground'
  | 'npm-market'
  | 'npm-playground'
  | 'unified-playground'
  | 'workflow-execution'
  | 'advanced-demo'
  | 'multi-model-chat'
  | 'webb-financial'
  | 'hk-scraper'
  | 'offshore-data'
  | 'web-scraper'
  | 'puppeteer-scraper'
  | 'webb-importer'
  | 'webb-sql'
  | 'webb-direct-import'
  | 'webb-mysql-migrator'
  | 'webb-sql-uploader';

// Define types for LLM models and NPM packages
interface LLMModel {
  id: string;
  name: string;
  provider: string;
  output_price?: number;
  quality_index?: number;
}

interface NPMPackage {
  id: string;
  name: string;
  description?: string;
  weekly_downloads?: number;
  github_stars?: number;
}

interface WorkflowComponent {
  id: string;
  name: string;
  type: 'llm' | 'npm';
}

// Define the playground state interface
interface PlaygroundState {
  currentView: PlaygroundView;
  isLoading: boolean;
  error: string | null;
  
  // Data arrays
  llmModels: LLMModel[];
  npmPackages: NPMPackage[];
  workflowComponents: WorkflowComponent[];
  executionResults: Record<string, any>;
  
  // Connection and sync state
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastUpdate: string;
  
  // Search terms
  searchTerms: {
    llm: string;
    npm: string;
  };
  
  // Selected items
  selectedLLMModel: LLMModel | null;
  selectedNPMPackage: NPMPackage | null;
}

// Define the actions interface
interface PlaygroundActions {
  setCurrentView: (view: PlaygroundView) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Data management actions
  refreshLLMModels: () => void;
  refreshNPMPackages: () => void;
  
  // Search actions
  setLLMSearch: (term: string) => void;
  setNPMSearch: (term: string) => void;
  
  // Selection actions
  selectLLMModel: (model: LLMModel) => void;
  selectNPMPackage: (pkg: NPMPackage) => void;
  
  // Workflow actions
  addComponentToWorkflow: (component: LLMModel | NPMPackage, type: 'llm' | 'npm') => void;
  clearWorkflow: () => void;
}

// Define the context interface
interface PlaygroundContextType {
  state: PlaygroundState;
  actions: PlaygroundActions;
}

// Create the context
const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

// Initial state
const initialState: PlaygroundState = {
  currentView: 'integrated-hub',
  isLoading: false,
  error: null,
  
  // Initialize data arrays
  llmModels: [],
  npmPackages: [],
  workflowComponents: [],
  executionResults: {},
  
  // Initialize connection state
  connectionStatus: 'disconnected',
  lastUpdate: new Date().toISOString(),
  
  // Initialize search terms
  searchTerms: {
    llm: '',
    npm: ''
  },
  
  // Initialize selections
  selectedLLMModel: null,
  selectedNPMPackage: null,
};

// Provider component
interface PlaygroundProviderProps {
  children: ReactNode;
}

export const PlaygroundProvider: React.FC<PlaygroundProviderProps> = ({ children }) => {
  const [state, setState] = useState<PlaygroundState>(initialState);

  const actions: PlaygroundActions = {
    setCurrentView: (view: PlaygroundView) => {
      setState(prev => ({ ...prev, currentView: view }));
    },
    setLoading: (loading: boolean) => {
      setState(prev => ({ ...prev, isLoading: loading }));
    },
    setError: (error: string | null) => {
      setState(prev => ({ ...prev, error }));
    },
    
    // Data management actions
    refreshLLMModels: () => {
      setState(prev => ({ 
        ...prev, 
        isLoading: true,
        lastUpdate: new Date().toISOString()
      }));
      // TODO: Implement actual data fetching
      setTimeout(() => {
        setState(prev => ({ ...prev, isLoading: false }));
      }, 1000);
    },
    refreshNPMPackages: () => {
      setState(prev => ({ 
        ...prev, 
        isLoading: true,
        lastUpdate: new Date().toISOString()
      }));
      // TODO: Implement actual data fetching
      setTimeout(() => {
        setState(prev => ({ ...prev, isLoading: false }));
      }, 1000);
    },
    
    // Search actions
    setLLMSearch: (term: string) => {
      setState(prev => ({ 
        ...prev, 
        searchTerms: { ...prev.searchTerms, llm: term }
      }));
    },
    setNPMSearch: (term: string) => {
      setState(prev => ({ 
        ...prev, 
        searchTerms: { ...prev.searchTerms, npm: term }
      }));
    },
    
    // Selection actions
    selectLLMModel: (model: LLMModel) => {
      setState(prev => ({ ...prev, selectedLLMModel: model }));
    },
    selectNPMPackage: (pkg: NPMPackage) => {
      setState(prev => ({ ...prev, selectedNPMPackage: pkg }));
    },
    
    // Workflow actions
    addComponentToWorkflow: (component: LLMModel | NPMPackage, type: 'llm' | 'npm') => {
      const workflowComponent: WorkflowComponent = {
        id: component.id,
        name: component.name,
        type
      };
      setState(prev => ({ 
        ...prev, 
        workflowComponents: [...prev.workflowComponents, workflowComponent]
      }));
    },
    clearWorkflow: () => {
      setState(prev => ({ 
        ...prev, 
        workflowComponents: [],
        executionResults: {}
      }));
    },
  };

  const contextValue: PlaygroundContextType = {
    state,
    actions,
  };

  return (
    <PlaygroundContext.Provider value={contextValue}>
      {children}
    </PlaygroundContext.Provider>
  );
};

// Custom hook to use the playground context
export const usePlayground = (): PlaygroundContextType => {
  const context = useContext(PlaygroundContext);
  if (context === undefined) {
    throw new Error('usePlayground must be used within a PlaygroundProvider');
  }
  return context;
};