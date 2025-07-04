/**
 * Bridge between the NPM ecosystem and the application
 * Provides type definitions and interfaces for NPM package integration
 */

export interface NPMPackageDefinition {
  name: string;
  version: string;
  description?: string;
  input?: {
    type: 'string' | 'object' | 'array' | 'buffer' | 'stream' | 'any';
    required: boolean;
    schema?: object;
    description?: string;
  };
  output?: {
    type: 'string' | 'object' | 'array' | 'buffer' | 'stream' | 'any';
    schema?: object;
    description?: string;
  };
  configuration?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      default?: any;
      required?: boolean;
      description?: string;
    };
  };
  examples?: {
    name: string;
    description: string;
    code: string;
    input: any;
    output: any;
  }[];
  documentation?: string;
  sandbox?: {
    allowedAPIs?: string[];
    timeout?: number;
    memory?: number;
  };
}

export interface NPMPackageMetadata {
  downloads: {
    weekly: number;
    monthly: number;
    yearly: number;
  };
  github?: {
    stars: number;
    forks: number;
    issues: number;
    lastCommit: string;
  };
  security?: {
    vulnerabilities: number;
    score: number;
  };
  quality: {
    score: number;
    tests: number;
    coverage: number;
  };
  popularity: {
    score: number;
    dependents: number;
  };
}

// Known package input/output schemas for popular packages
export const PACKAGE_DEFINITIONS: Record<string, NPMPackageDefinition> = {
  'lodash': {
    name: 'lodash',
    version: '4.17.21',
    description: 'Utility library for JavaScript',
    input: {
      type: 'any',
      required: true,
      description: 'Data to process'
    },
    output: {
      type: 'any',
      description: 'Processed data'
    },
    examples: [
      {
        name: 'Map Example',
        description: 'Transform array elements',
        code: 'return _.map(input, x => x * 2);',
        input: [1, 2, 3],
        output: [2, 4, 6]
      },
      {
        name: 'Filter Example',
        description: 'Filter array elements',
        code: 'return _.filter(input, x => x > 2);',
        input: [1, 2, 3, 4, 5],
        output: [3, 4, 5]
      }
    ],
    sandbox: {
      allowedAPIs: ['Array', 'Object', 'Math'],
      timeout: 5000
    }
  },
  
  'papaparse': {
    name: 'papaparse',
    version: '5.4.1',
    description: 'Fast and powerful CSV parser',
    input: {
      type: 'string',
      required: true,
      description: 'CSV string to parse'
    },
    output: {
      type: 'object',
      description: 'Parsed CSV data'
    },
    configuration: {
      header: {
        type: 'boolean',
        default: false,
        description: 'If true, the first row of parsed data will be interpreted as field names'
      },
      dynamicTyping: {
        type: 'boolean',
        default: false,
        description: 'If true, numeric and boolean data will be converted to their type'
      },
      skipEmptyLines: {
        type: 'boolean',
        default: false,
        description: 'If true, empty lines will be skipped'
      }
    },
    examples: [
      {
        name: 'Parse CSV',
        description: 'Parse CSV with headers',
        code: 'return Papa.parse(input, { header: true });',
        input: 'name,age\nJohn,30\nJane,25',
        output: {
          data: [
            { name: 'John', age: '30' },
            { name: 'Jane', age: '25' }
          ],
          errors: [],
          meta: {
            delimiter: ',',
            linebreak: '\n',
            aborted: false,
            truncated: false,
            fields: ['name', 'age']
          }
        }
      }
    ],
    sandbox: {
      allowedAPIs: ['String', 'Array', 'Object'],
      timeout: 5000
    }
  },
  
  'mathjs': {
    name: 'mathjs',
    version: '11.8.2',
    description: 'Math library for JavaScript and Node.js',
    input: {
      type: 'string',
      required: true,
      description: 'Math expression to evaluate'
    },
    output: {
      type: 'any',
      description: 'Evaluation result'
    },
    examples: [
      {
        name: 'Evaluate Expression',
        description: 'Evaluate a mathematical expression',
        code: 'return math.evaluate(input);',
        input: '2 + 2 * 3',
        output: 8
      },
      {
        name: 'Matrix Operations',
        description: 'Perform matrix operations',
        code: 'const m = math.matrix([[1, 2], [3, 4]]); return math.multiply(m, 2).valueOf();',
        input: '',
        output: [[2, 4], [6, 8]]
      }
    ],
    sandbox: {
      allowedAPIs: ['Math', 'Array'],
      timeout: 10000
    }
  },
  
  'axios': {
    name: 'axios',
    version: '1.6.2',
    description: 'Promise based HTTP client',
    input: {
      type: 'string',
      required: true,
      description: 'URL to fetch'
    },
    output: {
      type: 'object',
      description: 'HTTP response'
    },
    configuration: {
      method: {
        type: 'string',
        default: 'GET',
        description: 'HTTP method'
      },
      headers: {
        type: 'object',
        default: {},
        description: 'HTTP headers'
      }
    },
    examples: [
      {
        name: 'Simple GET Request',
        description: 'Make a GET request to a URL',
        code: 'return axios.get(input).then(response => response.data);',
        input: 'https://jsonplaceholder.typicode.com/todos/1',
        output: {
          userId: 1,
          id: 1,
          title: 'delectus aut autem',
          completed: false
        }
      }
    ],
    sandbox: {
      allowedAPIs: ['fetch', 'JSON', 'Promise'],
      timeout: 15000
    }
  },
  
  'validator': {
    name: 'validator',
    version: '13.11.0',
    description: 'String validation and sanitization',
    input: {
      type: 'string',
      required: true,
      description: 'String to validate'
    },
    output: {
      type: 'boolean',
      description: 'Validation result'
    },
    examples: [
      {
        name: 'Email Validation',
        description: 'Validate an email address',
        code: 'return validator.isEmail(input);',
        input: 'test@example.com',
        output: true
      },
      {
        name: 'URL Validation',
        description: 'Validate a URL',
        code: 'return validator.isURL(input);',
        input: 'https://example.com',
        output: true
      }
    ],
    sandbox: {
      allowedAPIs: ['String', 'RegExp'],
      timeout: 5000
    }
  },
  
  'joi': {
    name: 'joi',
    version: '17.11.0',
    description: 'Schema validation for JavaScript objects',
    input: {
      type: 'object',
      required: true,
      description: 'Object to validate'
    },
    output: {
      type: 'object',
      description: 'Validation result'
    },
    examples: [
      {
        name: 'Schema Validation',
        description: 'Validate an object against a schema',
        code: 'const schema = Joi.object({ name: Joi.string().required(), age: Joi.number().min(0) }); return schema.validate(input);',
        input: { name: 'John', age: 30 },
        output: { value: { name: 'John', age: 30 } }
      }
    ],
    sandbox: {
      allowedAPIs: ['Object'],
      timeout: 5000
    }
  },
  
  'uuid': {
    name: 'uuid',
    version: '9.0.1',
    description: 'Generate UUID strings',
    input: {
      type: 'any',
      required: false,
      description: 'Optional input, not used for v4 UUIDs'
    },
    output: {
      type: 'string',
      description: 'Generated UUID'
    },
    examples: [
      {
        name: 'Generate UUID v4',
        description: 'Generate a random UUID',
        code: 'const { v4 } = uuid; return v4();',
        input: null,
        output: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
      }
    ],
    sandbox: {
      allowedAPIs: ['crypto', 'Math', 'Date'],
      timeout: 5000
    }
  },
  
  'dayjs': {
    name: 'dayjs',
    version: '1.11.10',
    description: 'Fast 2kB date utility library',
    input: {
      type: 'string',
      required: false,
      description: 'Date string or timestamp'
    },
    output: {
      type: 'string',
      description: 'Formatted date'
    },
    configuration: {
      format: {
        type: 'string',
        default: 'YYYY-MM-DD',
        description: 'Date format'
      }
    },
    examples: [
      {
        name: 'Format Date',
        description: 'Format a date string',
        code: 'return dayjs(input).format("YYYY-MM-DD");',
        input: '2023-01-01T12:00:00Z',
        output: '2023-01-01'
      }
    ],
    sandbox: {
      allowedAPIs: ['Date'],
      timeout: 5000
    }
  }
};

