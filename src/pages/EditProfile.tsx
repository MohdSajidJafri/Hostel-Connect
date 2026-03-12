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
    <div className="container mx-auto p-4 max-w-3xl animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Profile</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="card p-8">
        {/* Profile Photo */}
        <div className="mb-8 pb-8 border-b border-slate-100">
          <label className="block mb-4 font-semibold text-slate-900">Profile Photo</label>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full overflow-hidden flex items-center justify-center shadow-inner border-4 border-white flex-shrink-0">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              )}
            </div>
            <div className="flex flex-col items-center sm:items-start gap-2 pt-2">
              <label className="btn btn-secondary cursor-pointer">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                Upload New Photo
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
              <p className="text-sm text-slate-500">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="fullName" className="block font-medium text-slate-700">Full Name</label>
            <input 
              type="text" 
              id="fullName"
              name="fullName"
              className="input" 
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>
          
          {/* Course/Domain */}
          <div className="space-y-1">
            <label htmlFor="course" className="block font-medium text-slate-700">Course/Program</label>
            <input 
              type="text" 
              id="course"
              name="course"
              className="input" 
              value={formData.course}
              onChange={handleChange}
              placeholder="e.g., Computer Science"
            />
          </div>
          
          {/* Year of Study */}
          <div className="space-y-1">
            <label htmlFor="yearOfStudy" className="block font-medium text-slate-700">Year of Study</label>
            <div className="relative">
              <select
                id="yearOfStudy"
                name="yearOfStudy"
                className="input appearance-none"
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          
          {/* Area of Expertise */}
          <div className="space-y-1">
            <label htmlFor="expertise" className="block font-medium text-slate-700">Area of Expertise</label>
            <input 
              type="text" 
              id="expertise"
              name="expertise"
              className="input" 
              value={formData.expertise}
              onChange={handleChange}
              placeholder="e.g., Web Dev, UI/UX"
            />
          </div>
          
          {/* Room Number */}
          <div className="space-y-1">
            <label htmlFor="roomNumber" className="block font-medium text-slate-700">Room Number</label>
            <input 
              type="text" 
              id="roomNumber"
              name="roomNumber"
              className="input" 
              value={formData.roomNumber}
              onChange={handleChange}
              placeholder="e.g., A-101"
            />
          </div>
          
          {/* Contact Info */}
          <div className="space-y-1">
            <label htmlFor="contactInfo" className="block font-medium text-slate-700">Contact Info (WhatsApp)</label>
            <input 
              type="text" 
              id="contactInfo"
              name="contactInfo"
              className="input" 
              value={formData.contactInfo}
              onChange={handleChange}
              placeholder="e.g., +91 9876543210"
            />
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/profile')}
            disabled={loading || uploading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary min-w-[140px]"
            disabled={loading || uploading}
          >
            {loading || uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving...
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
