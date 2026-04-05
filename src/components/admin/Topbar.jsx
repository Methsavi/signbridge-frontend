import React from 'react';
import { Menu, Search, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Topbar = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden md:flex items-center relative group">
            <Search className="w-5 h-5 absolute left-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search administration..."
              className="pl-10 pr-4 py-2.5 w-64 lg:w-80 bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-5">
          <button
            onClick={toggleTheme}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-105"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-105">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Admin User</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Superadmin</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 ring-2 ring-white dark:ring-slate-800">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
