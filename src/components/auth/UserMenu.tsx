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
        className="flex items-center gap-2 card-minimal compact-xs hover:bg-secondary transition-colors"
      >
        {getAvatarDisplay()}
        
        <div className="hidden md:flex flex-col items-start">
          <div className="flex items-center gap-1 text-primary">
            <span className="text-sm font-medium">
              {profile?.display_name || profile?.username || 'User'}
            </span>
            {getSubscriptionBadge()}
          </div>
          <span className="text-xs text-tertiary">
            {profile?.subscription_tier || 'Free'}
          </span>
        </div>
        
        <ChevronDown 
          className={`icon-sm text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} 
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
          <div className="absolute right-0 top-full mt-2 w-64 card-elevated z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-primary/10 border-b border-light">
              <div className="flex items-center gap-3">
                {getAvatarDisplay()}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-primary">
                    <h3 className="font-medium">
                      {profile?.display_name || profile?.username || 'User'}
                    </h3>
                    {getSubscriptionBadge()}
                  </div>
                  <p className="text-sm text-tertiary">{user.email}</p>
                  {profile?.is_verified && (
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="text-success icon-sm" />
                      <span className="text-xs text-success">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-3 bg-secondary/30 border-b border-light">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-medium text-primary">{profile?.total_workflows || 0}</div>
                  <div className="text-xs text-muted">Workflows</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-primary">{profile?.total_executions || 0}</div>
                  <div className="text-xs text-muted">Executions</div>
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
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors"
              >
                <User className="icon-sm" />
                View Profile
              </button>

              <button
                onClick={() => {
                  onOpenSettings?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors"
              >
                <Settings className="icon-sm" />
                Account Settings
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors">
                <BarChart3 className="icon-sm" />
                Analytics
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors">
                <Bookmark className="icon-sm" />
                Saved Items
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors">
                <Users className="icon-sm" />
                Following
              </button>

              <hr className="divider my-2" />

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors">
                <Palette className="icon-sm" />
                Appearance
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors">
                <Bell className="icon-sm" />
                Notifications
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors">
                <Key className="icon-sm" />
                API Keys
              </button>

              <hr className="divider my-2" />

              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary hover:bg-secondary hover:text-primary transition-colors">
                <HelpCircle className="icon-sm" />
                Help & Support
              </button>

              {profile?.subscription_tier === 'free' && (
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-warning hover:bg-warning/10 hover:text-warning-light transition-colors">
                  <Crown className="icon-sm" />
                  Upgrade to Pro
                </button>
              )}

              <hr className="divider my-2" />

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-warning hover:bg-warning/10 hover:text-warning-light transition-colors disabled:opacity-50"
                disabled={loading}
              >
                <LogOut className="icon-sm" />
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