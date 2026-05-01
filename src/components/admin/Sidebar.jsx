import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, Settings, LogOut, Shield, MessageSquare, BookOpen, BarChart2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { theme } = useTheme();

  const navLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Admin Management', path: '/admin/admins', icon: UserCog },
    { name: 'Manage ASL Dictionary', path: '/admin/dictionary', icon: BookOpen },
    { name: 'Feedbacks', path: '/admin/feedbacks', icon: MessageSquare },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart2 },
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
        className={`fixed inset-y-0 left-0 z-50 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col bg-glass-heavy`}
      >
        <div className="flex items-center justify-center h-20 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
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
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-white/40 dark:bg-white/20 text-indigo-800 dark:text-indigo-200 shadow-lg border border-white/50 dark:border-white/20 backdrop-blur-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-white/10 hover:text-indigo-700 dark:hover:text-indigo-300'
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

        <div className="p-4 border-t border-white/20 dark:border-white/10">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 text-red-600 transition-all duration-200 dark:text-red-400 hover:bg-white/30 dark:hover:bg-white/10 rounded-xl group border border-transparent hover:border-red-500/30"
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
