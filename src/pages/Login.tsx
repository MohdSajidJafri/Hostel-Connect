import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { FaGoogle } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      // Get the current URL for the redirect
      const redirectUrl = `${window.location.origin}/`;
      console.log('Redirect URL:', redirectUrl);
      
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

      if (error) {
        console.error('Supabase OAuth error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Error signing in with Google. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/4 -right-24 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">Hostel Connect</h2>
          <p className="mt-3 text-slate-500 text-lg">
            Connect with your hostel community
          </p>
        </div>
        <div className="mt-10 space-y-6">
          <div>
            <button
              onClick={handleGoogleSignIn}
              className="group relative w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-slate-200 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow"
            >
              <FaGoogle className="h-5 w-5 text-red-500" />
              Continue with Google
            </button>
          </div>
          <div className="text-sm text-center pt-4 border-t border-slate-100">
            <p className="text-slate-500">
              By signing in, you agree to our <a href="#" className="font-medium text-primary-600 hover:text-primary-500">Terms of Service</a> and <a href="#" className="font-medium text-primary-600 hover:text-primary-500">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
