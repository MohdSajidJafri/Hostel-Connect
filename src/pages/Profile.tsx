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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      
      <div className="bg-white p-6 rounded shadow mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'Profile'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span>No Photo</span>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile.full_name || 'No Name Set'}</h2>
            <p className="text-gray-600 mb-2">
              {profile.domain ? `${profile.domain}` : 'No course/program set'}
              {profile.year_of_study ? `, Year ${profile.year_of_study}` : ''}
            </p>
            
            <div className="mt-4">
              <Link to="/profile/edit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Profile Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium">Area of Expertise</h3>
            <p>{profile.expertise || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="font-medium">Room Number</h3>
            <p>{profile.room_number || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="font-medium">Contact Info</h3>
            <p>{profile.contact_info || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="font-medium">Email</h3>
            <p>{user.email || 'Not available'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
