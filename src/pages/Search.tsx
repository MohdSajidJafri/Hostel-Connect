import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/supabase';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  useEffect(() => {
    fetchProfiles();
  }, []);
  
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setProfiles(data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredProfiles = profiles.filter(profile => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (profile.full_name && profile.full_name.toLowerCase().includes(searchLower)) ||
      (profile.expertise && profile.expertise.toLowerCase().includes(searchLower)) ||
      (profile.domain && profile.domain.toLowerCase().includes(searchLower)) ||
      (profile.room_number && profile.room_number.toLowerCase().includes(searchLower))
    );
  });
  
  const handleMessageClick = (userId: string) => {
    navigate(`/messages/${userId}`);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Find Hostel Residents</h1>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, expertise, course, or room number..."
          className="w-full p-3 border rounded"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p>Loading profiles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.length > 0 ? (
            filteredProfiles.map(profile => (
              <div key={profile.id} className="bg-white p-4 rounded shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-xs text-gray-500">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name || 'Profile'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('') : 'U'
                    )}
                  </div>
                  <h2 className="text-lg font-semibold">{profile.full_name || 'Unnamed User'}</h2>
                </div>
                
                {profile.domain && (
                  <p className="mb-1 text-sm">
                    <span className="font-medium">Course:</span> {profile.domain}
                    {profile.year_of_study && `, Year ${profile.year_of_study}`}
                  </p>
                )}
                
                {profile.expertise && (
                  <p className="mb-1 text-sm">
                    <span className="font-medium">Expertise:</span> {profile.expertise}
                  </p>
                )}
                
                {profile.room_number && (
                  <p className="mb-1 text-sm">
                    <span className="font-medium">Room:</span> {profile.room_number}
                  </p>
                )}
                
                <button 
                  className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                  onClick={() => handleMessageClick(profile.user_id)}
                >
                  Message
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No residents found matching your search criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
