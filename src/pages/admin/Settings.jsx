import React, { useState, useEffect } from 'react';
import { Save, User, Palette } from 'lucide-react';
import { adminService, authService } from '../../services/api';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ username: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [bgTheme, setBgTheme] = useState(localStorage.getItem('adminBgTheme') || 'liquid');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
        setProfileForm({ username: u.username || '', email: u.email || '' });
      } catch (e) {}
    }
  }, []);

  const handleThemeChange = (e) => {
    const val = e.target.value;
    setBgTheme(val);
    localStorage.setItem('adminBgTheme', val);
    window.dispatchEvent(new Event('admin-theme-update'));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg({ text: '', type: '' });

    try {
      // 1. Update Appwrite (source of truth for auth & prefs)
      await authService.updateProfile(profileForm.username, profileForm.email);

      // 2. Update MongoDB (backend sync)
      const targetId = user.id || user.$id;
      const updatedUser = await adminService.updateAdmin(targetId, {
        username: profileForm.username,
        email: profileForm.email
      });
      
      const mergedUser = { ...user, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(mergedUser));
      window.dispatchEvent(new Event('user-update'));
      
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: err?.response?.data?.detail || err?.response?.data?.error || err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Panel: Admin Profile Details */}
      <div className="bg-glass rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3">
          <User className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Admin Profile</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your admin account details.</p>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                <input 
                  type="text" 
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input 
                  type="email" 
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-xl"
                  required
                />
              </div>
            </div>
            {profileMsg.text && (
              <p className={`text-sm mt-2 ${profileMsg.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                {profileMsg.text}
              </p>
            )}
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl glass-button bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium shadow-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Panel: Appearance / Theme */}
      <div className="bg-glass rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3">
          <Palette className="w-5 h-5 text-pink-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Appearance</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize the admin dashboard background theme.</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="bgTheme" 
                  value="liquid" 
                  checked={bgTheme === 'liquid'}
                  onChange={handleThemeChange}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Liquid Glass (Purple Mix)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="bgTheme" 
                  value="solid" 
                  checked={bgTheme === 'solid'}
                  onChange={handleThemeChange}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Solid Color (Slate)</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Note: This setting is independent of the Light/Dark mode toggle in the top bar.
            </p>
          </div>
        </div>
      </div>

      {/* Panel 1: AI & Translation Engine */}



      <div className="flex justify-end pt-4 gap-4">
        <button className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Discard Changes
        </button>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl glass-button bg-blue-600/80 hover:bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/30 transition-colors">
          <Save className="w-5 h-5" />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
