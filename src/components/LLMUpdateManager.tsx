import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Play,
  Pause,
  Calendar,
  TrendingUp,
  Database,
  Globe
} from 'lucide-react';
import { useLLMUpdates } from '../hooks/useLLMUpdates';

interface UpdateManagerProps {
  onUpdateComplete?: () => void;
}

const LLMUpdateManager: React.FC<UpdateManagerProps> = ({ onUpdateComplete }) => {
  const { updating, updateStatus, lastUpdate, triggerUpdate, scheduleUpdate } = useLLMUpdates();
  const [showScheduler, setShowScheduler] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(24); // hours
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('llm-update-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setAutoUpdateEnabled(settings.autoUpdateEnabled || false);
      setUpdateInterval(settings.updateInterval || 24);
    }

    // Load last update time
    const lastUpdateStored = localStorage.getItem('llm-last-update');
    if (lastUpdateStored) {
      setLastUpdateTime(lastUpdateStored);
    }
  }, []);

  const handleManualUpdate = async () => {
    try {
      await triggerUpdate('manual');
      const now = new Date().toISOString();
      setLastUpdateTime(now);
      localStorage.setItem('llm-last-update', now);
      onUpdateComplete?.();
    } catch (error) {
      console.error('Manual update failed:', error);
    }
  };

  const handleScheduleUpdate = async () => {
    try {
      await scheduleUpdate(updateInterval);
      setAutoUpdateEnabled(true);
      
      // Save settings
      const settings = {
        autoUpdateEnabled: true,
        updateInterval
      };
      localStorage.setItem('llm-update-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to schedule update:', error);
    }
  };

  const toggleAutoUpdate = () => {
    const newEnabled = !autoUpdateEnabled;
    setAutoUpdateEnabled(newEnabled);
    
    const settings = {
      autoUpdateEnabled: newEnabled,
      updateInterval
    };
    localStorage.setItem('llm-update-settings', JSON.stringify(settings));
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Never';
    return new Date(timeString).toLocaleString();
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdateTime) return 'No recent updates';
    
    const now = new Date();
    const lastUpdate = new Date(lastUpdateTime);
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="text-purple-400" size={24} />
          <div>
            <h3 className="text-xl font-bold text-white">LLM Data Manager</h3>
            <p className="text-gray-400 text-sm">Keep model data current with artificialanalysis.ai</p>
          </div>
        </div>
        <button
          onClick={() => setShowScheduler(!showScheduler)}
          className="p-2 bg-white/10 hover:bg-white/15 rounded-lg transition-colors"
          title="Update Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Update Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-blue-400" size={16} />
            <span className="text-sm font-medium">Last Update</span>
          </div>
          <div className="text-lg font-bold">{formatTime(lastUpdateTime)}</div>
          <div className="text-xs text-gray-400">{getTimeSinceUpdate()}</div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {autoUpdateEnabled ? (
              <CheckCircle className="text-green-400" size={16} />
            ) : (
              <Pause className="text-gray-400" size={16} />
            )}
            <span className="text-sm font-medium">Auto Update</span>
          </div>
          <div className="text-lg font-bold">
            {autoUpdateEnabled ? 'Enabled' : 'Disabled'}
          </div>
          <div className="text-xs text-gray-400">
            {autoUpdateEnabled ? `Every ${updateInterval}h` : 'Manual only'}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-400" size={16} />
            <span className="text-sm font-medium">Data Source</span>
          </div>
          <div className="text-lg font-bold">Live</div>
          <div className="text-xs text-gray-400">artificialanalysis.ai</div>
        </div>
      </div>

      {/* Update Status Message */}
      {updateStatus && (
        <div className={`p-4 rounded-lg mb-4 ${
          updateStatus.includes('✅') 
            ? 'bg-green-600/20 border border-green-600/30' 
            : updateStatus.includes('❌')
            ? 'bg-red-600/20 border border-red-600/30'
            : 'bg-blue-600/20 border border-blue-600/30'
        }`}>
          <p className="text-sm">{updateStatus}</p>
        </div>
      )}

      {/* Last Update Stats */}
      {lastUpdate && (
        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-2">Last Update Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Processed:</span>
              <span className="ml-2 font-bold">{lastUpdate.models_processed}</span>
            </div>
            <div>
              <span className="text-gray-400">Added:</span>
              <span className="ml-2 font-bold text-green-400">{lastUpdate.models_added}</span>
            </div>
            <div>
              <span className="text-gray-400">Updated:</span>
              <span className="ml-2 font-bold text-blue-400">{lastUpdate.models_updated}</span>
            </div>
            <div>
              <span className="text-gray-400">Providers:</span>
              <span className="ml-2 font-bold">{lastUpdate.providers_updated?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Update Button */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleManualUpdate}
          disabled={updating}
          className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors"
        >
          <RefreshCw size={20} className={updating ? 'animate-spin' : ''} />
          {updating ? 'Updating...' : 'Update Now'}
        </button>

        <button
          onClick={toggleAutoUpdate}
          className={`px-4 py-3 rounded-lg transition-colors ${
            autoUpdateEnabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {autoUpdateEnabled ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>

      {/* Schedule Settings */}
      {showScheduler && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Calendar size={16} />
            Schedule Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Update Interval (hours)
              </label>
              <select
                value={updateInterval}
                onChange={(e) => setUpdateInterval(parseInt(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              >
                <option value={1}>Every hour</option>
                <option value={6}>Every 6 hours</option>
                <option value={12}>Every 12 hours</option>
                <option value={24}>Daily</option>
                <option value={168}>Weekly</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleScheduleUpdate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-400 mt-4 flex items-center gap-2">
        <Globe size={12} />
        <span>Data synchronized with artificialanalysis.ai leaderboard</span>
      </div>
    </div>
  );
};

export default LLMUpdateManager;