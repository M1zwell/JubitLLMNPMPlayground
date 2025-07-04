import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Copy, Github, Calendar, Code, Terminal, Globe, RefreshCw, Save, Upload, 
  Layers, Target, Users, FileText, Image, Database, Mail, Lock, Filter, Share2, 
  TrendingUp, Award, Clock, DollarSign, Cpu, Eye, ExternalLink, AlertTriangle, 
  Workflow, CheckCircle, Plus, Minus, PlayCircle
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, Package, Code, Workflow, Activity, 
  Zap, Target, Users, TrendingUp, Globe,
  RefreshCw, Play, Plus, Search, Filter,
  ArrowRight, CheckCircle, Clock, Database,
  FileText, Image, Mail, Lock, Shield, Download,
  Star, DollarSign, Eye, BarChart3, Settings
} from 'lucide-react';
import { useLLMModels } from '../hooks/useLLMModels';
import { useNPMPackages } from '../hooks/useNPMPackages';
import { LLMModel, NPMPackage } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { WorkflowExecutor } from '../lib/execution/workflow-executor';
import { workflowTemplates } from '../lib/execution/workflow-templates';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';
import WorkflowVisualization from './WorkflowVisualization';

[Rest of the file content remains unchanged]