import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Palette, Shield, Clock, HelpCircle, LogOut, Sun, Moon, Zap } from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { featureService, authService } from '../../services/api';

import TabProfile from '../../components/profile/TabProfile';
import TabAppearance from '../../components/profile/TabAppearance';
import TabSecurity from '../../components/profile/TabSecurity';
import TabHistory from '../../components/profile/TabHistory';
import TabHelp from '../../components/profile/TabHelp';
import { AnimatedThemeToggler } from '../../components/AnimatedThemeToggler';

const NAV_ITEMS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'help', icon: HelpCircle, label: 'Help & Support' },
];

const Profile = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const mainScrollRef = useRef(null);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const userRef = useRef(null);

  const loadHistory = useCallback(async (userId) => {
    try {
      const data = await featureService.getHistory(userId);
      setHistory(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await authService.getUser();
        setUser(currentUser);
        userRef.current = currentUser;
        localStorage.setItem('user', JSON.stringify(currentUser));
        window.dispatchEvent(new Event('user-update'));

        setLoadingHistory(true);
        await loadHistory(currentUser.user_id);
      } catch {
        navigate('/login');
      } finally {
        setLoadingHistory(false);
      }
    };
    void load();
  }, [navigate, loadHistory]);

  useEffect(() => {
    const handleHistoryUpdated = () => {
      if (userRef.current?.user_id) loadHistory(userRef.current.user_id);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userRef.current?.user_id) {
        loadHistory(userRef.current.user_id);
      }
    };
    window.addEventListener('history-updated', handleHistoryUpdated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('history-updated', handleHistoryUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadHistory]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-update'));
    navigate('/');
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-10 h-10 border-2 rounded-full border-primary border-t-transparent animate-spin" />
    </div>
  );

  const PANELS = { 
    profile: <TabProfile user={user} setUser={setUser} historyLength={history.length} setActiveTab={setActiveTab} handleLogout={handleLogout} />, 
    appearance: <TabAppearance user={user} setUser={setUser} />, 
    security: <TabSecurity user={user} handleLogout={handleLogout} />, 
    history: <TabHistory user={user} history={history} setHistory={setHistory} loadingHistory={loadingHistory} />, 
    help: <TabHelp user={user} /> 
  };
  const ActivePanel = () => PANELS[activeTab];

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
            <AnimatedThemeToggler
              className="p-2 text-gray-500 transition-colors rounded-full dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            />
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
            <AnimatedThemeToggler
              className="p-2 text-gray-500 transition-colors rounded-full dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            />
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
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto profile-panel-scroll">
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
      <div className="md:hidden fixed bottom-5 left-4 right-4 z-50">
        <nav className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl p-1.5 overflow-hidden">
          <div className="flex items-center justify-between">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
              const shortLabel = label === 'Help & Support' ? 'Help' : label === 'Appearance' ? 'Look' : label;
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex flex-col items-center justify-center h-14 relative z-10 rounded-2xl transition-colors duration-300 ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  {/* Liquid active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="liquid-glass-indicator"
                      className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl -z-10 border border-primary/20 dark:border-primary/30 shadow-inner"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    animate={{ y: isActive ? -6 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Icon className="w-5 h-5 drop-shadow-sm" />
                  </motion.div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="text-[10px] font-bold absolute bottom-2"
                      >
                        {shortLabel}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </nav>
        {/* iOS safe area spacing */}
        <div className="h-safe-bottom" />
      </div>

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