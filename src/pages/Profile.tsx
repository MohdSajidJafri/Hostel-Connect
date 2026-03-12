import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { profile, user } = useAuth();
  
  if (!profile || !user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Loading profile...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-4xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
        <Link to="/profile/edit" className="btn btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          Edit Profile
        </Link>
      </div>
      
      <div className="card p-8 mb-6 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 overflow-hidden shadow-inner border-4 border-white flex-shrink-0">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'Profile'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold">
                {profile.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </span>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left mt-2">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{profile.full_name || 'No Name Set'}</h2>
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-700 font-medium mb-4">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"></path></svg>
              {profile.domain ? `${profile.domain}` : 'No course/program set'}
              {profile.year_of_study ? <span className="text-slate-400 font-normal">| Year {profile.year_of_study}</span> : ''}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card p-8">
        <h2 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Profile Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Area of Expertise</h3>
            <p className="text-slate-900 font-medium text-lg">{profile.expertise || 'Not specified'}</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Room Number</h3>
            <p className="text-slate-900 font-medium text-lg">{profile.room_number || 'Not specified'}</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Info</h3>
            <p className="text-slate-900 font-medium text-lg">{profile.contact_info || 'Not specified'}</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</h3>
            <p className="text-slate-900 font-medium text-lg">{user.email || 'Not available'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
