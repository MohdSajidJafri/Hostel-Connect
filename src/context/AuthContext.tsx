import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isDemo: boolean;
  demoLogin: () => void;
  updateDemoProfile: (updates: Partial<Profile>) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const DEMO_STORAGE_KEY = 'hostel_connect_demo_profile';
const PROFILE_CACHE_KEY = 'hostel_connect_cached_profile';

const DEFAULT_DEMO_PROFILE: Profile = {
  id: 'demo-profile-1',
  user_id: 'demo-user-1',
  full_name: 'Demo Resident',
  avatar_url: null,
  year_of_study: 3,
  expertise: 'React · TypeScript · DSA',
  domain: 'B.Tech CSE',
  room_number: 'B-041',
  contact_info: '+91 98765 43210',
  created_at: new Date().toISOString(),
  updated_at: null,
};

const createDemoUser = (): User =>
  ({
    id: 'demo-user-1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'demo.resident@hostelconnect.edu',
    app_metadata: { provider: 'demo' },
    user_metadata: { full_name: 'Demo Resident' },
    created_at: new Date().toISOString(),
  } as User);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
    if (savedDemo) {
      try {
        const parsedProfile = JSON.parse(savedDemo) as Profile;
        const demoUser = createDemoUser();
        setIsDemo(true);
        setUser(demoUser);
        setProfile(parsedProfile);
        setSession({ access_token: 'demo-token', token_type: 'bearer', user: demoUser } as Session);
        setIsLoading(false);
        return;
      } catch {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }

    // Single source of truth: onAuthStateChange fires INITIAL_SESSION on mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          // Hydrate cached profile immediately so UI renders without waiting on DB round-trip
          try {
            const cached = localStorage.getItem(PROFILE_CACHE_KEY);
            if (cached) {
              const parsed = JSON.parse(cached) as Profile;
              if (parsed.user_id === nextSession.user.id) {
                setProfile(parsed);
              }
            }
          } catch {
            // Ignore cache parse errors
          }
          setIsLoading(false);
          void fetchProfile(nextSession.user.id);
        } else {
          localStorage.removeItem(PROFILE_CACHE_KEY);
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const demoLogin = () => {
    const demoUser = createDemoUser();
    let demoProfile = DEFAULT_DEMO_PROFILE;
    const existing = localStorage.getItem(DEMO_STORAGE_KEY);
    if (existing) {
      try {
        demoProfile = JSON.parse(existing) as Profile;
      } catch {
        demoProfile = DEFAULT_DEMO_PROFILE;
      }
    }
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
    setIsDemo(true);
    setUser(demoUser);
    setProfile(demoProfile);
    setSession({ access_token: 'demo-token', token_type: 'bearer', user: demoUser } as Session);
    setIsLoading(false);
  };

  const updateDemoProfile = (updates: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...(prev || DEFAULT_DEMO_PROFILE), ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      setProfile(data);
      try {
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
      } catch {
        // Ignore storage quota errors
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (isDemo) {
      const saved = localStorage.getItem(DEMO_STORAGE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved) as Profile);
      }
      return;
    }
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      if (isDemo) {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        setIsDemo(false);
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }
      await supabase.auth.signOut();
      localStorage.removeItem(PROFILE_CACHE_KEY);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isDemo,
        demoLogin,
        updateDemoProfile,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
