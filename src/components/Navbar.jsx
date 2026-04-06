import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to load user
  const loadUser = async () => {
    const loggedUser = localStorage.getItem('user');

    if (loggedUser) {
      setUser(JSON.parse(loggedUser));
      return;
    }

    try {
      const currentUser = await authService.getUser();
      localStorage.setItem('user', JSON.stringify(currentUser));
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  // Listen for login/logout/update events
  useEffect(() => {
    void loadUser(); // Load on mount

    // Listen for custom "user-update" event (triggered by Profile/Login pages)
    window.addEventListener('user-update', loadUser);
    
    return () => {
      window.removeEventListener('user-update', loadUser);
    };
  }, [location]); // Also check when URL changes

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore session cleanup failures and continue clearing local state.
    }

    localStorage.removeItem('user');
    setUser(null);
    setIsProfileOpen(false);
    window.dispatchEvent(new Event('user-update'));
    navigate('/');
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="sticky top-4 z-[100] px-4 md:px-8 w-full mb-6">
      <nav className={`mx-auto max-w-7xl bg-indigo-50/90 dark:bg-gray-900/80 backdrop-blur-xl border border-indigo-100 dark:border-gray-700 shadow-xl transition-all duration-300 ${isOpen ? 'rounded-2xl' : 'rounded-full'}`}>
        <div className="px-4 mx-auto sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 gap-2">
              <Globe className="w-8 h-8 text-primary" />
              <Link to="/" className="text-xl font-bold tracking-wide text-gray-900 sm:text-2xl dark:text-white transition-colors duration-300" onClick={closeMenu}>
                SignBridge<span className="text-primary">AI</span>
              </Link>
            </div>

          {/* Desktop Menu (Centered Pill) */}
          <div className="absolute hidden -translate-x-1/2 left-1/2 md:flex items-center justify-center pointer-events-auto">
            <div className="flex items-center p-1 space-x-1 border border-gray-200 rounded-full bg-gray-100/50 dark:bg-gray-800/40 dark:border-gray-700/50 backdrop-blur-md">
              {['Home', 'Translator', 'Dictionary', 'About'].map((item) => (
                <Link 
                  key={item}
                  to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                  className="px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition-all rounded-full hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section (Auth & Theme) */}
          <div className="items-center hidden space-x-4 md:flex ml-auto">
            {/* Theme Toggle Button Desktop */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 transition-colors rounded-full dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>

            {/* AUTH SECTION */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-2 py-1 transition-colors border border-gray-200 rounded-full bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
                >
                  {user.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Avatar" 
                      className="object-cover w-8 h-8 border border-gray-300 rounded-full dark:border-gray-600"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 font-bold text-white rounded-full bg-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <span className="pr-2 font-medium">{user.username}</span>
                  <ChevronDown className="w-4 h-4 mr-1" />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 w-48 py-1 mt-2 overflow-hidden bg-white border border-gray-200 shadow-xl dark:bg-gray-800 dark:border-gray-700 rounded-2xl"
                    >
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      >
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-red-500 transition-colors dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-300"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="px-5 py-2 text-sm font-medium text-gray-700 transition-colors border border-gray-200 rounded-full dark:text-gray-300 hover:text-gray-900 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white">
                  Sign In
                </Link>
                <Link to="/register" className="px-5 py-2 text-sm font-bold text-white transition-transform transform rounded-full shadow-lg bg-primary hover:bg-indigo-600 hover:scale-105 shadow-indigo-500/30">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Button and Theme Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 transition-colors rounded-full dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
        {isOpen && (
          <div className="bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700 md:hidden transition-all duration-300 rounded-b-2xl overflow-hidden shadow-xl">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* NEW: Added 'Dictionary' to the mobile navigation array */}
              {['Home', 'Translator', 'Dictionary', 'About'].map((item) => (
                <Link 
                  key={item}
                  to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                  onClick={closeMenu}
                  className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 rounded-md hover:text-primary hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                >
                  {item}
                </Link>
              ))}
              <div className="pt-2 my-2 border-t border-gray-200 dark:border-gray-800 transition-colors">
                {user ? (
                  <>
                    <Link to="/profile" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 rounded-md hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                      {user.profile_picture ? (
                        <img src={user.profile_picture} className="w-6 h-6 rounded-full" alt="avatar" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                      My Profile
                    </Link>
                    <button onClick={handleLogout} className="flex items-center w-full gap-2 px-3 py-2 text-base font-medium text-left text-red-500 dark:text-red-400 rounded-md hover:text-red-600 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-gray-800 transition-colors">
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMenu} className="block px-3 py-2 font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Login</Link>
                    <Link to="/register" onClick={closeMenu} className="block px-3 py-2 font-bold rounded-md text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;