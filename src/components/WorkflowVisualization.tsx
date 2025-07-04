import React from 'react';
import { BarChart3, PieChart, TrendingUp, Activity, Gauge, Zap } from 'lucide-react';

interface MetricData {
  label: string;
  value: number;
  color?: string;
  unit?: string;
}

interface WorkflowVisualizationProps {
  performanceData: MetricData[];
  costData: MetricData[];
  executionStats: {
    totalCost: number;
    estimatedTime: number;
    complexity: string;
    reliability: number;
  };
  workflowComponents: any[];
}

const PerformanceChart: React.FC<{ data: MetricData[]; title: string }> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <BarChart3 size={16} className="text-blue-400" />
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm w-20 truncate text-gray-300">{item.label}</span>
            <div className="flex-1 bg-gray-700/50 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${Math.min((item.value / maxValue) * 100, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
              </div>
            </div>
            <span className="text-xs text-gray-400 w-12 text-right">
              {item.value}{item.unit || ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CircularGauge: React.FC<{ 
  value: number; 
  max: number; 
  label: string; 
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, max, label, color = 'blue', size = 'md' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  
  const sizeMap = {
    sm: { container: 'w-16 h-16', svg: 'w-16 h-16', text: 'text-sm' },
    md: { container: 'w-20 h-20', svg: 'w-20 h-20', text: 'text-base' },
    lg: { container: 'w-24 h-24', svg: 'w-24 h-24', text: 'text-lg' }
  };
  
  const colorMap = {
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    red: '#EF4444',
    purple: '#8B5CF6'
  };
  
  return (
    <div className="text-center">
      <div className={`relative ${sizeMap[size].container} mx-auto mb-2`}>
        <svg className={`${sizeMap[size].svg} transform -rotate-90`} viewBox="0 0 84 84">
          <circle
            cx="42"
            cy="42"
            r="40"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-gray-700"
          />
          <circle
            cx="42"
            cy="42"
            r="40"
            stroke={colorMap[color]}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${colorMap[color]}40)`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${sizeMap[size].text}`}>{value}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
};

