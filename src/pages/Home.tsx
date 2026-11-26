import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, Profile } from '../lib/supabase';
import { DEMO_PROFILES } from '../lib/demoData';
import { getCached, setCached } from '../lib/cache';
import { Search, MessageSquare, User, ArrowRight } from 'lucide-react';

const RECENT_CACHE_KEY = 'recent_profiles';

const Home: React.FC = () => {
  const { profile, user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [recentProfiles, setRecentProfiles] = useState<Profile[]>(
    () => getCached<Profile[]>(RECENT_CACHE_KEY, 60_000) || []
  );
  const [loading, setLoading] = useState(() => !getCached<Profile[]>(RECENT_CACHE_KEY, 60_000));

  useEffect(() => {
    if (isDemo) {
      setRecentProfiles(DEMO_PROFILES.filter((p) => p.user_id !== user?.id).slice(0, 5));
      setLoading(false);
      return;
    }
    fetchRecentProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, user?.id]);

  const fetchRecentProfiles = async () => {
    try {
      if (recentProfiles.length === 0) {
        setLoading(true);
      }
      let query = supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, domain, year_of_study, room_number, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (user?.id) {
        query = query.neq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      const list = (data as Profile[]) || [];
      setRecentProfiles(list);
      setCached(RECENT_CACHE_KEY, list);
    } catch (error) {
      console.error('Error fetching recent profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Resident';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Editorial Header & Greeting */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
          {getGreeting()}, {firstName}! <span>☀️</span>
        </h1>
        <p className="text-sm text-neutral-500 font-normal">
          What would you like to do today?
        </p>
      </div>

      {/* Incomplete profile notice (discreet & restrained) */}
      {(!profile?.full_name || !profile?.domain || !profile?.room_number) && (
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-neutral-900 tracking-tight">
              Complete your resident profile
            </h3>
            <p className="text-xs text-neutral-500">
              Add your room number, course, and areas of expertise so other residents can discover you.
            </p>
          </div>
          <Link
            to="/profile/edit"
            className="btn btn-primary text-xs py-1.5 px-3 self-start sm:self-auto whitespace-nowrap"
          >
            Complete profile
          </Link>
        </div>
      )}

      {/* Differentiated Editorial Action Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {/* Block 1: Find Residents (Lead Action) */}
        <Link
          to="/search"
          className="group relative p-6 bg-white border border-neutral-200 rounded-xl shadow-subtle hover:border-neutral-950/40 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-5 group-hover:bg-neutral-950 group-hover:text-white transition-colors">
              <Search size={18} strokeWidth={2} />
            </div>
            <h2 className="text-base font-semibold text-neutral-950 tracking-tight mb-1.5">
              Find Residents
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Discover people across the hostel by course, expertise, or room number.
            </p>
          </div>
          <div className="pt-6 mt-4 border-t border-neutral-100 flex items-center text-xs font-medium text-neutral-900 group-hover:translate-x-0.5 transition-transform">
            <span>Search Now</span>
            <ArrowRight size={14} className="ml-1.5 text-neutral-400 group-hover:text-neutral-950" />
          </div>
        </Link>

        {/* Block 2: Messages */}
        <Link
          to="/messages"
          className="group relative p-6 bg-white border border-neutral-200 rounded-xl shadow-subtle hover:border-neutral-950/40 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-5 group-hover:bg-neutral-950 group-hover:text-white transition-colors">
              <MessageSquare size={18} strokeWidth={2} />
            </div>
            <h2 className="text-base font-semibold text-neutral-950 tracking-tight mb-1.5">
              Messages
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Connect and chat directly with roommates and peers in your residence.
            </p>
          </div>
          <div className="pt-6 mt-4 border-t border-neutral-100 flex items-center text-xs font-medium text-neutral-900 group-hover:translate-x-0.5 transition-transform">
            <span>Open Messages</span>
            <ArrowRight size={14} className="ml-1.5 text-neutral-400 group-hover:text-neutral-950" />
          </div>
        </Link>

        {/* Block 3: Your Profile */}
        <Link
          to="/profile"
          className="group relative p-6 bg-white border border-neutral-200 rounded-xl shadow-subtle hover:border-neutral-950/40 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-5 group-hover:bg-neutral-950 group-hover:text-white transition-colors">
              <User size={18} strokeWidth={2} />
            </div>
            <h2 className="text-base font-semibold text-neutral-950 tracking-tight mb-1.5">
              Your Profile
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Manage your personal information, room number, and showcase your skills.
            </p>
          </div>
          <div className="pt-6 mt-4 border-t border-neutral-100 flex items-center text-xs font-medium text-neutral-900 group-hover:translate-x-0.5 transition-transform">
            <span>View Profile</span>
            <ArrowRight size={14} className="ml-1.5 text-neutral-400 group-hover:text-neutral-950" />
          </div>
        </Link>
      </div>

      {/* Recently Joined Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
            Recently Joined
          </h2>
          <Link
            to="/search"
            className="text-xs font-medium text-neutral-500 hover:text-neutral-950 flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 border border-neutral-200 rounded-xl bg-neutral-50/50 animate-pulse flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-200" />
                <div className="w-16 h-3 bg-neutral-200 rounded" />
                <div className="w-20 h-2 bg-neutral-200 rounded" />
              </div>
            ))}
          </div>
        ) : recentProfiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {recentProfiles.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/messages/${p.user_id}`)}
                className="group p-4 bg-white border border-neutral-200 rounded-xl hover:border-neutral-950/40 transition-all cursor-pointer flex flex-col items-center text-center shadow-subtle"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-800 mb-2.5 group-hover:scale-105 transition-transform">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.full_name || 'Resident'}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {p.full_name ? p.full_name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-semibold text-neutral-950 truncate max-w-full">
                  {p.full_name || 'Resident'}
                </h3>
                <p className="text-[11px] text-neutral-500 truncate max-w-full mt-0.5">
                  {p.domain || 'Student'} {p.year_of_study ? `· Y${p.year_of_study}` : ''}
                </p>
                {p.room_number && (
                  <span className="mt-2 text-[10px] font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                    {p.room_number}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl border border-neutral-200 bg-neutral-50/50">
            <p className="text-xs text-neutral-500">No resident profiles found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

