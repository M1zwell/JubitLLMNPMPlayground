import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  company: string | null;
  job_title: string | null;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  preferred_language: string;
  timezone: string;
  email_notifications: boolean;
  marketing_emails: boolean;
  is_public: boolean;
  is_verified: boolean;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_expires_at: string | null;
  github_username: string | null;
  linkedin_url: string | null;
  twitter_username: string | null;
  total_workflows: number;
  total_executions: number;
  reputation_score: number;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  compact_mode: boolean;
  show_animations: boolean;
  auto_save: boolean;
  auto_save_interval: number;
  default_llm_provider: string | null;
  default_llm_model: string | null;
  preferred_npm_categories: string[];
  execution_timeout: number;
  max_concurrent_executions: number;
  show_cost_estimates: boolean;
  show_performance_metrics: boolean;
  enable_ai_suggestions: boolean;
  keyboard_shortcuts: Record<string, any>;
  dashboard_layout: Record<string, any>;
  notification_settings: Record<string, any>;
  privacy_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithProvider: (provider: 'github' | 'google' | 'discord') => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    preferences: null,
    loading: true,
    initialized: false
  });

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (mounted) {
          if (session?.user) {
            await loadUserData(session.user);
          }
          
          setState(prev => ({
            ...prev,
            user: session?.user || null,
            session: session || null,
            loading: false,
            initialized: true
          }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            initialized: true
          }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (mounted) {
          if (event === 'SIGNED_IN' && session?.user) {
            await loadUserData(session.user);
            setState(prev => ({
              ...prev,
              user: session.user,
              session: session,
              loading: false
            }));
          } else if (event === 'SIGNED_OUT') {
            setState(prev => ({
              ...prev,
              user: null,
              session: null,
              profile: null,
              preferences: null,
              loading: false
            }));
          } else if (event === 'TOKEN_REFRESHED' && session) {
            setState(prev => ({
              ...prev,
              session: session,
              loading: false
            }));
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile and preferences
  const loadUserData = async (user: User) => {
    try {
      // Load profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      // Load preferences
      const { data: preferences, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefsError && prefsError.code !== 'PGRST116') {
        console.error('Error loading preferences:', prefsError);
      }

      setState(prev => ({
        ...prev,
        profile: profile || null,
        preferences: preferences || null
      }));

      // Log user activity
      await logUserActivity('session_start', {
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Log user activity
  const logUserActivity = async (activityType: string, activityData: Record<string, any> = {}) => {
    if (!state.user) return;

    try {
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: state.user.id,
          activity_type: activityType,
          activity_data: activityData,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false }));
    }

    return { error };
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata: Record<string, any> = {}) => {
    setState(prev => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          app_source: 'llm-playground'
        }
      }
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false }));
    }

    return { error };
  };

  // Sign out
  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    // Log activity before signing out
    if (state.user) {
      await logUserActivity('session_end');
    }

    const { error } = await supabase.auth.signOut();
    
    return { error };
  };

  // Sign in with OAuth provider
  const signInWithProvider = async (provider: 'github' | 'google' | 'discord') => {
    setState(prev => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false }));
    }

    return { error };
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.user) {
      return { error: new Error('No authenticated user') };
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', state.user.id);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : null
      }));

      // Log activity
      await logUserActivity('profile_updated', { updated_fields: Object.keys(updates) });

      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error as Error };
    }
  };

  // Update user preferences
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!state.user) {
      return { error: new Error('No authenticated user') };
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', state.user.id);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        preferences: prev.preferences ? { ...prev.preferences, ...updates } : null
      }));

      // Log activity
      await logUserActivity('preferences_updated', { updated_fields: Object.keys(updates) });

      return { error: null };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { error: error as Error };
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (!state.user) return;
    await loadUserData(state.user);
  };

  // Reset password
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    return { error };
  };

  // Update password
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    updateProfile,
    updatePreferences,
    refreshProfile,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};