const WorkflowDiagram: React.FC<{ workflow: any[]; connections?: any[] }> = ({ 
  workflow, 
  connections = [] 
}) => {
  if (workflow.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-6 border border-white/10 text-center">
        <Activity size={32} className="mx-auto mb-2 text-gray-500" />
        <p className="text-gray-500">No workflow components to visualize</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <Activity size={16} className="text-purple-400" />
        Workflow Visualization
      </h3>
      <div className="relative overflow-x-auto">
        <svg className="w-full h-40" viewBox={`0 0 ${Math.max(800, workflow.length * 120)} 160`}>
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Draw workflow nodes */}
          {workflow.map((node, index) => {
            const x = 100 + index * 120;
            const y = 60;
            const isLLM = node.type === 'llm';
            const isRunning = node.status === 'running';
            const isCompleted = node.status === 'completed';
            
            return (
              <g key={node.id}>
                {/* Node glow effect */}
                {(isRunning || isCompleted) && (
                  <rect
                    x={x - 5}
                    y={y - 5}
                    width={90}
                    height={50}
                    rx={12}
                    fill={isCompleted ? '#10B981' : '#F59E0B'}
                    fillOpacity="0.2"
                    className={isRunning ? 'animate-pulse' : ''}
                  />
                )}
                
                {/* Main node */}
                <rect
                  x={x}
                  y={y}
                  width={80}
                  height={40}
                  rx={8}
                  className={`${
                    isLLM 
                      ? 'fill-purple-600/30 stroke-purple-400' 
                      : 'fill-blue-600/30 stroke-blue-400'
                  } ${isRunning ? 'animate-pulse' : ''}`}
                  strokeWidth="2"
                  filter={isCompleted ? 'drop-shadow(0 0 4px #10B981)' : undefined}
                />
                
                {/* Node icon */}
                <text
                  x={x + 15}
                  y={y + 25}
                  className="fill-white text-lg"
                  textAnchor="middle"
                >
                  {isLLM ? '🧠' : '📦'}
                </text>
                
                {/* Node text */}
                <text
                  x={x + 40}
                  y={y + 26}
                  textAnchor="middle"
                  className="fill-white text-xs font-medium"
                >
                  {node.data?.name?.substring(0, 8) || 'Component'}
                </text>
                
                {/* Status indicator */}
                {isCompleted && (
                  <circle
                    cx={x + 75}
                    cy={y + 5}
                    r="3"
                    className="fill-green-400"
                  />
                )}
                
                {/* Connection arrow */}
                {index < workflow.length - 1 && (
                  <>
                    <line
                      x1={x + 80}
                      y1={y + 20}
                      x2={x + 100}
                      y2={y + 20}
                      className="stroke-purple-400"
                      strokeWidth="2"
                    />
                    <polygon
                      points={`${x + 100},${y + 16} ${x + 108},${y + 20} ${x + 100},${y + 24}`}
                      className="fill-purple-400"
                    />
                  </>
                )}
                
                {/* Data flow animation */}
                {isRunning && index < workflow.length - 1 && (
                  <circle
                    cx={x + 80}
                    cy={y + 20}
                    r="2"
                    className="fill-yellow-400"
                  >
                    <animateMotion
                      dur="2s"
                      repeatCount="indefinite"
                      path={`M 0,0 L 20,0`}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const CostBreakdown: React.FC<{ data: MetricData[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <PieChart size={16} className="text-yellow-400" />
        Cost Breakdown
      </h3>
      
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-yellow-400">
          ${total.toFixed(4)}
        </div>
        <div className="text-xs text-gray-400">Total Cost</div>
      </div>
      
      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const colors = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
          
          return (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
              <span className="text-sm flex-1">{item.label}</span>
              <span className="text-xs text-gray-400">
                ${item.value.toFixed(4)} ({percentage.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RealTimeMetrics: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <CircularGauge 
        value={stats.reliability} 
        max={100} 
        label="Reliability" 
        color="green"
        size="md"
      />
      <CircularGauge 
        value={Math.min(stats.estimatedTime, 10)} 
        max={10} 
        label="Speed (s)" 
        color="blue"
        size="md"
      />
      <CircularGauge 
        value={stats.complexity === 'Low' ? 30 : stats.complexity === 'Medium' ? 60 : 90} 
        max={100} 
        label="Complexity" 
        color="yellow"
        size="md"
      />
      <CircularGauge 
        value={Math.min(stats.totalCost * 1000, 100)} 
        max={100} 
        label="Cost Index" 
        color="purple"
        size="md"
      />
    </div>
  );
};

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  performanceData,
  costData,
  executionStats,
  workflowComponents
}) => {
  return (
    <div className="space-y-6">
      {/* Real-time Metrics Dashboard */}
      <div className="bg-gradient-to-r from-slate-800/50 to-purple-900/50 rounded-xl p-6 border border-purple-400/30">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Gauge className="text-purple-400" />
          Real-time Performance Dashboard
        </h2>
        <RealTimeMetrics stats={executionStats} />
      </div>
      
      {/* Main Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <PerformanceChart 
          data={performanceData} 
          title="Performance Metrics" 
        />
        
        {/* Cost Breakdown */}
        <CostBreakdown data={costData} />
        
        {/* Workflow Diagram */}
        <div className="lg:col-span-1 xl:col-span-1">
          <WorkflowDiagram workflow={workflowComponents} />
        </div>
      </div>
      
      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
            Efficiency Trends
          </h3>
          <div className="space-y-3">
            {['CPU Usage', 'Memory', 'Network', 'Disk I/O'].map((metric, index) => {
              const value = Math.floor(Math.random() * 40) + 30; // Mock data
              return (
                <div key={metric} className="flex items-center gap-3">
                  <span className="text-sm w-20">{metric}</span>
                  <div className="flex-1 bg-gray-700/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 w-12">{value}%</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            Optimization Suggestions
          </h3>
          <div className="space-y-2">
            {[
              'Consider using GPT-3.5 for cost optimization',
              'Add data validation to improve reliability',
              'Implement caching for better performance',
              'Use streaming for large data processing'
            ].map((suggestion, index) => (
              <div key={index} className="text-sm p-2 bg-yellow-600/20 rounded border-l-2 border-yellow-400">
                💡 {suggestion}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowVisualization;