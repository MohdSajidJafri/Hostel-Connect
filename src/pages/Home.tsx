import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Home: React.FC = () => {
  const { user, profile } = useAuth();
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
    <div className="container mx-auto p-4">
      <div className="bg-white p-6 rounded shadow mb-6">
        <h1 className="text-2xl font-bold mb-2">Welcome to Hostel Connect</h1>
        <p className="mb-4">Connect with other residents in your hostel community.</p>
        
        {!profile?.full_name && (
          <div className="bg-blue-50 p-4 rounded mb-4">
            <p className="text-blue-800">
              Complete your profile to help others find and connect with you.
            </p>
            <Link 
              to="/profile/edit" 
              className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Complete Profile
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Find Residents</h2>
          <p className="mb-3">Discover other residents based on course, expertise, or room location.</p>
          <Link 
            to="/search" 
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Search
          </Link>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Connect</h2>
          <p className="mb-3">Message other residents to collaborate, share resources, or just make friends.</p>
          <Link 
            to="/messages" 
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Messages
          </Link>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Your Profile</h2>
          <p className="mb-3">Manage your profile to showcase your expertise and help others find you.</p>
          <Link 
            to="/profile" 
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            View Profile
          </Link>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Recently Joined Residents</h2>
        
        {loading ? (
          <p>Loading recent profiles...</p>
        ) : recentProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentProfiles.map(profile => (
              <div key={profile.id} className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('') : 'U'
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{profile.full_name || 'Unnamed User'}</h3>
                  {profile.domain && (
                    <p className="text-sm text-gray-600">{profile.domain}</p>
                  )}
                  {profile.expertise && (
                    <p className="text-sm text-gray-600">{profile.expertise}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No recent profiles to display.</p>
        )}
      </div>
    </div>
  );
};

export default Home;
