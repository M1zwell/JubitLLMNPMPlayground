import React, { useState } from 'react';
import { X, Mail, Lock, User, Github, Chrome, Gamepad2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn, signUp, signInWithProvider } = useAuth();

  // Reset form when modal opens/closes or mode changes
  React.useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
      setFullName('');
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [isOpen, mode]);

  const validateForm = () => {
    if (!email || !password) {
      setError('Email and password are required');
      return false;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      
      if (!username) {
        setError('Username is required');
        return false;
      }

      if (username.length < 3) {
        setError('Username must be at least 3 characters');
        return false;
      }

      // Basic username validation
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setError('Username can only contain letters, numbers, hyphens, and underscores');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Successfully signed in!');
          setTimeout(() => onClose(), 1000);
        }
      } else {
        const { error } = await signUp(email, password, {
          username,
          full_name: fullName,
          display_name: fullName || username
        });
        
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Account created! Please check your email to verify your account.');
          setTimeout(() => {
            setMode('signin');
            setSuccess('');
          }, 3000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'github' | 'google' | 'discord') => {
    setLoading(true);
    setError('');

    const { error } = await signInWithProvider(provider);
    
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Note: OAuth will redirect, so we don't need to handle success here
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github': return <Github size={20} />;
      case 'google': return <Chrome size={20} />;
      case 'discord': return <Gamepad2 size={20} />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-elevated w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="icon-lg" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              {mode === 'signin' ? 'Welcome Back!' : 'Join LLM Playground'}
            </h2>
            <p className="text-white/80 text-sm">
              {mode === 'signin' 
                ? 'Sign in to access your workflows and preferences' 
                : 'Create an account to save workflows and track progress'
              }
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* OAuth Providers */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-secondary mb-3">Quick Sign In</h3>
            
            {['github', 'google', 'discord'].map((provider) => (
              <button
                key={provider}
                onClick={() => handleOAuthSignIn(provider as any)}
                disabled={loading}
                className="btn btn-secondary w-full justify-center"
                disabled={loading}
              >
                {getProviderIcon(provider)}
                <span className="capitalize">Continue with {provider}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="divider relative">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-tertiary px-4 text-xs text-muted">
              Or continue with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted icon" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input pl-10"
                      placeholder="your-username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted icon" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input pl-10"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-secondary"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <p className="text-warning text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-success text-sm">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin icon" />
                  {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Mode Toggle */}
          <div className="mt-4 text-center">
            <p className="text-tertiary text-sm">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-primary hover:text-primary-light font-medium"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Terms */}
          {mode === 'signup' && (
            <div className="mt-3 text-center">
              <p className="text-xs text-muted">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-primary hover:text-primary-light">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-primary hover:text-primary-light">Privacy Policy</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;