/**
 * Generates code for a specific package based on a basic operation
 */
export function generatePackageCode(packageName: string, operation: string): string {
  const packageDef = PACKAGE_DEFINITIONS[packageName];
  
  if (!packageDef) {
    return 'return input;';
  }
  
  const examples = packageDef.examples || [];
  if (examples.length > 0) {
    return examples[0].code;
  }
  
  // Default code by package name
  switch (packageName) {
    case 'lodash':
      return 'return _.map(input, item => item);';
    case 'papaparse':
      return 'return Papa.parse(input, { header: true });';
    case 'mathjs':
      return 'return math.evaluate(input);';
    case 'axios':
      return 'return (await axios.get(input)).data;';
    case 'validator':
      return 'return validator.isEmail(input);';
    case 'joi':
      return 'const schema = Joi.object().keys({ value: Joi.string().required() }); return schema.validate({ value: input });';
    case 'uuid':
      return 'return uuid.v4();';
    case 'dayjs':
      return 'return dayjs(input).format("YYYY-MM-DD");';
    default:
      return 'return input;';
  }
}

/**
 * Check if a package is supported
 */
export function isPackageSupported(packageName: string): boolean {
  return packageName in PACKAGE_DEFINITIONS;
}

/**
 * Get input requirements for a package
 */
export function getPackageInputType(packageName: string): string {
  const packageDef = PACKAGE_DEFINITIONS[packageName];
  
  if (!packageDef || !packageDef.input) {
    return 'any';
  }
  
  return packageDef.input.type;
}

/**
 * Get output type for a package
 */
export function getPackageOutputType(packageName: string): string {
  const packageDef = PACKAGE_DEFINITIONS[packageName];
  
  if (!packageDef || !packageDef.output) {
    return 'any';
  }
  
  return packageDef.output.type;
}