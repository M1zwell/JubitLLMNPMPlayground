import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Copy, Github, Calendar, Code, Terminal, Globe, RefreshCw, Save, Upload,
  Layers, Target, Users, FileText, Image, Database, Mail, Lock, Filter, Share2,
  TrendingUp, Award, Clock, DollarSign, Cpu, Eye, ExternalLink, AlertTriangle,
  Workflow, CheckCircle, Plus, Minus, PlayCircle,
  Brain, Package, Activity, 
  Zap,
  Play, Search,
  ArrowRight,
  Shield, Download, Star, BarChart3, Settings
} from 'lucide-react';
import { useLLMModels } from '../hooks/useLLMModels';
import { useNPMPackages } from '../hooks/useNPMPackages';
import { LLMModel, NPMPackage } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { WorkflowExecutor } from '../lib/execution/workflow-executor';
import { workflowTemplates } from '../lib/execution/workflow-templates';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';
import WorkflowVisualization from './WorkflowVisualization';
