import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { supabase, Profile as ProfileType } from '../lib/supabase';
import {
  DEMO_PROFILES,
  getDemoSavedContacts,
  toggleDemoSavedContact,
} from '../lib/demoData';
import { format } from 'date-fns';
import {
  Pencil,
  Briefcase,
  Home as HomeIcon,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  MessageSquare,
  Bookmark,
  BadgeCheck,
} from 'lucide-react';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { profile: myProfile, user, isDemo } = useAuth();
  const { isOnline } = usePresence();
  const [viewedProfile, setViewedProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (isOwnProfile) {
      setViewedProfile(myProfile);
      return;
    }

    if (isDemo && userId) {
      const found = DEMO_PROFILES.find((p) => p.user_id === userId) || null;
      setViewedProfile(found);
      setIsSaved(getDemoSavedContacts().includes(userId));
      return;
    }

    const fetchOtherProfile = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const [{ data, error }, savedRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', userId).single(),
          user
            ? supabase
                .from('saved_contacts')
                .select('id')
                .eq('user_id', user.id)
                .eq('contact_user_id', userId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (error) throw error;
        setViewedProfile(data);
        setIsSaved(Boolean(savedRes.data));
      } catch (err) {
        console.error('Error fetching resident profile:', err);
        setViewedProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOtherProfile();
  }, [userId, isOwnProfile, myProfile, isDemo, user]);

  const handleToggleSave = async () => {
    if (!user || !userId || isOwnProfile) return;

    if (isDemo) {
      setIsSaved(toggleDemoSavedContact(userId));
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from('saved_contacts')
          .delete()
          .eq('user_id', user.id)
          .eq('contact_user_id', userId);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_contacts')
          .insert({ user_id: user.id, contact_user_id: userId });
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling saved contact:', err);
    }
  };

  const activeProfile = isOwnProfile ? myProfile : viewedProfile;

  if (loading || (isOwnProfile && (!activeProfile || !user))) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        <span className="text-xs text-neutral-500">Loading profile...</span>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-xs text-neutral-500">Resident profile not found.</p>
        <button
          onClick={() => navigate('/search')}
          className="btn btn-secondary text-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} />
          <span>Back to Directory</span>
        </button>
      </div>
    );
  }

  const memberSince = activeProfile.created_at
    ? format(new Date(activeProfile.created_at), 'MMMM yyyy')
    : 'Recently';

  const skills = (activeProfile.expertise || '')
    .split(/[·,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const online = isOnline(activeProfile.user_id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {!isOwnProfile && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 truncate">
            {isOwnProfile ? 'Profile' : activeProfile.full_name || 'Resident Profile'}
          </h1>
        </div>
        {isOwnProfile ? (
          <Link
            to="/profile/edit"
            className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Edit Profile"
          >
            <Pencil size={13} />
            <span>Edit Profile</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSave}
              data-testid="save-contact-btn"
              className={`btn text-xs py-1.5 px-3 flex items-center gap-1.5 ${
                isSaved ? 'btn-primary' : 'btn-secondary'
              }`}
              title={isSaved ? 'Remove from saved contacts' : 'Save contact'}
            >
              <Bookmark size={13} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <Link
              to={`/messages/${activeProfile.user_id}`}
              className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <MessageSquare size={13} />
              <span>Message</span>
            </Link>
          </div>
        )}
      </div>

      {/* Identity Card */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-subtle">
        <div className="h-28 bg-neutral-100 border-b border-neutral-200 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
        </div>

        <div className="px-6 pb-6 pt-0 text-center relative">
          <div className="relative w-20 h-20 mx-auto -mt-10 z-10">
            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-subtle overflow-hidden flex items-center justify-center text-base font-semibold text-neutral-800">
              {activeProfile.avatar_url ? (
                <img
                  src={activeProfile.avatar_url}
                  alt={activeProfile.full_name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {activeProfile.full_name ? activeProfile.full_name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            {online && (
              <span
                title="Online now"
                className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
              />
            )}
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-lg font-bold text-neutral-950 tracking-tight">
                {activeProfile.full_name || 'Resident Name'}
              </h2>
              {activeProfile.is_verified && (
                <span title="Verified Resident">
                  <BadgeCheck size={17} className="text-sky-600" />
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-neutral-500">
              {activeProfile.domain && <span>• {activeProfile.domain}</span>}
              {activeProfile.year_of_study && <span>• Year {activeProfile.year_of_study}</span>}
              <span className={online ? 'text-emerald-600 font-medium' : 'text-neutral-400'}>
                • {online ? 'Online' : 'Offline'}
              </span>
            </div>

            {activeProfile.availability_status && (
              <div className="pt-1">
                <span className="badge">{activeProfile.availability_status}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-neutral-100 p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 flex-shrink-0">
              <Briefcase size={15} />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Expertise & Skills
              </div>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <Link
                      key={skill}
                      to={`/search?q=${encodeURIComponent(skill)}`}
                      className="text-xs px-2.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium transition-colors"
                    >
                      {skill}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-medium text-neutral-900">Not specified</div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 flex-shrink-0">
              <HomeIcon size={15} />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Room Number
              </div>
              <div className="text-xs font-mono font-medium text-neutral-900">
                {activeProfile.room_number || 'Not specified'}
              </div>
            </div>
          </div>

          {isOwnProfile && user && (
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 flex-shrink-0">
                <Mail size={15} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Email
                </div>
                <div className="text-xs font-medium text-neutral-900 truncate">
                  {user.email || 'Not available'}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 flex-shrink-0">
              <Phone size={15} />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Contact (WhatsApp)
              </div>
              <div className="text-xs font-medium text-neutral-900">
                {activeProfile.contact_info || 'Not specified'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 flex-shrink-0">
              <Calendar size={15} />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Member since
              </div>
              <div className="text-xs font-medium text-neutral-900">
                {memberSince}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
