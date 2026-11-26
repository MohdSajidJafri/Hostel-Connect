import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, Profile as ProfileType } from '../lib/supabase';
import { DEMO_PROFILES } from '../lib/demoData';
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
} from 'lucide-react';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { profile: myProfile, user, isDemo } = useAuth();
  const [viewedProfile, setViewedProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (isOwnProfile) {
      setViewedProfile(myProfile);
      return;
    }

    if (isDemo) {
      const found = DEMO_PROFILES.find((p) => p.user_id === userId) || null;
      setViewedProfile(found);
      return;
    }

    const fetchOtherProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (error) throw error;
        setViewedProfile(data);
      } catch (err) {
        console.error('Error fetching resident profile:', err);
        setViewedProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOtherProfile();
  }, [userId, isOwnProfile, myProfile, isDemo]);

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

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {!isOwnProfile && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
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
          <Link
            to={`/messages/${activeProfile.user_id}`}
            className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <MessageSquare size={13} />
            <span>Message</span>
          </Link>
        )}
      </div>

      {/* Identity Card */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-subtle">
        {/* Architectural Subtle Cover Surface */}
        <div className="h-28 bg-neutral-100 border-b border-neutral-200 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
        </div>

        {/* Identity Details */}
        <div className="px-6 pb-6 pt-0 text-center relative">
          <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-subtle overflow-hidden mx-auto -mt-10 flex items-center justify-center text-base font-semibold text-neutral-800 relative z-10">
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

          <div className="mt-3 space-y-1">
            <h2 className="text-lg font-bold text-neutral-950 tracking-tight">
              {activeProfile.full_name || 'Resident Name'}
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-neutral-500">
              {activeProfile.domain && <span>• {activeProfile.domain}</span>}
              {activeProfile.year_of_study && <span>• Year {activeProfile.year_of_study}</span>}
              <span className="text-neutral-400">• Active</span>
            </div>

            <p className="text-xs text-neutral-500 italic pt-2 max-w-md mx-auto">
              "Building, learning and growing together."
            </p>
          </div>
        </div>

        {/* Structured Details Section */}
        <div className="border-t border-neutral-100 p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 flex-shrink-0">
              <Briefcase size={15} />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Expertise
              </div>
              <div className="text-xs font-medium text-neutral-900">
                {activeProfile.expertise || 'Not specified'}
              </div>
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
