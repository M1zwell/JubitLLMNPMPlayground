import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerified?: boolean;
  requiredSubscription?: 'free' | 'pro' | 'enterprise';
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  requireVerified = false,
  requiredSubscription,
  fallback
}) => {
  const { user, profile, loading, initialized } = useAuth();
  const location = useLocation();

  // Show loading while initializing
  if (!initialized || loading) {
    return fallback || (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-purple-400" size={48} />
          <p className="text-slate-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return <Navigate to="/auth/signin" state={{ from: location.pathname }} replace />;
  }

  // Check verification requirement
  if (requireVerified && user && (!user.email_confirmed_at || !profile?.is_verified)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full text-center border border-slate-600">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="text-yellow-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Verification Required</h2>
          <p className="text-slate-300 mb-6">
            Please verify your email address to access this feature. Check your inbox for a verification link.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            I've Verified My Email
          </button>
        </div>
      </div>
    );
  }

  // Check subscription requirement
  if (requiredSubscription && profile) {
    const subscriptionLevels = { free: 0, pro: 1, enterprise: 2 };
    const userLevel = subscriptionLevels[profile.subscription_tier] || 0;
    const requiredLevel = subscriptionLevels[requiredSubscription] || 0;

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full text-center border border-slate-600">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="text-yellow-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Upgrade Required</h2>
            <p className="text-slate-300 mb-6">
              This feature requires a {requiredSubscription} subscription. Upgrade your account to continue.
            </p>
            <div className="space-y-3">
              <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors">
                Upgrade to {requiredSubscription.charAt(0).toUpperCase() + requiredSubscription.slice(1)}
              </button>
              <button 
                onClick={() => window.history.back()}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;