import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to load user
  const loadUser = () => {
    const loggedUser = localStorage.getItem('user');
    if (loggedUser) {
      setUser(JSON.parse(loggedUser));
    } else {
      setUser(null);
    }
  };

  // Listen for login/logout/update events
  useEffect(() => {
    loadUser(); // Load on mount

    // Listen for custom "user-update" event (triggered by Profile/Login pages)
    window.addEventListener('user-update', loadUser);
    
    return () => {
      window.removeEventListener('user-update', loadUser);
    };
  }, [location]); // Also check when URL changes

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsProfileOpen(false);
    // Notify other components that user is gone
    window.dispatchEvent(new Event('user-update')); 
    navigate('/');
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 gap-2">
            <Globe className="w-8 h-8 text-primary" />
            <Link to="/" className="text-2xl font-bold tracking-wide text-white" onClick={closeMenu}>
              SignBridge<span className="text-primary">AI</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="items-center hidden space-x-8 md:flex">
            {/* NEW: Added 'Dictionary' to the navigation array */}
            {['Home', 'Translator', 'Dictionary', 'About'].map((item) => (
              <Link 
                key={item}
                to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className="px-3 py-2 font-medium text-gray-300 transition-colors rounded-md hover:text-white hover:bg-gray-800"
              >
                {item}
              </Link>
            ))}
            
            {/* AUTH SECTION */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white focus:outline-none"
                >
                  {user.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Avatar" 
                      className="object-cover w-8 h-8 border border-gray-600 rounded-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 font-bold text-white rounded-full bg-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <span className="font-medium">{user.username}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 w-48 py-1 mt-2 bg-gray-800 border border-gray-700 shadow-xl rounded-xl"
                    >
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-red-400 hover:bg-gray-700 hover:text-red-300"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login" className="px-3 py-2 font-medium text-gray-300 hover:text-white">
                  Login
                </Link>
                <Link to="/register" className="px-5 py-2 font-semibold text-white transition-transform transform rounded-lg shadow-lg bg-primary hover:bg-indigo-600 hover:scale-105 shadow-indigo-500/30">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="bg-gray-900 border-b border-gray-800 md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* NEW: Added 'Dictionary' to the mobile navigation array */}
            {['Home', 'Translator', 'Dictionary', 'About'].map((item) => (
              <Link 
                key={item}
                to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                onClick={closeMenu}
                className="block px-3 py-2 text-base font-medium text-gray-300 rounded-md hover:text-white hover:bg-gray-800"
              >
                {item}
              </Link>
            ))}
            <div className="pt-2 my-2 border-t border-gray-800">
              {user ? (
                <>
                  <Link to="/profile" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-base font-medium text-gray-300 rounded-md hover:text-white hover:bg-gray-800">
                    {user.profile_picture ? (
                      <img src={user.profile_picture} className="w-6 h-6 rounded-full" alt="avatar" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    My Profile
                  </Link>
                  <button onClick={handleLogout} className="flex items-center w-full gap-2 px-3 py-2 text-base font-medium text-left text-red-400 rounded-md hover:text-red-300 hover:bg-gray-800">
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu} className="block px-3 py-2 font-medium text-gray-300 rounded-md">Login</Link>
                  <Link to="/register" onClick={closeMenu} className="block px-3 py-2 font-bold rounded-md text-primary">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;