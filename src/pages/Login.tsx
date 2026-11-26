import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, demoLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      setAuthInfo(null);
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      console.error('Error signing in with Google:', error);
      const message = error instanceof Error ? error.message : 'Error signing in with Google. Please try again.';
      setAuthError(message);
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
      setAuthInfo(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/');
    } catch (error: unknown) {
      console.error('Error signing in:', error);
      const message = error instanceof Error ? error.message : 'Invalid email or password.';
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setAuthError(null);
    setAuthInfo(null);
    if (!email.trim()) {
      setAuthInfo('Enter your email address above first, then click Forgot password to receive a reset link.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setAuthInfo('Password reset link sent. Please check your inbox.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to send reset email. Contact your administrator.';
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-neutral-900">
      {/* Left Column: Editorial Statement */}
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b md:border-b-0 md:border-r border-neutral-200 bg-neutral-50/70 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none" />
        {/* Brand Header */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-7 h-7 bg-neutral-950 text-white rounded-md flex items-center justify-center font-bold text-xs">
            H
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-950">Hostel Connect</span>
        </div>

        {/* Hero Editorial Typography & Monochrome Feature Bento */}
        <div className="relative my-10 md:my-auto max-w-lg space-y-8">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-950 leading-[1.08] mb-5">
              Connect.<br />
              Collaborate.<br />
              Belong.
            </h1>
            <p className="text-neutral-600 text-base sm:text-lg leading-relaxed font-normal">
              Your residence directory, community board, and real-time network—built for seniors and juniors.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-white/90 border border-neutral-200 rounded-lg">
              <div className="text-xs font-semibold text-neutral-950">Resident Directory</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Filter by skill, course, block & year</div>
            </div>
            <div className="p-3 bg-white/90 border border-neutral-200 rounded-lg">
              <div className="text-xs font-semibold text-neutral-950">Real-Time Chat</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Live presence, read receipts & media</div>
            </div>
            <div className="p-3 bg-white/90 border border-neutral-200 rounded-lg">
              <div className="text-xs font-semibold text-neutral-950">Community Board</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Ask seniors, teams, borrow & buy/sell</div>
            </div>
            <div className="p-3 bg-white/90 border border-neutral-200 rounded-lg">
              <div className="text-xs font-semibold text-neutral-950">Built-In Safety</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Block, report & RLS protection</div>
            </div>
          </div>
        </div>

        {/* Minimal Floorplan / Subtle Room Aesthetic Indicator */}
        <div className="relative pt-6 border-t border-neutral-200/80 flex items-center justify-between text-xs text-neutral-500">
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
              <div role="alert" className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs leading-relaxed">
                {authError}
              </div>
            )}
            {authInfo && (
              <div role="status" className="mb-4 p-3 rounded-md bg-neutral-50 border border-neutral-300 text-neutral-800 text-xs leading-relaxed">
                {authInfo}
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

            <button
              type="button"
              onClick={() => {
                demoLogin();
                navigate('/', { replace: true });
              }}
              disabled={loading}
              data-testid="demo-login-btn"
              className="w-full btn btn-primary py-2.5 mt-2.5 flex items-center justify-center gap-2 text-xs font-medium"
            >
              Demo Login (Explore App)
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

              <div className="flex items-center justify-end text-xs pt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
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

