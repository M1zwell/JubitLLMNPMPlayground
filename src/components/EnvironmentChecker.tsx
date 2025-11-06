import { useState } from 'react';
import { ENV, validateEnvironment } from '../lib/env';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Environment Checker Component
 * Displays current environment configuration and validates setup
 * Only visible in development mode or when debug is enabled
 */
export function EnvironmentChecker() {
  const [isExpanded, setIsExpanded] = useState(false);
  const validation = validateEnvironment();

  // Only show in development or debug mode
  if (!ENV.isDevelopment && !ENV.features.debugMode) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 overflow-hidden max-w-md">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center space-x-2">
            {validation.valid ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            <span className="font-semibold">
              {ENV.isDevelopment ? '🔧 Development' : '🚀 Production'}
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 py-3 space-y-3 border-t border-gray-700 max-h-96 overflow-y-auto">
            {/* Environment Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Environment</h3>
              <div className="space-y-1 text-sm">
                <InfoRow label="Mode" value={ENV.mode} />
                <InfoRow label="Base URL" value={ENV.app.baseUrl} />
                <InfoRow label="API URL" value={ENV.api.baseUrl} />
              </div>
            </div>

            {/* Supabase Configuration */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Supabase</h3>
              <div className="space-y-1 text-sm">
                <StatusRow
                  label="URL"
                  status={!!ENV.supabase.url}
                  value={ENV.supabase.url ? `${ENV.supabase.url.substring(0, 30)}...` : 'Not configured'}
                />
                <StatusRow
                  label="Anon Key"
                  status={!!ENV.supabase.anonKey}
                  value={ENV.supabase.anonKey ? `${ENV.supabase.anonKey.substring(0, 20)}...` : 'Not configured'}
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Features</h3>
              <div className="space-y-1 text-sm">
                <StatusRow
                  label="Multi-Model Chat"
                  status={ENV.features.multiModelChat}
                  value={ENV.features.multiModelChat ? 'Enabled' : 'Disabled'}
                />
                <StatusRow
                  label="Analytics"
                  status={ENV.features.analytics}
                  value={ENV.features.analytics ? 'Enabled' : 'Disabled'}
                />
                <StatusRow
                  label="Debug Mode"
                  status={ENV.features.debugMode}
                  value={ENV.features.debugMode ? 'Enabled' : 'Disabled'}
                />
              </div>
            </div>

            {/* Validation Status */}
            {!validation.valid && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-500 mb-1">
                      Missing Configuration
                    </p>
                    <ul className="text-xs text-yellow-400 space-y-0.5">
                      {validation.missing.map((key) => (
                        <li key={key}>• {key}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 border-t border-gray-700">
              <button
                onClick={() => {
                  console.clear();
                  console.log('Environment Configuration:', ENV);
                  console.log('Validation:', validation);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                📋 Log to Console
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}:</span>
      <span className="text-white font-mono text-xs truncate ml-2 max-w-[200px]">
        {value}
      </span>
    </div>
  );
}

function StatusRow({
  label,
  status,
  value,
}: {
  label: string;
  status: boolean;
  value: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        {status ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className="text-gray-400">{label}:</span>
      </div>
      <span className="text-white font-mono text-xs truncate ml-2 max-w-[200px]">
        {value}
      </span>
    </div>
  );
}

export default EnvironmentChecker;

