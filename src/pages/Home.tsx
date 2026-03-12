import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Home: React.FC = () => {
  const { profile } = useAuth();
  const [recentProfiles, setRecentProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentProfiles();
  }, []);

  const fetchRecentProfiles = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (error) {
        throw error;
      }
      
      setRecentProfiles(data || []);
    } catch (error) {
      console.error('Error fetching recent profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl animate-in fade-in duration-500">
      <div className="card p-8 mb-8 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-slate-900 tracking-tight">Welcome to <span className="text-primary-600">Hostel Connect</span></h1>
          <p className="text-slate-600 text-lg mb-6 max-w-2xl">Connect with other residents in your hostel community. Share resources, collaborate, and make friends.</p>
          
          {!profile?.full_name && (
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-amber-800 font-semibold mb-1">Complete your profile</h3>
                <p className="text-amber-700/80 text-sm">
                  Help others find and connect with you by adding your details.
                </p>
              </div>
              <Link 
                to="/profile/edit" 
                className="btn bg-amber-500 text-white hover:bg-amber-600 shadow-sm whitespace-nowrap"
              >
                Complete Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 flex flex-col h-full group">
          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">Find Residents</h2>
          <p className="mb-6 text-slate-600 flex-grow">Discover other residents based on course, expertise, or room location.</p>
          <Link 
            to="/search" 
            className="btn btn-primary w-full"
          >
            Search Directory
          </Link>
        </div>
        
        <div className="card p-6 flex flex-col h-full group">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">Connect</h2>
          <p className="mb-6 text-slate-600 flex-grow">Message other residents to collaborate, share resources, or just make friends.</p>
          <Link 
            to="/messages" 
            className="btn bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow active:scale-[0.98] w-full"
          >
            Open Messages
          </Link>
        </div>
        
        <div className="card p-6 flex flex-col h-full group">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">Your Profile</h2>
          <p className="mb-6 text-slate-600 flex-grow">Manage your profile to showcase your expertise and help others find you.</p>
          <Link 
            to="/profile" 
            className="btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow active:scale-[0.98] w-full"
          >
            View Profile
          </Link>
        </div>
      </div>
      
      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Recently Joined</h2>
          <Link to="/search" className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1">
            View all <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : recentProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentProfiles.map(profile => (
              <Link to={`/messages/${profile.user_id}`} key={profile.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group cursor-pointer">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner border border-white">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-700 font-bold text-lg">
                      {profile.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors">{profile.full_name || 'Unnamed User'}</h3>
                  {profile.domain && (
                    <p className="text-sm text-slate-500 truncate">{profile.domain}</p>
                  )}
                  {profile.expertise && (
                    <p className="text-xs text-slate-400 truncate mt-0.5 bg-slate-100 inline-block px-2 py-0.5 rounded-md">{profile.expertise}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
            <p className="text-slate-500">No recent profiles to display.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
