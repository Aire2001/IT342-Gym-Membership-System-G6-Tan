import React, { useState, useRef, useEffect } from 'react';
import { profileAPI } from './profileApi';
import { useAuth } from '../auth/AuthContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ firstname: user?.firstname ?? '', lastname: user?.lastname ?? '' });
  const [preview, setPreview] = useState<string | null>(user?.profilePicture ?? null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    profileAPI.getProfile().then(res => {
      const d = res.data.data;
      setForm({ firstname: d.firstname ?? '', lastname: d.lastname ?? '' });
      setPreview(d.profilePicture ?? null);
    }).catch(() => {});
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstname.trim() || !form.lastname.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await profileAPI.updateProfile({
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        profilePicture: preview ?? '',
      });
      updateUser({ firstname: form.firstname.trim(), lastname: form.lastname.trim(), profilePicture: preview ?? undefined });
      setSuccess('Profile updated successfully!');
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = `${form.firstname?.[0] ?? ''}${form.lastname?.[0] ?? ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Profile Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Update your name and profile picture.</p>
        </div>

        <form onSubmit={handleSave}>
          {/* Profile Picture */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-5">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-md border-4 border-white">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-md transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-gray-700 font-semibold text-sm">
                  {form.firstname || user?.firstname} {form.lastname || user?.lastname}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">{user?.email}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-1.5 border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 rounded-lg text-xs font-semibold transition-all"
                >
                  Change Photo
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="mt-3 ml-2 px-4 py-1.5 border border-gray-300 text-red-500 hover:border-red-400 rounded-lg text-xs font-semibold transition-all"
                  >
                    Remove
                  </button>
                )}
                <p className="text-gray-400 text-xs mt-2">JPG, PNG or GIF · Max 2 MB</p>
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-5">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={form.firstname}
                  onChange={e => setForm({ ...form, firstname: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={form.lastname}
                  onChange={e => setForm({ ...form, lastname: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all text-sm shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
