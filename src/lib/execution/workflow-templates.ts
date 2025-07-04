import { Workflow } from './workflow-executor';
import { v4 as uuidv4 } from 'uuid';

/**
 * Predefined workflow templates that users can start with
 */

/**
 * Create a new workflow template
 */
function createTemplate(
  name: string,
  description: string,
  nodes: Array<{
    type: 'llm' | 'npm' | 'input' | 'output';
    data: any;
    config?: any;
    position?: { x: number; y: number };
  }>,
  connections: Array<{
    sourceIndex: number;
    targetIndex: number;
  }>
): Workflow {
  // Generate unique IDs for nodes
  const nodesWithIds = nodes.map(node => ({
    id: `${node.type}_${uuidv4().slice(0, 8)}`,
    type: node.type,
    data: node.data,
    config: node.config || {},
    position: node.position || { x: 0, y: 0 },
    status: 'ready' as const
  }));
  
  // Create connections with the actual node IDs
  const connectionsWithIds = connections.map(conn => ({
    source: nodesWithIds[conn.sourceIndex].id,
    target: nodesWithIds[conn.targetIndex].id
  }));
  
  return {
    name,
    description,
    nodes: nodesWithIds,
    connections: connectionsWithIds,
  };
}

/**
 * Text Generation Workflow
 */
export const textGenerationWorkflow = createTemplate(
  'Text Generation',
  'Generate creative text with Claude',
  [
    {
      type: 'input',
      data: {
        label: 'Topic',
        defaultValue: 'artificial intelligence'
      }
    },
    {
      type: 'llm',
      data: {
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        model_id: 'claude-3-5-sonnet',
        input_price: 3.00,
        output_price: 15.00
      },
      config: {
        temperature: 0.7,
        maxTokens: 1000,
        prompt: 'Write a creative and informative blog post about {{input}}. Include a catchy title, introduction, several key points, and a conclusion.'
      }
    },
    {
      type: 'npm',
      data: {
        name: 'marked',
        version: '5.1.0'
      },
      config: {
        code: 'return marked.parse(input);'
      }
    },
    {
      type: 'output',
      data: {
        label: 'Formatted Content'
      }
    }
  ],
  [
    { sourceIndex: 0, targetIndex: 1 },
    { sourceIndex: 1, targetIndex: 2 },
    { sourceIndex: 2, targetIndex: 3 }
  ]
);

/**
 * Data Analysis Workflow
 */
export const dataAnalysisWorkflow = createTemplate(
  'Data Analysis',
  'Analyze CSV data with AI',
  [
    {
      type: 'input',
      data: {
        label: 'CSV Data',
        defaultValue: 'id,name,value\n1,Alpha,34\n2,Beta,56\n3,Gamma,78\n4,Delta,90\n5,Epsilon,12'
      }
    },
    {
      type: 'npm',
      data: {
        name: 'papaparse',
        version: '5.4.1'
      },
      config: {
        code: 'return Papa.parse(input, { header: true }).data;'
      }
    },
    {
      type: 'npm',
      data: {
        name: 'lodash',
        version: '4.17.21'
      },
      config: {
        code: 'return {\n  summary: {\n    count: input.length,\n    avgValue: _.meanBy(input, i => Number(i.value)),\n    minValue: _.minBy(input, i => Number(i.value)).value,\n    maxValue: _.maxBy(input, i => Number(i.value)).value\n  },\n  data: input\n};'
      }
    },
    {
      type: 'llm',
      data: {
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        model_id: 'gpt-4o-mini',
        input_price: 0.15,
        output_price: 0.60
      },
      config: {
        temperature: 0.3,
        maxTokens: 1000,
        prompt: 'Analyze this dataset and provide insights: {{input}}. Include patterns, anomalies, and business recommendations.'
      }
    },
    {
      type: 'output',
      data: {
        label: 'Analysis Results'
      }
    }
  ],
  [
    { sourceIndex: 0, targetIndex: 1 },
    { sourceIndex: 1, targetIndex: 2 },
    { sourceIndex: 2, targetIndex: 3 },
    { sourceIndex: 3, targetIndex: 4 }
  ]
);

