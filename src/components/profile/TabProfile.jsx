import React, { useState } from 'react';
import { User, Mail, Calendar, Edit2, Save, X, LogOut, Zap, AlertCircle } from 'lucide-react';
import { authService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { InfoRow, FormField } from './ProfileUtils';

const TabProfile = ({ user, setUser, historyLength, setActiveTab, handleLogout }) => {
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: user?.username || '', email: user?.email || '' });

  const handleUpdateProfile = async () => {
    try {
      const updatedUser = await authService.updateProfile(formData.username, formData.email);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      window.dispatchEvent(new Event('user-update'));
      addToast('Profile updated!', 'success');
    } catch { addToast('Failed to update profile.', 'error'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your display name and email address.</p>
      </div>

      <div className="flex items-center gap-5 p-5 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl">
        <div className="relative shrink-0">
          {user.profile_picture ? (
            <img src={user.profile_picture} alt="avatar" className="w-16 h-16 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-white dark:ring-gray-800 shadow-lg">
              {user.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-lg">{user.username}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          <button onClick={() => setActiveTab('appearance')} className="text-xs text-primary hover:underline mt-1">Change photo →</button>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm space-y-1">
        {!isEditing ? (
          <>
            <InfoRow icon={User} label="Username" value={user.username} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Calendar} label="Member since" value="January 2026" />
            <InfoRow icon={Zap} label="Total translations" value={historyLength} accent />
            <div className="pt-4">
              <button onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-semibold shadow">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-4 pt-1">
            <FormField label="Username" icon={User}>
              <input type="text" value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="profile-input" placeholder="Your username" required />
            </FormField>
            <FormField label="Email Address" icon={Mail}>
              <input type="email" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="profile-input" placeholder="you@example.com" required />
            </FormField>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-500 transition font-semibold shadow">
                <Save className="w-4 h-4" /> Save Changes
              </button>
              <button type="button" onClick={() => { setIsEditing(false); setFormData({ username: user.username, email: user.email }); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/30 rounded-2xl shadow-sm">
        <h3 className="font-bold text-red-500 mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Danger Zone</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Logging out will end your current session immediately.</p>
        <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition font-semibold">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default TabProfile;
