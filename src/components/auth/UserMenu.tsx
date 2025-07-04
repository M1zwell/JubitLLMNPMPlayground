import React, { useState } from 'react';
import { 
  User, Settings, LogOut, Crown, Shield, BarChart3, 
  Heart, Bookmark, Users, ChevronDown, Bell,
  Palette, Database, Key, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserMenuProps {
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onOpenProfile, onOpenSettings }) => {
  const { user, profile, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const getSubscriptionBadge = () => {
    if (profile?.subscription_tier === 'pro') {
      return <Crown className="text-yellow-400" size={16} />;
    }
    if (profile?.subscription_tier === 'enterprise') {
      return <Shield className="text-purple-400" size={16} />;
    }
    return null;
  };

  const getAvatarDisplay = () => {
    if (profile?.avatar_url) {
      return (
        <img 
          src={profile.avatar_url} 
          alt={profile.display_name || profile.username || 'User'}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    
    const displayName = profile?.display_name || profile?.username || user?.email || 'User';
    const initials = displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
        {initials}
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors group"
      >
        {getAvatarDisplay()}
        
        <div className="hidden md:flex flex-col items-start">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-white">
              {profile?.display_name || profile?.username || 'User'}
            </span>
            {getSubscriptionBadge()}
          </div>
          <span className="text-xs text-slate-400">
            {profile?.subscription_tier || 'Free'}
          </span>
        </div>
        
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-slate-600">
              <div className="flex items-center gap-3">
                {getAvatarDisplay()}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">
                      {profile?.display_name || profile?.username || 'User'}
                    </h3>
                    {getSubscriptionBadge()}
                  </div>
                  <p className="text-sm text-slate-400">{user.email}</p>
                  {profile?.is_verified && (
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="text-green-400" size={12} />
                      <span className="text-xs text-green-400">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-3 bg-slate-700/50 border-b border-slate-600">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-purple-400">{profile?.total_workflows || 0}</div>
                  <div className="text-xs text-slate-400">Workflows</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-400">{profile?.total_executions || 0}</div>
                  <div className="text-xs text-slate-400">Executions</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  onOpenProfile?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <User size={16} />
                View Profile
              </button>

              <button
                onClick={() => {
                  onOpenSettings?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Settings size={16} />
                Account Settings
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <BarChart3 size={16} />
                Analytics
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <Bookmark size={16} />
                Saved Items
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <Users size={16} />
                Following
              </button>

              <hr className="border-slate-600 my-2" />

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <Palette size={16} />
                Appearance
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <Bell size={16} />
                Notifications
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <Key size={16} />
                API Keys
              </button>

              <hr className="border-slate-600 my-2" />

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                <HelpCircle size={16} />
                Help & Support
              </button>

              {profile?.subscription_tier === 'free' && (
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-600/20 hover:text-yellow-200 transition-colors">
                  <Crown size={16} />
                  Upgrade to Pro
                </button>
              )}

              <hr className="border-slate-600 my-2" />

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;