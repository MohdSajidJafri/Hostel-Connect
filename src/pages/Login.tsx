import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setAuthError(error.message || 'Error signing in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setAuthError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      console.error('Error signing in:', error);
      setAuthError(error.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-neutral-900">
      {/* Left Column: Editorial Statement */}
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b md:border-b-0 md:border-r border-neutral-200 bg-neutral-50/50">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-neutral-950 text-white rounded-md flex items-center justify-center font-bold text-xs">
            H
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-950">Hostel Connect</span>
        </div>

        {/* Hero Editorial Typography */}
        <div className="my-12 md:my-auto max-w-lg">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-950 leading-[1.08] mb-6">
            Connect.<br />
            Collaborate.<br />
            Belong.
          </h1>
          <p className="text-neutral-600 text-base sm:text-lg leading-relaxed font-normal">
            A platform for hostel residents to interact, share and grow together.
          </p>
        </div>

        {/* Minimal Floorplan / Subtle Room Aesthetic Indicator */}
        <div className="pt-6 border-t border-neutral-200/80 flex items-center justify-between text-xs text-neutral-500">
          <span>Community Directory & Messaging</span>
          <span>Residence Network</span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-sm">
          {/* Card Frame */}
          <div className="card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-950 tracking-tight flex items-center gap-2">
                Welcome back <span>👋</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-1">Sign in to continue</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-md bg-neutral-50 border border-neutral-300 text-neutral-800 text-xs leading-relaxed">
                {authError}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full btn btn-secondary py-2.5 flex items-center justify-center gap-3 text-sm font-medium hover:bg-neutral-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Subtle Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <span className="relative px-3 bg-white text-[11px] text-neutral-400 font-medium">
                or continue with email
              </span>
            </div>

            {/* Email / Password Fallback Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input text-xs pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-900"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset is managed via your university or administrator.')}
                  className="text-neutral-500 hover:text-neutral-950 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-2.5 text-xs font-medium mt-2"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500">
              New here?{' '}
              <button 
                onClick={handleGoogleSignIn}
                className="font-medium text-neutral-950 hover:underline"
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

