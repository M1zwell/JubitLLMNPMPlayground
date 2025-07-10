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
  | 'multi-model-chat';

// Define the playground state interface
interface PlaygroundState {
  currentView: PlaygroundView;
  isLoading: boolean;
  error: string | null;
  // Add more state properties as needed
}

// Define the actions interface
interface PlaygroundActions {
  setCurrentView: (view: PlaygroundView) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // Add more actions as needed
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