/**
 * Code Generation Workflow
 */
export const codeGenerationWorkflow = createTemplate(
  'Code Generator',
  'Generate and format code with LLMs',
  [
    {
      type: 'input',
      data: {
        label: 'Coding Task',
        defaultValue: 'Create a React component that displays a list of items with pagination'
      }
    },
    {
      type: 'llm',
      data: {
        name: 'DeepSeek Coder',
        provider: 'DeepSeek',
        model_id: 'deepseek-coder',
        input_price: 0.14,
        output_price: 0.28
      },
      config: {
        temperature: 0.2,
        maxTokens: 1500,
        prompt: 'Generate high-quality, well-documented TypeScript React code for the following task: {{input}}. Include comments explaining key parts of the implementation.'
      }
    },
    {
      type: 'npm',
      data: {
        name: 'prettier',
        version: '3.0.0'
      },
      config: {
        code: 'return prettier.format(input, { parser: "typescript", semi: true, singleQuote: true });'
      }
    },
    {
      type: 'output',
      data: {
        label: 'Formatted Code'
      }
    }
  ],
  [
    { sourceIndex: 0, targetIndex: 1 },
    { sourceIndex: 1, targetIndex: 2 },
    { sourceIndex: 2, targetIndex: 3 }
  ]
);

/**
 * Data Validation Workflow
 */
export const dataValidationWorkflow = createTemplate(
  'Data Validator',
  'Validate and clean data inputs',
  [
    {
      type: 'input',
      data: {
        label: 'Input Data',
        defaultValue: '{"name":"John Doe","email":"john@example.com","age":"thirty"}'
      }
    },
    {
      type: 'npm',
      data: {
        name: 'joi',
        version: '17.9.2'
      },
      config: {
        code: `const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0)
});

try {
  const data = typeof input === 'string' ? JSON.parse(input) : input;
  const result = schema.validate(data);
  
  return {
    valid: !result.error,
    value: result.value,
    error: result.error ? result.error.message : null,
    details: result.error ? result.error.details : null
  };
} catch (error) {
  return {
    valid: false,
    value: null,
    error: 'Invalid JSON input: ' + error.message,
    details: null
  };
}`
      }
    },
    {
      type: 'llm',
      data: {
        name: 'GPT-4o',
        provider: 'OpenAI',
        model_id: 'gpt-4o',
        input_price: 5.00,
        output_price: 15.00
      },
      config: {
        temperature: 0.3,
        maxTokens: 800,
        prompt: `Analyze this validation result: {{input}}
        
If the data is valid, describe why it passed validation.
If the data is invalid, explain the issues and suggest corrections.
Format your response as a detailed report that a data engineer could use.`
      }
    },
    {
      type: 'output',
      data: {
        label: 'Validation Report'
      }
    }
  ],
  [
    { sourceIndex: 0, targetIndex: 1 },
    { sourceIndex: 1, targetIndex: 2 },
    { sourceIndex: 2, targetIndex: 3 }
  ]
);

/**
 * Content Translation Workflow
 */
