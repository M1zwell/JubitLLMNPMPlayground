import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, LLMModel, NPMPackage } from '../lib/supabase';
import { useLLMModels } from '../hooks/useLLMModels';
import { useNPMPackages } from '../hooks/useNPMPackages';

interface WorkflowComponent {
  id: string;
  type: 'llm' | 'npm';
  data: LLMModel | NPMPackage;
  config: any;
  position: { x: number; y: number };
  status: 'ready' | 'running' | 'completed' | 'error';
}

interface PlaygroundState {
  // Data
  llmModels: LLMModel[];
  npmPackages: NPMPackage[];
  
  // Current selections
  selectedLLMModel: LLMModel | null;
  selectedNPMPackage: NPMPackage | null;
  
  // Workflow state
  workflowComponents: WorkflowComponent[];
  isExecuting: boolean;
  executionResults: Record<string, any>;
  
  // UI state
  currentView: string;
  searchTerms: {
    llm: string;
    npm: string;
  };
  filters: {
    llmCategory: string;
    llmProvider: string;
    npmCategory: string;
  };
  
  // Real-time updates
  lastUpdate: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

interface PlaygroundActions {
  // Data actions
  refreshLLMModels: () => Promise<void>;
  refreshNPMPackages: () => Promise<void>;
  
  // Selection actions
  selectLLMModel: (model: LLMModel) => void;
  selectNPMPackage: (pkg: NPMPackage) => void;
  
  // Workflow actions
  addComponentToWorkflow: (component: LLMModel | NPMPackage, type: 'llm' | 'npm') => void;
  removeComponentFromWorkflow: (componentId: string) => void;
  executeWorkflow: () => Promise<void>;
  clearWorkflow: () => void;
  
  // Navigation actions
  setCurrentView: (view: string) => void;
  navigateToPlaygroundWithComponent: (component: LLMModel | NPMPackage, type: 'llm' | 'npm') => void;
  
  // Search and filter actions
  setLLMSearch: (term: string) => void;
  setNPMSearch: (term: string) => void;
  setLLMCategory: (category: string) => void;
  setLLMProvider: (provider: string) => void;
  setNPMCategory: (category: string) => void;
}

const PlaygroundContext = createContext<{
  state: PlaygroundState;
  actions: PlaygroundActions;
} | null>(null);

export const usePlayground = () => {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error('usePlayground must be used within a PlaygroundProvider');
  }
  return context;
};

