import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, Settings, LogOut, Shield, MessageSquare, BookOpen } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { theme } = useTheme();

  const navLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Admin Management', path: '/admin/admins', icon: UserCog },
    { name: 'Manage ASL Dictionary', path: '/admin/dictionary', icon: BookOpen },
    { name: 'Feedbacks', path: '/admin/feedbacks', icon: MessageSquare },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 shadow-xl`}
      >
        <div className="flex items-center justify-center h-20 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 dark:bg-blue-400/10 rounded-xl">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text">
              SignBridge Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                end={link.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-400'
                  }`
                }
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 text-red-600 transition-all duration-200 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Exit Admin</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