export const translationWorkflow = createTemplate(
  'Content Translator',
  'Translate and format content',
  [
    {
      type: 'input',
      data: {
        label: 'Original Text',
        defaultValue: 'Artificial intelligence is transforming industries around the world.'
      }
    },
    {
      type: 'npm',
      data: {
        name: 'validator',
        version: '13.9.0'
      },
      config: {
        code: `// Validate and sanitize input text
const text = typeof input === 'string' ? input.trim() : '';
return {
  original: text,
  language: detectLanguage(text),
  wordCount: text.split(/\\s+/).length,
  sanitized: validator.escape(text) // Prevent XSS
};

function detectLanguage(text) {
  // Very simple language detection
  const langPatterns = {
    en: /^[a-zA-Z0-9\\s.,!?;:'"-]+$/,
    zh: /[\\u4e00-\\u9fa5]/,
    es: /[áéíóúüñ¿¡]/i,
    fr: /[àâçéèêëîïôûùüÿ]/i
  };
  
  for (const [lang, pattern] of Object.entries(langPatterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }
  
  return 'unknown';
}`
      }
    },
    {
      type: 'llm',
      data: {
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        model_id: 'claude-3-5-sonnet',
        input_price: 3.00,
        output_price: 15.00
      },
      config: {
        temperature: 0.3,
        maxTokens: 1000,
        prompt: `Translate the following text into Spanish, French, and Chinese (Simplified).

Original text: {{input.original}}
Detected language: {{input.language}}
Word count: {{input.wordCount}}

Format your response as:

# Translation Results

## Spanish
[Spanish translation]

## French
[French translation]

## Chinese (Simplified)
[Chinese translation]

## Notes
[Any notes about the translation, including idioms or cultural references]`
      }
    },
    {
      type: 'output',
      data: {
        label: 'Translation Results'
      }
    }
  ],
  [
    { sourceIndex: 0, targetIndex: 1 },
    { sourceIndex: 1, targetIndex: 2 },
    { sourceIndex: 2, targetIndex: 3 }
  ]
);

/**
 * AI Chat Assistant Workflow
 */
export const chatAssistantWorkflow = createTemplate(
  'AI Chat Assistant',
  'Chat assistant with memory and processing',
  [
    {
      type: 'input',
      data: {
        label: 'User Message',
        defaultValue: 'What are the main applications of AI in healthcare?'
      }
    },
    {
      type: 'npm',
      data: {
        name: 'dayjs',
        version: '1.11.9'
      },
      config: {
        code: `// Add context information
return {
  message: input,
  timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  context: {
    previousMessages: [],
    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || 'en',
    date: dayjs().format('MMMM D, YYYY')
  }
};`
      }
    },
    {
      type: 'llm',
      data: {
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        model_id: 'claude-3-5-sonnet',
        input_price: 3.00,
        output_price: 15.00
      },
      config: {
        temperature: 0.7,
        maxTokens: 1000,
        prompt: `You are an AI assistant having a conversation with a user. Respond to their message thoughtfully and helpfully.

Current date: {{input.context.date}}
User's timezone: {{input.context.userTimezone}}
User's message: {{input.message}}

Respond in a conversational, friendly tone. Include relevant facts and information. If you're unsure about something, acknowledge that limitation.`
      }
    },
    {
      type: 'npm',
      data: {
        name: 'marked',
        version: '5.1.0'
      },
      config: {
        code: `// Format the response as HTML if it contains Markdown
return {
  originalResponse: input,
  formattedResponse: marked.parse(input),
  timestamp: dayjs().format('HH:mm:ss'),
  messageId: uuidv4()
};`
      }
    },
    {
      type: 'output',
      data: {
        label: 'Assistant Response'
      }
    }
  ],
  [
    { sourceIndex: 0, targetIndex: 1 },
    { sourceIndex: 1, targetIndex: 2 },
    { sourceIndex: 2, targetIndex: 3 },
    { sourceIndex: 3, targetIndex: 4 }
  ]
);

/**
 * All available templates
 */
export const workflowTemplates = {
  textGeneration: textGenerationWorkflow,
  dataAnalysis: dataAnalysisWorkflow,
  codeGeneration: codeGenerationWorkflow,
  dataValidation: dataValidationWorkflow,
  translation: translationWorkflow,
  chatAssistant: chatAssistantWorkflow
};

/**
 * Get all templates
 */
export function getAllTemplates(): Workflow[] {
  return Object.values(workflowTemplates);
}

/**
 * Get a template by ID
 */
export function getTemplate(id: keyof typeof workflowTemplates): Workflow | undefined {
  return workflowTemplates[id];
}