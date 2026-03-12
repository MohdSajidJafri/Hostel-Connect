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
    <div className="container mx-auto p-4 max-w-6xl animate-in fade-in duration-500">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-3 text-slate-900 tracking-tight">Find Hostel Residents</h1>
        <p className="text-slate-600">Search for people by name, expertise, course, or room number to connect and collaborate.</p>
      </div>
      
      <div className="mb-10 max-w-3xl mx-auto relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <input
          type="text"
          placeholder="Search by name, expertise, course, or room number..."
          className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-slate-900 placeholder:text-slate-400 text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.length > 0 ? (
            filteredProfiles.map(profile => (
              <div key={profile.id} className="card p-6 flex flex-col h-full group hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full overflow-hidden flex items-center justify-center text-primary-700 shadow-inner border-2 border-white flex-shrink-0">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name || 'Profile'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold">
                        {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{profile.full_name || 'Unnamed User'}</h2>
                    {profile.domain && (
                      <p className="text-sm text-slate-500">
                        {profile.domain}
                        {profile.year_of_study && <span className="text-slate-400"> • Yr {profile.year_of_study}</span>}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex-grow space-y-3 mb-6">
                  {profile.expertise && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.expertise.split(',').map((skill, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profile.room_number && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Room</h3>
                      <p className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        {profile.room_number}
                      </p>
                    </div>
                  )}
                </div>
                
                <button 
                  className="btn bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white w-full group-hover:shadow-md transition-all duration-300"
                  onClick={() => handleMessageClick(profile.user_id)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  Message
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No residents found</h3>
              <p className="text-slate-500">We couldn't find anyone matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
