import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Calendar, Edit2, Save, X,
  LogOut, Clock, ArrowRight, Trash2, Camera,
  Shield, Eye, EyeOff, HelpCircle, ChevronDown,
  Palette, Check, AlertCircle, Lock, KeyRound,
  MessageSquare, Send, Star, CheckCircle2,
  Info, BookOpen, Zap, Sun, Moon
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import { featureService, authService, feedbackService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LANGUAGES } from '../components/LanguageSelector';
import { account } from '../lib/appwtite';

// ─── Password strength helper ─────────────────────────────────────────────────
const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Very Weak', color: '#ef4444' },
    { score: 2, label: 'Weak', color: '#f97316' },
    { score: 3, label: 'Fair', color: '#eab308' },
    { score: 4, label: 'Strong', color: '#22c55e' },
    { score: 5, label: 'Very Strong', color: '#16a34a' },
  ];
  return map[Math.min(score, 5)];
};

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'How does SignBridge translate sign language?',
    a: 'SignBridge uses a trained AI/ML model that processes real-time camera input and recognizes hand gestures corresponding to words, alphabets, and numbers in Sri Lankan Sign Language, then converts them to text or audio.',
  },
  {
    q: 'Which sign languages are supported?',
    a: 'Currently SignBridge focuses on Sri Lankan Sign Language (SL-SL). We are actively working on expanding support to ASL (American Sign Language) and other regional dialects.',
  },
  {
    q: 'How do I change my profile picture?',
    a: 'Go to the Appearance tab in your dashboard. You can upload a new image (max 5 MB, JPG/PNG/GIF), preview it before saving, and remove it if needed.',
  },
  {
    q: 'Is my translation history private?',
    a: 'Yes. Your translation history is linked to your account and only visible to you. You can delete individual items or clear all history at any time.',
  },
  {
    q: 'I forgot my password — what should I do?',
    a: 'On the login page, click "Forgot password?" to receive a password reset link via email. If you signed up via Google, no password is required.',
  },
  {
    q: 'Can I use SignBridge on mobile?',
    a: 'Yes! SignBridge is fully responsive and works on modern mobile browsers. Camera-based sign detection works best in landscape mode with good lighting.',
  },
];

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'help', icon: HelpCircle, label: 'Help & Support' },
];

// ─── Reusable sub-components ──────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
    <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <Icon className="w-4 h-4" /> {label}
    </span>
    <span className={`text-sm font-semibold ${accent ? 'text-primary' : 'text-gray-800 dark:text-white'}`}>{value}</span>
  </div>
);

