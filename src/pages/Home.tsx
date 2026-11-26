import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { supabase, Profile } from '../lib/supabase';
import {
  CommunityPost,
  DEMO_PROFILES,
  getDemoPosts,
  getDemoSavedContacts,
  getDemoUnreadCount,
} from '../lib/demoData';
import { getCached, setCached } from '../lib/cache';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  MessageSquare,
  Users,
  ArrowRight,
  Bookmark,
  Sparkles,
  Radio,
  Plus,
} from 'lucide-react';

const RECENT_CACHE_KEY = 'recent_profiles';
const QUICK_SKILLS = ['React', 'DSA', 'System Design', 'UI/UX', 'Python', 'Embedded C', 'CAD'];

const Home: React.FC = () => {
  const { profile, user, isDemo } = useAuth();
  const { onlineUsers, isOnline } = usePresence();
  const navigate = useNavigate();

  const [recentProfiles, setRecentProfiles] = useState<Profile[]>(
    () => getCached<Profile[]>(RECENT_CACHE_KEY, 60_000) || []
  );
  const [savedProfiles, setSavedProfiles] = useState<Profile[]>([]);
  const [recentPosts, setRecentPosts] = useState<CommunityPost[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(() => !getCached<Profile[]>(RECENT_CACHE_KEY, 60_000));

  useEffect(() => {
    if (isDemo && user) {
      setRecentProfiles(DEMO_PROFILES.filter((p) => p.user_id !== user.id).slice(0, 5));
      const savedIds = getDemoSavedContacts();
      setSavedProfiles(DEMO_PROFILES.filter((p) => savedIds.includes(p.user_id)));
      setRecentPosts(getDemoPosts().filter((p) => p.status === 'open').slice(0, 3));
      setUnreadCount(getDemoUnreadCount(user.id));
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      try {
        if (recentProfiles.length === 0) setLoading(true);
        let profQuery = supabase
          .from('profiles')
          .select('id, user_id, full_name, avatar_url, domain, year_of_study, room_number, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
        if (user?.id) profQuery = profQuery.neq('user_id', user.id);

        const [{ data: profData }, { data: postData }, unreadRes, savedRes] = await Promise.all([
          profQuery,
          supabase
            .from('community_posts')
            .select('*')
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(3),
          user
            ? supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('recipient_id', user.id)
                .eq('read', false)
            : Promise.resolve({ count: 0 }),
          user
            ? supabase
                .from('saved_contacts')
                .select('contact_user_id')
                .eq('user_id', user.id)
                .limit(5)
            : Promise.resolve({ data: [] }),
        ]);

        const list = (profData as Profile[]) || [];
        setRecentProfiles(list);
        setCached(RECENT_CACHE_KEY, list);
        setRecentPosts((postData as CommunityPost[]) || []);
        setUnreadCount(unreadRes.count ?? 0);

        const savedIds = (savedRes.data || []).map((r: { contact_user_id: string }) => r.contact_user_id);
        if (savedIds.length > 0) {
          const { data: sp } = await supabase
            .from('profiles')
            .select('id, user_id, full_name, avatar_url, domain, year_of_study, room_number, created_at')
            .in('user_id', savedIds);
          if (sp) setSavedProfiles(sp as Profile[]);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, user?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Resident';

  return (
    <div className="space-y-7">
      {/* Editorial Header + Live Hostel Pulse */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-neutral-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-600 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{onlineUsers.size} {onlineUsers.size === 1 ? 'resident' : 'residents'} online now</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-neutral-500 font-normal">
            Your residence directory, community board, and real-time inbox.
          </p>
        </div>

        {/* Compact Monochrome Stat Strip */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <Link
            to="/search"
            className="px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Online</div>
            <div className="text-base font-semibold text-neutral-950 mt-0.5 flex items-center gap-1.5">
              <Radio size={13} className="text-emerald-600" />
              <span>{onlineUsers.size}</span>
            </div>
          </Link>
          <Link
            to="/community"
            className="px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Board</div>
            <div className="text-base font-semibold text-neutral-950 mt-0.5">
              {recentPosts.length}+ open
            </div>
          </Link>
          <Link
            to="/messages"
            className="px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Unread</div>
            <div className="text-base font-semibold text-neutral-950 mt-0.5">
              {unreadCount}
            </div>
          </Link>
        </div>
      </div>

      {/* Incomplete profile notice */}
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

      {/* Primary Action Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/search"
          className="group p-5 bg-white border border-neutral-200 rounded-xl shadow-subtle hover:border-neutral-950/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4 group-hover:bg-neutral-950 group-hover:text-white transition-colors">
              <Search size={17} strokeWidth={2} />
            </div>
            <h2 className="text-sm font-semibold text-neutral-950 tracking-tight mb-1">
              Find Residents
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Filter peers and seniors by course, expertise, year, or hostel block.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center text-xs font-medium text-neutral-900">
            <span>Search Directory</span>
            <ArrowRight size={13} className="ml-1.5 text-neutral-400 group-hover:text-neutral-950 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          to="/community"
          className="group p-5 bg-white border border-neutral-200 rounded-xl shadow-subtle hover:border-neutral-950/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4 group-hover:bg-neutral-950 group-hover:text-white transition-colors">
              <Users size={17} strokeWidth={2} />
            </div>
            <h2 className="text-sm font-semibold text-neutral-950 tracking-tight mb-1">
              Community Board
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Ask seniors, form hackathon teams, borrow items, or browse notices.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center text-xs font-medium text-neutral-900">
            <span>Open Board</span>
            <ArrowRight size={13} className="ml-1.5 text-neutral-400 group-hover:text-neutral-950 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          to="/messages"
          className="group p-5 bg-white border border-neutral-200 rounded-xl shadow-subtle hover:border-neutral-950/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4 group-hover:bg-neutral-950 group-hover:text-white transition-colors">
              <MessageSquare size={17} strokeWidth={2} />
            </div>
            <h2 className="text-sm font-semibold text-neutral-950 tracking-tight mb-1">
              Messages {unreadCount > 0 ? `(${unreadCount})` : ''}
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Real-time direct chat with read receipts, attachments, and safety controls.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center text-xs font-medium text-neutral-900">
            <span>Open Inbox</span>
            <ArrowRight size={13} className="ml-1.5 text-neutral-400 group-hover:text-neutral-950 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>

      {/* Quick Skill Discovery Strip */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1 mr-1">
          <Sparkles size={12} />
          <span>Explore skills:</span>
        </span>
        {QUICK_SKILLS.map((skill) => (
          <button
            key={skill}
            onClick={() => navigate(`/search?q=${encodeURIComponent(skill)}`)}
            className="px-2.5 py-1 rounded-md text-xs bg-neutral-50 hover:bg-neutral-950 hover:text-white border border-neutral-200 text-neutral-700 transition-colors"
          >
            {skill}
          </button>
        ))}
      </div>

      {/* Two-Column Activity Grid: Community Highlights + Recently Joined */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left 3 cols: Community Highlights */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
              Latest on Community Board
            </h2>
            <Link
              to="/community"
              className="text-xs font-medium text-neutral-500 hover:text-neutral-950 flex items-center gap-1"
            >
              <Plus size={12} />
              <span>View / Post</span>
            </Link>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-subtle overflow-hidden">
            {recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate('/community')}
                  className="p-4 hover:bg-neutral-50/70 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge capitalize">{post.category}</span>
                    <span className="text-[11px] text-neutral-400">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-neutral-950">{post.title}</h3>
                  <p className="text-xs text-neutral-500 line-clamp-2">{post.description}</p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-neutral-500">
                No active board posts yet. Start a thread in Community!
              </div>
            )}
          </div>
        </div>

        {/* Right 2 cols: Recently Joined + Saved Contacts */}
        <div className="lg:col-span-2 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                Recently Joined
              </h2>
              <Link
                to="/search"
                className="text-xs font-medium text-neutral-500 hover:text-neutral-950 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-subtle overflow-hidden">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-neutral-200" />
                      <div className="flex-1 space-y-1.5">
                        <div className="w-24 h-3 bg-neutral-200 rounded" />
                        <div className="w-16 h-2 bg-neutral-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentProfiles.length > 0 ? (
                recentProfiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/messages/${p.user_id}`)}
                    className="p-3.5 hover:bg-neutral-50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-800">
                          {p.avatar_url ? (
                            <img
                              src={p.avatar_url}
                              alt={p.full_name || 'Resident'}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{p.full_name ? p.full_name.charAt(0).toUpperCase() : 'U'}</span>
                          )}
                        </div>
                        {isOnline(p.user_id) && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-neutral-950 truncate">
                          {p.full_name || 'Resident'}
                        </h3>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {p.domain || 'Student'} {p.year_of_study ? `· Y${p.year_of_study}` : ''}
                        </p>
                      </div>
                    </div>
                    {p.room_number && (
                      <span className="text-[10px] font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 flex-shrink-0">
                        {p.room_number}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-neutral-500">
                  No resident profiles found yet.
                </div>
              )}
            </div>
          </div>

          {savedProfiles.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Bookmark size={13} className="text-neutral-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Saved Contacts
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {savedProfiles.map((sp) => (
                  <button
                    key={sp.user_id}
                    onClick={() => navigate(`/messages/${sp.user_id}`)}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg hover:border-neutral-950/40 transition-colors shadow-subtle text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-neutral-900">{sp.full_name}</span>
                    {sp.room_number && (
                      <span className="text-[10px] font-mono text-neutral-400">{sp.room_number}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
