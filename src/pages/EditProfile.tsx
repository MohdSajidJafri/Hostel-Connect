import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Upload, ChevronDown } from 'lucide-react';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, isDemo, updateDemoProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    course: '',
    yearOfStudy: '',
    expertise: '',
    roomNumber: '',
    contactInfo: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        course: profile.domain || '',
        yearOfStudy: profile.year_of_study?.toString() || '',
        expertise: profile.expertise || '',
        roomNumber: profile.room_number || '',
        contactInfo: profile.contact_info || '',
      });

      if (profile.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('File size must be less than 2MB');
        return;
      }
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
      const nextUrl = URL.createObjectURL(file);
      setPreviewObjectUrl(nextUrl);
      setAvatar(file);
      setAvatarUrl(nextUrl);
      setErrorMsg(null);
    }
  };

  const uploadAvatar = async (): Promise<string> => {
    if (!avatar || !user) {
      throw new Error('No avatar selected or user not authenticated.');
    }

    try {
      setUploading(true);

      const fileExt = avatar.name.split('.').pop() || 'png';
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, avatar);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMsg('You must be signed in to update your profile.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Convert year of study to number if provided
      const yearOfStudy = formData.yearOfStudy
        ? parseInt(formData.yearOfStudy, 10)
        : null;

      if (isDemo) {
        updateDemoProfile({
          full_name: formData.fullName,
          domain: formData.course,
          year_of_study: yearOfStudy,
          expertise: formData.expertise,
          room_number: formData.roomNumber,
          contact_info: formData.contactInfo,
          avatar_url: avatarUrl || profile?.avatar_url || null,
        });
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => {
          navigate('/profile');
        }, 400);
        return;
      }

      // Upload avatar if changed; throws on failure so we never wipe existing avatar_url
      let newAvatarUrl = profile?.avatar_url || null;
      if (avatar) {
        newAvatarUrl = await uploadAvatar();
      }

      // Update profile
      const { error } = await supabase.from('profiles').upsert(
        {
          user_id: user.id,
          full_name: formData.fullName,
          domain: formData.course,
          year_of_study: yearOfStudy,
          expertise: formData.expertise,
          room_number: formData.roomNumber,
          contact_info: formData.contactInfo,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

      if (error) throw error;

      await refreshProfile();
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        navigate('/profile');
      }, 600);
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMsg('Error updating profile: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="p-1.5 -ml-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors"
          title="Back to profile"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
          Edit Profile
        </h1>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-neutral-50 border border-neutral-300 rounded-md text-xs text-neutral-800">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-neutral-50 border border-neutral-300 rounded-md text-xs text-neutral-900 font-medium">
          {successMsg}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 space-y-8 shadow-subtle">
        {/* Profile Photo Section */}
        <div>
          <label className="block text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">
            Profile Photo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center text-sm font-semibold text-neutral-800 flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="btn btn-secondary text-xs py-1.5 px-3 cursor-pointer inline-flex items-center gap-1.5">
                <Upload size={13} />
                <span>Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
              <p className="text-[11px] text-neutral-400">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-4 border-t border-neutral-100">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="fullName"
              className="block text-xs font-medium text-neutral-700"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="input text-xs"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Mohd Sajid Jafri"
              required
            />
          </div>

          {/* Course/Program */}
          <div className="space-y-1.5">
            <label
              htmlFor="course"
              className="block text-xs font-medium text-neutral-700"
            >
              Course / Program
            </label>
            <input
              type="text"
              id="course"
              name="course"
              className="input text-xs"
              value={formData.course}
              onChange={handleChange}
              placeholder="e.g. B.Tech CSE"
            />
          </div>

          {/* Year of Study */}
          <div className="space-y-1.5">
            <label
              htmlFor="yearOfStudy"
              className="block text-xs font-medium text-neutral-700"
            >
              Year of Study
            </label>
            <div className="relative">
              <select
                id="yearOfStudy"
                name="yearOfStudy"
                className="input text-xs appearance-none pr-8 cursor-pointer"
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
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Area of Expertise */}
          <div className="space-y-1.5">
            <label
              htmlFor="expertise"
              className="block text-xs font-medium text-neutral-700"
            >
              Area of Expertise
            </label>
            <input
              type="text"
              id="expertise"
              name="expertise"
              className="input text-xs"
              value={formData.expertise}
              onChange={handleChange}
              placeholder="e.g. Web Development · DSA · React"
            />
          </div>

          {/* Room Number */}
          <div className="space-y-1.5">
            <label
              htmlFor="roomNumber"
              className="block text-xs font-medium text-neutral-700"
            >
              Room Number
            </label>
            <input
              type="text"
              id="roomNumber"
              name="roomNumber"
              className="input text-xs"
              value={formData.roomNumber}
              onChange={handleChange}
              placeholder="e.g. B-041"
            />
          </div>

          {/* Contact Info (WhatsApp) */}
          <div className="space-y-1.5">
            <label
              htmlFor="contactInfo"
              className="block text-xs font-medium text-neutral-700"
            >
              Contact (WhatsApp)
            </label>
            <input
              type="text"
              id="contactInfo"
              name="contactInfo"
              className="input text-xs"
              value={formData.contactInfo}
              onChange={handleChange}
              placeholder="e.g. +91 98765 43210"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
          <button
            type="button"
            className="btn btn-secondary text-xs"
            onClick={() => navigate('/profile')}
            disabled={loading || uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary text-xs min-w-[120px]"
            disabled={loading || uploading}
          >
            {loading || uploading ? (
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;

