import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
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
    <div className="card-minimal">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="text-teal-600" size={16} />
          <div>
            <h3 className="text-subheading">LLM Data Manager</h3>
            <p className="text-caption">Keep model data current with artificialanalysis.ai</p>
          </div>
        </div>
        <button
          onClick={() => setShowScheduler(!showScheduler)}
          className="btn-minimal btn-ghost"
          title="Update Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Update Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="card-minimal bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="text-blue-600" size={14} />
            <span className="text-sm font-medium">Last Update</span>
          </div>
          <div className="text-lg font-semibold">{formatTime(lastUpdateTime)}</div>
          <div className="text-caption">{getTimeSinceUpdate()}</div>
        </div>

        <div className="card-minimal bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-1">
            {autoUpdateEnabled ? (
              <CheckCircle className="text-green-600" size={14} />
            ) : (
              <Pause className="text-gray-500 dark:text-gray-400" size={14} />
            )}
            <span className="text-sm font-medium">Auto Update</span>
          </div>
          <div className="text-lg font-semibold">
            {autoUpdateEnabled ? 'Enabled' : 'Disabled'}
          </div>
          <div className="text-caption">
            {autoUpdateEnabled ? `Every ${updateInterval}h` : 'Manual only'}
          </div>
        </div>

        <div className="card-minimal bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="text-green-600" size={14} />
            <span className="text-sm font-medium">Data Source</span>
          </div>
          <div className="text-lg font-semibold">Live</div>
          <div className="text-caption">artificialanalysis.ai</div>
        </div>
      </div>

      {/* Update Status Message */}
      {updateStatus && (
        <div className={`p-3 rounded-md mb-4 ${
          updateStatus.includes('✅')
            ? 'bg-green-50 border border-green-200'
            : updateStatus.includes('❌')
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className="text-sm">{updateStatus}</p>
        </div>
      )}

      {/* Last Update Stats */}
      {lastUpdate && (
        <div className="card-minimal bg-gray-50 dark:bg-gray-800 mb-4">
          <h4 className="font-medium mb-2">Last Update Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Processed:</span>
              <span className="ml-2 font-semibold">{lastUpdate.models_processed}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Added:</span>
              <span className="ml-2 font-semibold text-green-600">{lastUpdate.models_added}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Updated:</span>
              <span className="ml-2 font-semibold text-blue-600">{lastUpdate.models_updated}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Providers:</span>
              <span className="ml-2 font-semibold">{lastUpdate.providers_updated?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Update Button */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleManualUpdate}
          disabled={updating}
          className="flex-1 btn-minimal btn-primary"
        >
          <RefreshCw size={16} className={updating ? 'animate-spin' : ''} />
          {updating ? 'Updating...' : 'Update Now'}
        </button>

        <button
          onClick={toggleAutoUpdate}
          className={`btn-minimal ${
            autoUpdateEnabled 
              ? 'btn-primary' 
              : 'btn-secondary'
          }`}
        >
          {autoUpdateEnabled ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>

      {/* Schedule Settings */}
      {showScheduler && (
        <div className="card-minimal bg-gray-50 dark:bg-gray-800">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Calendar size={14} />
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
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Every hour</option>
                <option value={6}>Every 6 hours</option>
                <option value={12}>Every 12 hours</option>
                <option value={24}>Daily</option>
                <option value={168}>Weekly</option>
              </select>
            </div>

            <button
              onClick={handleScheduleUpdate}
              className="w-full btn-minimal btn-primary"
            >
              <Calendar size={16} />
              Save Schedule
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-caption mt-4 flex items-center gap-2">
        <Globe size={12} />
        <span>Data synchronized with artificialanalysis.ai leaderboard</span>
      </div>
    </div>
  );
};

export default LLMUpdateManager;