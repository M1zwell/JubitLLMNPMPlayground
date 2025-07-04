import React, { useState } from 'react';
import { 
  User, Mail, MapPin, Globe, Building, Briefcase, Calendar,
  Github, Linkedin, Twitter, Edit3, Save, X, Camera,
  Shield, Crown, BarChart3, Workflow, Activity, Award,
  Settings, Bell, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form state
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || '',
    company: profile?.company || '',
    job_title: profile?.job_title || '',
    github_username: profile?.github_username || '',
    linkedin_url: profile?.linkedin_url || '',
    twitter_username: profile?.twitter_username || '',
    experience_level: profile?.experience_level || 'beginner'
  });

  // Update form data when profile changes
  React.useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        company: profile.company || '',
        job_title: profile.job_title || '',
        github_username: profile.github_username || '',
        linkedin_url: profile.linkedin_url || '',
        twitter_username: profile.twitter_username || '',
        experience_level: profile.experience_level || 'beginner'
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(formData);
    
    if (!error) {
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setFormData({
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      website: profile?.website || '',
      company: profile?.company || '',
      job_title: profile?.job_title || '',
      github_username: profile?.github_username || '',
      linkedin_url: profile?.linkedin_url || '',
      twitter_username: profile?.twitter_username || '',
      experience_level: profile?.experience_level || 'beginner'
    });
    setIsEditing(false);
  };

  const getAvatarDisplay = () => {
    if (profile?.avatar_url) {
      return (
        <img 
          src={profile.avatar_url} 
          alt={profile.display_name || profile.username || 'User'}
          className="w-24 h-24 rounded-full object-cover"
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
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
        {initials}
      </div>
    );
  };

  const getSubscriptionBadge = () => {
    switch (profile?.subscription_tier) {
      case 'pro':
        return (
          <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-sm">
            <Crown size={14} />
            Pro
          </div>
        );
      case 'enterprise':
        return (
          <div className="flex items-center gap-1 bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-sm">
            <Shield size={14} />
            Enterprise
          </div>
        );
      default:
        return (
          <div className="bg-slate-600/50 text-slate-400 px-2 py-1 rounded-full text-sm">
            Free
          </div>
        );
    }
  };

  if (!isOpen || !user || !profile) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-600">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-start gap-6">
            <div className="relative">
              {getAvatarDisplay()}
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-600 transition-colors">
                <Camera size={16} />
              </button>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {profile.display_name || profile.username}
                </h1>
                {getSubscriptionBadge()}
                {profile.is_verified && (
                  <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm">
                    <Shield size={14} />
                    Verified
                  </div>
                )}
              </div>
              
              <p className="text-white/80 text-sm mb-1">@{profile.username}</p>
              <p className="text-white/60 text-sm">{user.email}</p>
              
              {profile.bio && (
                <p className="text-white/80 mt-3 text-sm">{profile.bio}</p>
              )}
              
              <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {profile.location}
                  </div>
                )}
                {profile.company && (
                  <div className="flex items-center gap-1">
                    <Building size={14} />
                    {profile.company}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-600">
          <div className="flex">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'stats', label: 'Statistics', icon: BarChart3 },
              { id: 'workflows', label: 'Workflows', icon: Workflow },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <Workflow className="mx-auto mb-2 text-purple-400" size={24} />
                  <div className="text-2xl font-bold text-white">{profile.total_workflows}</div>
                  <div className="text-sm text-slate-400">Workflows Created</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <Activity className="mx-auto mb-2 text-blue-400" size={24} />
                  <div className="text-2xl font-bold text-white">{profile.total_executions}</div>
                  <div className="text-sm text-slate-400">Total Executions</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <Award className="mx-auto mb-2 text-yellow-400" size={24} />
                  <div className="text-2xl font-bold text-white">{profile.reputation_score}</div>
                  <div className="text-sm text-slate-400">Reputation Score</div>
                </div>
              </div>

              {/* Profile Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Profile Information</h3>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
                        <input
                          type="text"
                          value={formData.display_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                          rows={3}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                          placeholder="City, Country"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Website</label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profile.bio && (
                        <div>
                          <div className="text-sm font-medium text-slate-400">Bio</div>
                          <div className="text-slate-300">{profile.bio}</div>
                        </div>
                      )}
                      
                      {profile.location && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <MapPin size={16} className="text-slate-400" />
                          {profile.location}
                        </div>
                      )}
                      
                      {profile.website && (
                        <div className="flex items-center gap-2">
                          <Globe size={16} className="text-slate-400" />
                          <a 
                            href={profile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            {profile.website}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Professional</h3>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={formData.job_title}
                          onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Experience Level</label>
                        <select
                          value={formData.experience_level}
                          onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value as any }))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profile.company && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Building size={16} className="text-slate-400" />
                          {profile.company}
                        </div>
                      )}
                      
                      {profile.job_title && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Briefcase size={16} className="text-slate-400" />
                          {profile.job_title}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        <span className="text-slate-300 capitalize">{profile.experience_level} Level</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Social Links</h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">GitHub Username</label>
                      <input
                        type="text"
                        value={formData.github_username}
                        onChange={(e) => setFormData(prev => ({ ...prev, github_username: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        placeholder="username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">LinkedIn URL</label>
                      <input
                        type="url"
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Twitter Username</label>
                      <input
                        type="text"
                        value={formData.twitter_username}
                        onChange={(e) => setFormData(prev => ({ ...prev, twitter_username: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        placeholder="username"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    {profile.github_username && (
                      <a
                        href={`https://github.com/${profile.github_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                      >
                        <Github size={16} />
                        GitHub
                      </a>
                    )}
                    
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                      >
                        <Linkedin size={16} />
                        LinkedIn
                      </a>
                    )}
                    
                    {profile.twitter_username && (
                      <a
                        href={`https://twitter.com/${profile.twitter_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                      >
                        <Twitter size={16} />
                        Twitter
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other tabs content would go here */}
          {activeTab !== 'overview' && (
            <div className="text-center py-12 text-slate-400">
              <p>This section is coming soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;