export const PlaygroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PlaygroundState>({
    llmModels: [],
    npmPackages: [],
    selectedLLMModel: null,
    selectedNPMPackage: null,
    workflowComponents: [],
    isExecuting: false,
    executionResults: {},
    currentView: 'llm-market',
    searchTerms: { llm: '', npm: '' },
    filters: { llmCategory: 'all', llmProvider: 'all', npmCategory: 'all' },
    lastUpdate: new Date().toISOString(),
    connectionStatus: 'connected'
  });

  // Use existing hooks for data fetching
  const { models: llmModels, loading: llmLoading, refetch: refetchLLM } = useLLMModels();
  const { packages: npmPackages, loading: npmLoading, refetch: refetchNPM } = useNPMPackages({ 
    search: state.searchTerms.npm,
    category: state.filters.npmCategory,
    limit: 200 
  });

  // Update state when data changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      llmModels: llmModels || [],
      connectionStatus: llmLoading ? 'connected' : 'connected'
    }));
  }, [llmModels, llmLoading]);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      npmPackages: npmPackages || [],
      connectionStatus: npmLoading ? 'connected' : 'connected'
    }));
  }, [npmPackages, npmLoading]);

  // Real-time subscriptions
  useEffect(() => {
    const llmSubscription = supabase
      .channel('llm_models_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'llm_models' },
        (payload) => {
          console.log('LLM models updated:', payload);
          refetchLLM();
          setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }));
        }
      )
      .subscribe();

    const npmSubscription = supabase
      .channel('npm_packages_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'npm_packages' },
        (payload) => {
          console.log('NPM packages updated:', payload);
          refetchNPM();
          setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }));
        }
      )
      .subscribe();

    return () => {
      llmSubscription.unsubscribe();
      npmSubscription.unsubscribe();
    };
  }, [refetchLLM, refetchNPM]);

  // Mock LLM execution (replace with real API calls)
  const executeLLMComponent = async (component: WorkflowComponent, input: any) => {
    const model = component.data as LLMModel;
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses = {
      'reasoning': `🧠 Advanced reasoning analysis of: ${JSON.stringify(input)}\n\nKey insights:\n• Complex pattern detected\n• Logical structure identified\n• Recommendations: ${Math.random() > 0.5 ? 'Optimize for efficiency' : 'Focus on accuracy'}`,
      'coding': `💻 Code analysis for: ${JSON.stringify(input)}\n\n\`\`\`javascript\n// Generated code solution\nfunction process(data) {\n  return data.map(item => optimize(item));\n}\n\`\`\`\n\nCode quality: ${90 + Math.floor(Math.random() * 10)}%`,
      'multimodal': `🎯 Multimodal analysis: ${JSON.stringify(input)}\n\nProcessed multiple data types:\n• Text understanding: Complete\n• Data structure: Validated\n• Output format: Optimized`,
      'lightweight': `⚡ Fast processing: ${JSON.stringify(input)}\n\nQuick analysis completed:\n• Processing time: ${Math.random() * 2 + 0.5}s\n• Efficiency: 95%\n• Result: Optimized output`,
      'budget': `💰 Cost-effective analysis: ${JSON.stringify(input)}\n\nBudget-friendly processing:\n• Cost: $0.001\n• Quality: High\n• Speed: Adequate`
    };

    return responses[model.category] || `${model.name} processed: ${JSON.stringify(input)}`;
  };

  // Mock NPM execution
  const executeNPMComponent = async (component: WorkflowComponent, input: any) => {
    const pkg = component.data as NPMPackage;
    await new Promise(resolve => setTimeout(resolve, 800));

    const executions: Record<string, any> = {
      'lodash': `Lodash processing completed:\n• Input: ${JSON.stringify(input)}\n• Operations: map, filter, reduce\n• Result: ${JSON.stringify(input).length > 50 ? '[large dataset processed]' : input}`,
      'axios': `HTTP request simulation:\n• Method: GET\n• Status: 200 OK\n• Response time: ${Math.random() * 500 + 100}ms\n• Data: { success: true, processed: true }`,
      'joi': `Data validation:\n• Schema validation: ✅ Passed\n• Field count: ${Array.isArray(input) ? input.length : 1}\n• Errors: 0\n• Warnings: ${Math.floor(Math.random() * 3)}`,
      'sharp': `Image processing:\n• Format: WebP\n• Quality: 90%\n• Size reduction: ${Math.floor(Math.random() * 40 + 30)}%\n• Optimization: Complete`,
      'moment': `Date processing:\n• Input: ${input}\n• Formatted: ${new Date().toISOString()}\n• Timezone: UTC\n• Operations: parse, format, validate`
    };

    return executions[pkg.name] || `${pkg.name} executed successfully with input: ${JSON.stringify(input)}`;
  };

  const actions: PlaygroundActions = {
    refreshLLMModels: async () => {
      try {
        await refetchLLM();
        setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }));
      } catch (error) {
        setState(prev => ({ ...prev, connectionStatus: 'error' }));
      }
    },

    refreshNPMPackages: async () => {
      try {
        await refetchNPM();
        setState(prev => ({ ...prev, lastUpdate: new Date().toISOString() }));
      } catch (error) {
        setState(prev => ({ ...prev, connectionStatus: 'error' }));
      }
    },

    selectLLMModel: (model) => {
      setState(prev => ({ ...prev, selectedLLMModel: model }));
    },

    selectNPMPackage: (pkg) => {
      setState(prev => ({ ...prev, selectedNPMPackage: pkg }));
    },

    addComponentToWorkflow: (component, type) => {
      const newComponent: WorkflowComponent = {
        id: `${type}_${component.id}_${Date.now()}`,
        type,
        data: component,
        config: {},
        position: { 
          x: 100 + (state.workflowComponents.length * 200), 
          y: 100 
        },
        status: 'ready'
      };
      
      setState(prev => ({
        ...prev,
        workflowComponents: [...prev.workflowComponents, newComponent],
        selectedLLMModel: type === 'llm' ? component as LLMModel : prev.selectedLLMModel,
        selectedNPMPackage: type === 'npm' ? component as NPMPackage : prev.selectedNPMPackage
      }));
    },

    removeComponentFromWorkflow: (componentId) => {
      setState(prev => ({
        ...prev,
        workflowComponents: prev.workflowComponents.filter(c => c.id !== componentId),
        executionResults: Object.fromEntries(
          Object.entries(prev.executionResults).filter(([id]) => id !== componentId)
        )
      }));
    },

    executeWorkflow: async () => {
      if (state.workflowComponents.length === 0) return;

      setState(prev => ({ ...prev, isExecuting: true, executionResults: {} }));
      
      try {
        let currentInput = "Initial workflow input data";
        const results: Record<string, any> = {};

        for (const component of state.workflowComponents) {
          setState(prev => ({
            ...prev,
            workflowComponents: prev.workflowComponents.map(c =>
              c.id === component.id ? { ...c, status: 'running' } : c
            )
          }));

          let result;
          if (component.type === 'llm') {
            result = await executeLLMComponent(component, currentInput);
          } else {
            result = await executeNPMComponent(component, currentInput);
          }

          results[component.id] = result;
          currentInput = result;

          setState(prev => ({
            ...prev,
            workflowComponents: prev.workflowComponents.map(c =>
              c.id === component.id ? { ...c, status: 'completed' } : c
            ),
            executionResults: { ...prev.executionResults, [component.id]: result }
          }));
        }
      } catch (error) {
        console.error('Workflow execution error:', error);
        setState(prev => ({
          ...prev,
          workflowComponents: prev.workflowComponents.map(c => ({ ...c, status: 'error' }))
        }));
      } finally {
        setState(prev => ({ ...prev, isExecuting: false }));
      }
    },

    clearWorkflow: () => {
      setState(prev => ({
        ...prev,
        workflowComponents: [],
        executionResults: {},
        selectedLLMModel: null,
        selectedNPMPackage: null
      }));
    },

    setCurrentView: (view) => {
      setState(prev => ({ ...prev, currentView: view }));
    },

    navigateToPlaygroundWithComponent: (component, type) => {
      if (type === 'llm') {
        actions.selectLLMModel(component as LLMModel);
        actions.setCurrentView('unified-playground');
      } else {
        actions.selectNPMPackage(component as NPMPackage);
        actions.setCurrentView('unified-playground');
      }
    },

    setLLMSearch: (term) => {
      setState(prev => ({
        ...prev,
        searchTerms: { ...prev.searchTerms, llm: term }
      }));
    },

    setNPMSearch: (term) => {
      setState(prev => ({
        ...prev,
        searchTerms: { ...prev.searchTerms, npm: term }
      }));
    },

    setLLMCategory: (category) => {
      setState(prev => ({
        ...prev,
        filters: { ...prev.filters, llmCategory: category }
      }));
    },

    setLLMProvider: (provider) => {
      setState(prev => ({
        ...prev,
        filters: { ...prev.filters, llmProvider: provider }
      }));
    },

    setNPMCategory: (category) => {
      setState(prev => ({
        ...prev,
        filters: { ...prev.filters, npmCategory: category }
      }));
    }
  };

  return (
    <PlaygroundContext.Provider value={{ state, actions }}>
      {children}
    </PlaygroundContext.Provider>
  );
};