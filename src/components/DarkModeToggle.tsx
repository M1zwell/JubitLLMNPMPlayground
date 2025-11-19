import { Sun, Moon, Monitor } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

export default function DarkModeToggle() {
  const { preference, setPreference, darkMode } = useDarkMode();

  const handleToggle = () => {
    if (preference === 'auto') {
      setPreference('light');
    } else if (preference === 'light') {
      setPreference('dark');
    } else {
      setPreference('auto');
    }
  };

  const getIcon = () => {
    if (preference === 'light') return <Sun size={16} />;
    if (preference === 'dark') return <Moon size={16} />;
    return <Monitor size={16} />;
  };

  const getLabel = () => {
    if (preference === 'light') return 'Light';
    if (preference === 'dark') return 'Dark';
    return 'Auto';
  };

  return (
    <button
      onClick={handleToggle}
      className="btn-minimal btn-ghost flex items-center gap-2"
      title={`Theme: ${getLabel()} ${preference === 'auto' ? `(${darkMode ? 'Dark' : 'Light'})` : ''}`}
    >
      {getIcon()}
      <span className="hidden sm:inline text-xs">{getLabel()}</span>
    </button>
  );
}
