import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    course: '',
    yearOfStudy: '',
    expertise: '',
    roomNumber: '',
    contactInfo: ''
  });
  
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        course: profile.domain || '',
        yearOfStudy: profile.year_of_study?.toString() || '',
        expertise: profile.expertise || '',
        roomNumber: profile.room_number || '',
        contactInfo: profile.contact_info || ''
      });
      
      if (profile.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    }
  }, [profile]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      setAvatar(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };
  
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatar || !user) return null;
    
    try {
      setUploading(true);
      
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      // Upload directly to the bucket root instead of avatars subfolder
      const filePath = fileName;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, avatar);
        
      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar.');
      return null;
    } finally {
      setUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to update your profile');
      return;
    }
    
    try {
      setLoading(true);
      
      // Upload avatar if changed
      let newAvatarUrl = profile?.avatar_url || null;
      if (avatar) {
        newAvatarUrl = await uploadAvatar();
      }
      
      // Convert year of study to number if provided
      const yearOfStudy = formData.yearOfStudy ? parseInt(formData.yearOfStudy) : null;
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: formData.fullName,
          domain: formData.course,
          year_of_study: yearOfStudy,
          expertise: formData.expertise,
          room_number: formData.roomNumber,
          contact_info: formData.contactInfo,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
        
      if (error) {
        throw error;
      }
      
      await refreshProfile();
      alert('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
        {/* Profile Photo */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">Profile Photo</label>
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500">No Photo</span>
              )}
            </div>
            <label className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded cursor-pointer">
              Upload Photo
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={handleAvatarChange}
                disabled={uploading}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">Maximum file size: 2MB</p>
        </div>
        
        {/* Full Name */}
        <div className="mb-4">
          <label htmlFor="fullName" className="block mb-1 font-medium">Full Name</label>
          <input 
            type="text" 
            id="fullName"
            name="fullName"
            className="w-full p-2 border rounded" 
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Course/Domain */}
        <div className="mb-4">
          <label htmlFor="course" className="block mb-1 font-medium">Course/Program</label>
          <input 
            type="text" 
            id="course"
            name="course"
            className="w-full p-2 border rounded" 
            value={formData.course}
            onChange={handleChange}
            placeholder="e.g., Computer Science, Mechanical Engineering"
          />
        </div>
        
        {/* Year of Study */}
        <div className="mb-4">
          <label htmlFor="yearOfStudy" className="block mb-1 font-medium">Year of Study</label>
          <select
            id="yearOfStudy"
            name="yearOfStudy"
            className="w-full p-2 border rounded"
            value={formData.yearOfStudy}
            onChange={handleChange}
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            <option value="5">5th Year</option>
          </select>
        </div>
        
        {/* Area of Expertise */}
        <div className="mb-4">
          <label htmlFor="expertise" className="block mb-1 font-medium">Area of Expertise</label>
          <input 
            type="text" 
            id="expertise"
            name="expertise"
            className="w-full p-2 border rounded" 
            value={formData.expertise}
            onChange={handleChange}
            placeholder="e.g., Web Development, Machine Learning, Robotics"
          />
        </div>
        
        {/* Room Number */}
        <div className="mb-4">
          <label htmlFor="roomNumber" className="block mb-1 font-medium">Room Number</label>
          <input 
            type="text" 
            id="roomNumber"
            name="roomNumber"
            className="w-full p-2 border rounded" 
            value={formData.roomNumber}
            onChange={handleChange}
            placeholder="e.g., A-101, B-202"
          />
        </div>
        
        {/* Contact Info */}
        <div className="mb-6">
          <label htmlFor="contactInfo" className="block mb-1 font-medium">Contact Info (WhatsApp)</label>
          <input 
            type="text" 
            id="contactInfo"
            name="contactInfo"
            className="w-full p-2 border rounded" 
            value={formData.contactInfo}
            onChange={handleChange}
            placeholder="e.g., +91 9876543210"
          />
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2">
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={loading || uploading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            onClick={() => navigate('/profile')}
            disabled={loading || uploading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