const FormField = ({ label, icon: Icon, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </label>
    {children}
  </div>
);

const PasswordField = ({ label, value, show, onToggle, onChange, placeholder }) => (
  <FormField label={label} icon={KeyRound}>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="profile-input pr-10"
        placeholder={placeholder}
        autoComplete="new-password"
      />
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </FormField>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Profile = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');

  // User
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '' });
  const fileInputRef = useRef(null);

  // History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [signSubFilter, setSignSubFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);

  // Security
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const strength = getPasswordStrength(pwForm.newPw);

  // Appearance
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Help & Support
  const [openFaq, setOpenFaq] = useState(null);
  const [fbForm, setFbForm] = useState({ subject: '', message: '', rating: 5 });
  const [fbLoading, setFbLoading] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [editingFb, setEditingFb] = useState(null);

  useEffect(() => { setVisibleCount(6); }, [historyFilter, signSubFilter, history]);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await authService.getUser();
        setUser(currentUser);
        setFormData({ username: currentUser.username, email: currentUser.email });
        localStorage.setItem('user', JSON.stringify(currentUser));
        window.dispatchEvent(new Event('user-update'));
        fetchHistory(currentUser.user_id);
        fetchMyFeedbacks(currentUser.user_id);
      } catch {
        navigate('/login');
      }
    };
    void load();
  }, [navigate]);

  const getLangName = (code) => {
    if (!code) return 'Unknown';
    if (code.toLowerCase() === 'sign') return 'Sign Language';
    if (code.toLowerCase() === 'auto') return 'Auto Detect';
    return LANGUAGES.find(l => l.code.toLowerCase() === code.toLowerCase())?.name || code.toUpperCase();
  };

  const filteredHistory = history.filter(item => {
    const isTextMode = item.mode === 'text';
    const actualMode = item.mode && !isTextMode ? item.mode : (isTextMode ? 'text' : 'word');
    if (historyFilter === 'all') return true;
    if (historyFilter === 'text') return actualMode === 'text';
    if (historyFilter === 'sign') {
      if (actualMode === 'text') return false;
      if (signSubFilter === 'all') return true;
      return actualMode === signSubFilter;
    }
    return false;
  });

  // ── CRUD: History ────────────────────────────────────────────────────────────
  const fetchHistory = async (userId) => {
    try {
      setLoadingHistory(true);
      const data = await featureService.getHistory(userId);
      setHistory(data);
    } catch { /* silent */ } finally { setLoadingHistory(false); }
  };

  const handleDeleteAll = async () => {
    if (filteredHistory.length === 0) return;
    if (!window.confirm(`Delete all ${historyFilter === 'all' ? '' : historyFilter + ' '}history items?`)) return;
    try {
      setLoadingHistory(true);
      await Promise.all(filteredHistory.map(item => featureService.deleteHistory(item._id, user.user_id)));
      const ids = new Set(filteredHistory.map(i => i._id));
      setHistory(prev => prev.filter(i => !ids.has(i._id)));
      addToast(`Deleted ${filteredHistory.length} items`, 'success');
    } catch { addToast('Failed to delete some items', 'error'); }
    finally { setLoadingHistory(false); }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this translation?')) return;
    try {
      await featureService.deleteHistory(itemId, user.user_id);
      setHistory(prev => prev.filter(i => i._id !== itemId));
      addToast('Item deleted', 'success');
    } catch { addToast('Failed to delete item', 'error'); }
  };

  // ── CRUD: Profile ─────────────────────────────────────────────────────────────
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

  // ── CRUD: Avatar ──────────────────────────────────────────────────────────────
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { addToast('Max 5 MB allowed.', 'error'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    try {
      setAvatarLoading(true);
      addToast('Uploading…', 'info');
      const res = await authService.uploadAvatar(user.user_id, avatarFile);
      const updated = { ...user, profile_picture: res.url };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setAvatarPreview(null);
      setAvatarFile(null);
      window.dispatchEvent(new Event('user-update'));
      addToast('Profile picture updated!', 'success');
    } catch { addToast('Upload failed.', 'error'); }
    finally { setAvatarLoading(false); if (avatarInputRef.current) avatarInputRef.current.value = ''; }
  };

  const handleAvatarRemove = async () => {
    if (!window.confirm('Remove your profile picture?')) return;
    try {
      setAvatarLoading(true);
      const current = await account.get();
      await account.updatePrefs({ ...(current.prefs || {}), profile_picture: '' });
      const updated = { ...user, profile_picture: '' };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setAvatarPreview(null);
      setAvatarFile(null);
      window.dispatchEvent(new Event('user-update'));
      addToast('Profile picture removed.', 'success');
    } catch { addToast('Failed to remove picture.', 'error'); }
    finally { setAvatarLoading(false); }
  };

  const cancelAvatarPreview = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  // ── CRUD: Password ────────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      addToast('Please fill all password fields.', 'error'); return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      addToast('New passwords do not match.', 'error'); return;
    }
    if (pwForm.newPw.length < 8) {
      addToast('Password must be at least 8 characters.', 'error'); return;
    }
    try {
      setPwLoading(true);
      await account.updatePassword(pwForm.newPw, pwForm.current);
      setPwForm({ current: '', newPw: '', confirm: '' });
      addToast('Password changed successfully!', 'success');
    } catch (err) {
      const msg = err?.message || 'Failed to change password.';
      addToast(msg.includes('Invalid credentials') ? 'Current password is incorrect.' : msg, 'error');
    } finally { setPwLoading(false); }
  };

  // ── CRUD: Feedback ────────────────────────────────────────────────────────────
  const fetchMyFeedbacks = async (userId) => {
    try {
      const data = await feedbackService.getMyFeedbacks(userId);
      setMyFeedbacks(data);
    } catch { /* silent */ }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!fbForm.subject.trim() || !fbForm.message.trim()) {
      addToast('Please fill subject and message.', 'error'); return;
    }
    try {
      setFbLoading(true);
      if (editingFb) {
        await feedbackService.update(editingFb._id, { subject: fbForm.subject, message: fbForm.message, rating: fbForm.rating });
        setMyFeedbacks(prev => prev.map(f => f._id === editingFb._id ? { ...f, ...fbForm } : f));
        addToast('Feedback updated!', 'success');
        setEditingFb(null);
      } else {
        const newFb = await feedbackService.submit({ user_id: user.user_id, username: user.username, ...fbForm });
        setMyFeedbacks(prev => [newFb, ...prev]);
        addToast('Feedback sent! Thank you.', 'success');
      }
      setFbForm({ subject: '', message: '', rating: 5 });
    } catch { addToast('Failed to submit feedback.', 'error'); }
    finally { setFbLoading(false); }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await feedbackService.delete(id);
      setMyFeedbacks(prev => prev.filter(f => f._id !== id));
      addToast('Feedback deleted.', 'success');
    } catch { addToast('Failed to delete.', 'error'); }
  };

  const startEditFeedback = (fb) => {
    setEditingFb(fb);
    setFbForm({ subject: fb.subject, message: fb.message, rating: fb.rating || 5 });
  };

  // ── Logout ────────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-update'));
    addToast('Logged out successfully', 'info');
    navigate('/');
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-10 h-10 border-2 rounded-full border-primary border-t-transparent animate-spin" />
    </div>
  );

  // ── TAB: Profile ──────────────────────────────────────────────────────────────
  const TabProfile = () => (
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
            <InfoRow icon={Zap} label="Total translations" value={history.length} accent />
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

  // ── TAB: Appearance ───────────────────────────────────────────────────────────
  const TabAppearance = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your profile picture.</p>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            {avatarPreview ? (
              <img src={avatarPreview} alt="preview" className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/40 shadow-xl" />
            ) : user.profile_picture ? (
              <img src={user.profile_picture} alt="current" className="w-28 h-28 rounded-full object-cover ring-4 ring-white dark:ring-gray-700 shadow-xl" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white ring-4 ring-white dark:ring-gray-700 shadow-xl">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
            {avatarPreview && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow">Preview</span>
            )}
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div>
              <p className="font-semibold text-gray-800 dark:text-white mb-0.5">
                {avatarPreview ? 'New image selected — review before saving' : user.profile_picture ? 'Current profile picture' : 'No profile picture set'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Accepted: JPG, PNG, GIF, WebP · Max: 5 MB</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => avatarInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-semibold shadow text-sm">
                <Camera className="w-4 h-4" /> {user.profile_picture ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarPreview && (
                <>
                  <button onClick={handleAvatarUpload} disabled={avatarLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-500 transition font-semibold shadow text-sm disabled:opacity-60">
                    {avatarLoading
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Check className="w-4 h-4" />}
                    Save Photo
                  </button>
                  <button onClick={cancelAvatarPreview}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold text-sm">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </>
              )}
              {user.profile_picture && !avatarPreview && (
                <button onClick={handleAvatarRemove} disabled={avatarLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-200 dark:hover:bg-red-500/20 transition font-semibold text-sm">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-2"><Info className="w-4 h-4" /> Image Guidelines</p>
          <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Use a square image for best results (e.g., 400 × 400 px)</li>
            <li>Supported formats: JPEG, PNG, GIF, WebP</li>
            <li>Maximum file size: 5 MB</li>
            <li>Your image is stored securely and only visible to you</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // ── TAB: Security ─────────────────────────────────────────────────────────────
  const TabSecurity = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Keep your account safe with a strong password.</p>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm space-y-5">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
          <KeyRound className="w-5 h-5 text-primary" /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <PasswordField label="Current Password" value={pwForm.current} show={showPw.current}
            onToggle={() => setShowPw(s => ({ ...s, current: !s.current }))}
            onChange={v => setPwForm(s => ({ ...s, current: v }))} placeholder="Enter current password" />

          <PasswordField label="New Password" value={pwForm.newPw} show={showPw.newPw}
            onToggle={() => setShowPw(s => ({ ...s, newPw: !s.newPw }))}
            onChange={v => setPwForm(s => ({ ...s, newPw: v }))} placeholder="Enter new password" />

          {pwForm.newPw && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                    style={{ backgroundColor: i <= strength.score ? strength.color : '#e5e7eb' }} />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}

          <PasswordField label="Confirm New Password" value={pwForm.confirm} show={showPw.confirm}
            onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
            onChange={v => setPwForm(s => ({ ...s, confirm: v }))} placeholder="Confirm new password" />

          {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
            <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Passwords do not match</p>
          )}
          {pwForm.confirm && pwForm.newPw === pwForm.confirm && pwForm.confirm.length >= 8 && (
            <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Passwords match</p>
          )}

          <button type="submit" disabled={pwLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-semibold shadow disabled:opacity-60">
            {pwLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
            {pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg mb-4">
          <BookOpen className="w-5 h-5 text-primary" /> Password Rules & Best Practices
        </h3>
        <ul className="space-y-2">
          {[
            { rule: 'Minimum 8 characters long', tip: false },
            { rule: 'At least one uppercase letter (A–Z)', tip: false },
            { rule: 'At least one number (0–9)', tip: false },
            { rule: 'At least one special character (e.g. @, #, !)', tip: false },
            { rule: 'Do not reuse your last 3 passwords', tip: true },
            { rule: 'Never share your password with anyone', tip: true },
            { rule: 'Use a password manager for stronger unique passwords', tip: true },
          ].map(({ rule, tip }) => (
            <li key={rule} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              {tip
                ? <Info className="w-4 h-4 text-blue-500  shrink-0 mt-0.5" />
                : <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              }
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg mb-4">
          <Shield className="w-5 h-5 text-primary" /> Active Session
        </h3>
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Current Session — Active</p>
            <p className="text-xs text-green-600 dark:text-green-300 mt-0.5">Signed in as {user.email}</p>
          </div>
          <button onClick={handleLogout} className="text-xs text-red-500 hover:underline font-semibold">Sign out</button>
        </div>
      </div>
    </div>
  );

  // ── TAB: History ──────────────────────────────────────────────────────────────
  const TabHistory = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Translation History</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{history.length} total translation{history.length !== 1 ? 's' : ''}</p>
        </div>
        {filteredHistory.length > 0 && (
          <button onClick={handleDeleteAll} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 bg-red-100 dark:bg-red-500/10 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition font-semibold">
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl gap-1 w-fit">
          {[{ id: 'all', label: 'All' }, { id: 'sign', label: 'Sign Mode' }, { id: 'text', label: 'Text Mode' }].map(f => (
            <button key={f.id} onClick={() => { setHistoryFilter(f.id); setSignSubFilter('all'); }}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition ${historyFilter === f.id ? 'bg-white dark:bg-gray-700 text-primary shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {historyFilter === 'sign' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap bg-indigo-50 dark:bg-[#1e293b]/60 p-1 rounded-xl gap-1 w-fit border border-indigo-100 dark:border-gray-700">
              {[{ id: 'all', label: 'All' }, { id: 'word', label: 'Word' }, { id: 'alphabet', label: 'Alphabet' }, { id: 'number', label: 'Number' }].map(sf => (
                <button key={sf.id} onClick={() => setSignSubFilter(sf.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${signSubFilter === sf.id ? 'bg-primary text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                  {sf.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        {loadingHistory ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No translations yet for this filter.</p>
            <button onClick={() => navigate('/translator')} className="mt-2 text-primary hover:underline text-sm">Start translating →</button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredHistory.slice(0, visibleCount).map(item => (
              <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
                className="relative p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary/40 group transition shadow-sm">
                <button onClick={() => handleDeleteItem(item._id)}
                  className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex flex-wrap items-center gap-2 mb-3 pr-8">
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{new Date(item.timestamp).toLocaleDateString()}</span>
                  <span className="text-xs font-semibold text-white bg-primary/80 px-2 py-0.5 rounded capitalize">{item.mode && item.mode !== 'text' ? item.mode : 'word'} Mode</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {getLangName(item.source_language || 'sign')} → {getLangName(item.target_language)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1"><p className="text-xs text-gray-500 mb-1">Original</p><p className="font-semibold text-gray-900 dark:text-white">{item.original_text}</p></div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition shrink-0" />
                  <div className="flex-1 text-right"><p className="text-xs text-gray-500 mb-1">Translated</p><p className="font-semibold text-primary">{item.translated_text}</p></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {filteredHistory.length > visibleCount && (
          <div className="flex justify-center pt-2">
            <button onClick={() => setVisibleCount(c => c + 6)}
              className="px-6 py-2 text-sm font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-primary hover:bg-primary/5 dark:hover:bg-gray-700 shadow transition active:scale-95">
              See More
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── TAB: Help & Support ───────────────────────────────────────────────────────
  const TabHelp = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Find answers and send us your feedback.</p>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg mb-4">
          <HelpCircle className="w-5 h-5 text-primary" /> Frequently Asked Questions
        </h3>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                {item.q}
                <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 ml-3 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <p className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-3">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg mb-4">
          <MessageSquare className="w-5 h-5 text-primary" /> {editingFb ? 'Edit Feedback' : 'Send Feedback'}
        </h3>
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <FormField label="Subject" icon={Info}>
            <input type="text" value={fbForm.subject} onChange={e => setFbForm(s => ({ ...s, subject: e.target.value }))}
              className="profile-input" placeholder="Brief subject…" required />
          </FormField>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Message</label>
            <textarea value={fbForm.message} onChange={e => setFbForm(s => ({ ...s, message: e.target.value }))}
              rows={4} className="profile-input resize-none" placeholder="Tell us how we can improve…" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setFbForm(s => ({ ...s, rating: n }))} className="transition-transform hover:scale-110">
                  <Star className={`w-6 h-6 ${n <= fbForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={fbLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-semibold shadow disabled:opacity-60">
              {fbLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {fbLoading ? 'Sending…' : editingFb ? 'Update Feedback' : 'Send Feedback'}
            </button>
            {editingFb && (
              <button type="button" onClick={() => { setEditingFb(null); setFbForm({ subject: '', message: '', rating: 5 }); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold">
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {myFeedbacks.length > 0 && (
        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> My Submitted Feedbacks
          </h3>
          {myFeedbacks.map(fb => (
            <div key={fb._id} className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{fb.subject}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{fb.message}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-3 h-3 ${n <= (fb.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEditFeedback(fb)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/10 transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteFeedback(fb._id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PANELS = { profile: TabProfile, appearance: TabAppearance, security: TabSecurity, history: TabHistory, help: TabHelp };
  const ActivePanel = PANELS[activeTab];

  // ── RENDER ────────────────────────────────────────────────────────────────────
  const currentNavItem = NAV_ITEMS.find(n => n.id === activeTab);
  const CurrentIcon = currentNavItem?.icon;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0f1117] text-gray-900 dark:text-white transition-colors duration-300">

      {/* ═══════════════════════════════════════════════════════════
          SIDEBAR  —  desktop (md+), hidden on mobile
      ═══════════════════════════════════════════════════════════ */}
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm shrink-0"
      >
        {/* Brand — links to home */}
        <Link
          to="/"
          className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary/30 shrink-0 group-hover:scale-105 transition-transform duration-200">
            SB
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">SignBridge</p>
            <p className="text-[10px] text-gray-400">Account Settings</p>
          </div>
        </Link>

        {/* User card */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
            {user.profile_picture ? (
              <img src={user.profile_picture} alt="avatar"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shrink-0 shadow">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{user.username}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${activeTab === id
                  ? 'bg-primary/10 dark:bg-primary/15 text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === id ? 'text-primary' : ''}`} />
              <span className="flex-1 text-left">{label}</span>
              {activeTab === id && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* ═══════════════════════════════════════════════════════════
          MAIN AREA
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header bar */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm"
        >
          {/* Left: brand (mobile) / section title (desktop) */}
          <div className="flex items-center gap-3">
            {/* Mobile brand — links to home */}
            <Link to="/" className="md:hidden flex items-center gap-2.5 hover:opacity-80 transition-opacity duration-200 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
                SB
              </div>
              <span className="font-bold text-gray-900 dark:text-white">SignBridge</span>
            </Link>
            {/* Desktop section title */}
            <div className="hidden md:flex items-center gap-2.5">
              {CurrentIcon && <CurrentIcon className="w-5 h-5 text-primary" />}
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentNavItem?.label}
              </h1>
            </div>
          </div>

          {/* Right: theme & avatar on mobile */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 transition-colors rounded-full dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
            </button>
            {user.profile_picture ? (
              <img src={user.profile_picture} alt="avatar"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30 shadow" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Right: theme, stats, user on desktop */}
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 transition-colors rounded-full dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-gray-900 dark:text-white">{history.length}</span> translations
            </span>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
            {user.profile_picture ? (
              <img src={user.profile_picture} alt="avatar"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 shadow" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </motion.header>

        {/* Scrollable content — main panel */}
        <main className="flex-1 overflow-y-auto profile-panel-scroll">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <ActivePanel />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

      </div>

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM NAVIGATION  —  mobile only (md hidden)
      ═══════════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
            const shortLabel = label === 'Help & Support' ? 'Help' : label === 'Appearance' ? 'Look' : label;
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200 relative ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                  }`}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  />
                )}
                <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />
                <span className={`text-[10px] font-semibold leading-none transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {shortLabel}
                </span>
              </button>
            );
          })}
        </div>
        {/* iOS safe area */}
        <div className="h-safe-bottom bg-white dark:bg-gray-900" />
      </nav>

      {/* ── Global styles ──────────────────────────────────────── */}
      <style>{`
        /* Scrollbar for main panel */
        .profile-panel-scroll::-webkit-scrollbar { width: 4px; }
        .profile-panel-scroll::-webkit-scrollbar-track { background: transparent; }
        .profile-panel-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        .dark .profile-panel-scroll::-webkit-scrollbar-thumb { background: #374151; }

        /* Form inputs */
        .profile-input {
          width: 100%;
          padding: 0.6rem 0.85rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          color: #111827;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .profile-input:focus {
          border-color: var(--color-primary, #6366f1);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .dark .profile-input {
          background: #111827;
          border-color: #374151;
          color: #f9fafb;
        }
        .dark .profile-input:focus {
          border-color: var(--color-primary, #6366f1);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }

        /* iOS safe area for bottom nav */
        .h-safe-bottom { height: env(safe-area-inset-bottom, 0px); }

        /* Hide scrollbar on scrollable containers */
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Profile;