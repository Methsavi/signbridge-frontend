import React, { useState, useEffect } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { authService } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedThemeToggler } from '../AnimatedThemeToggler';

const PAGE_TITLES = {
  '/admin':            { title: 'Dashboard Overview',    subtitle: "Welcome back. Here's what's happening today." },
  '/admin/analytics':  { title: 'Analytics',             subtitle: 'Real-time insights from your SignBridge platform.' },
  '/admin/users':      { title: 'User Management',       subtitle: 'Manage all registered users in the system.' },
  '/admin/admins':     { title: 'Admin Management',      subtitle: 'Manage administrators, roles and permissions.' },
  '/admin/dictionary': { title: 'ASL Dictionary',        subtitle: 'Add, edit and remove sign language entries.' },
  '/admin/feedbacks':  { title: 'Feedback Management',   subtitle: 'Review and manage all user-submitted feedback.' },
  '/admin/settings':   { title: 'Platform Settings',     subtitle: 'Configure global application settings and preferences.' },
};

const Topbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('user-update'));
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getInitial = () => user?.username?.charAt(0).toUpperCase() || 'A';

  const page = PAGE_TITLES[location.pathname] || { title: 'Admin Panel', subtitle: '' };

  return (
    <header className="sticky top-0 z-30 h-20 bg-glass-heavy border-b border-white/20 dark:border-white/10 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between h-full px-4 lg:px-8 gap-4">

        {/* Left: hamburger (mobile) + page title */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-white/10 rounded-xl lg:hidden transition-colors flex-shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                {page.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: theme toggle + user + logout */}
        <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
          <AnimatedThemeToggler className="p-2 text-slate-500 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-colors" />

          <div className="h-8 w-px bg-white/20 dark:bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {user?.username || 'Admin User'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Admin</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 ring-2 ring-white dark:ring-slate-800">
              {getInitial()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-red-500 hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Topbar;
