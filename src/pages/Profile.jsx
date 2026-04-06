import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Calendar, Edit2, Save, X, 
  LogOut, Clock, ArrowRight, Trash2, Camera 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { featureService, authService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LANGUAGES } from '../components/LanguageSelector';

const Profile = () => {
  const navigate = useNavigate();
  const { addToast } = useToast(); // <--- Use the Hook
  
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [signSubFilter, setSignSubFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setVisibleCount(6);
  }, [historyFilter, signSubFilter, history]);

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

  const getLangName = (code) => {
    if (!code) return 'Unknown';
    if (code.toLowerCase() === 'sign') return 'Sign Language';
    if (code.toLowerCase() === 'auto') return 'Auto Detect';
    return LANGUAGES.find(l => l.code.toLowerCase() === code.toLowerCase())?.name || code.toUpperCase();
  };
  
  const [formData, setFormData] = useState({ username: '', email: '' });
  const fileInputRef = useRef(null);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = await authService.getUser();
        setUser(currentUser);
        setFormData({ username: currentUser.username, email: currentUser.email });
        localStorage.setItem('user', JSON.stringify(currentUser));
        window.dispatchEvent(new Event('user-update'));
        fetchHistory(currentUser.user_id);
      } catch (error) {
        console.error('Failed to load user session:', error);
        navigate('/login');
      }
    };

    void loadProfile();
  }, [navigate]);

  const fetchHistory = async (userId) => {
    try {
      setLoadingHistory(true);
      const data = await featureService.getHistory(userId);
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- 2. DELETE HISTORY ITEM ---
  const handleDeleteAll = async () => {
    if (filteredHistory.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete all ${historyFilter === 'all' ? '' : historyFilter + ' '}history items?`)) return;

    try {
      setLoadingHistory(true);
      await Promise.all(
        filteredHistory.map(item => featureService.deleteHistory(item._id, user.user_id))
      );
      
      const deletedIds = new Set(filteredHistory.map(item => item._id));
      setHistory(prev => prev.filter(item => !deletedIds.has(item._id)));
      
      addToast(`Deleted ${filteredHistory.length} items successfully`, "success");
    } catch (error) {
      addToast("Failed to delete some items", "error");
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    // We can stick with window.confirm for critical deletes, or build a custom modal later.
    // For now, let's keep confirm but use Toast for success.
    if (!window.confirm("Are you sure you want to delete this translation?")) return;

    try {
      await featureService.deleteHistory(itemId, user.user_id);
      setHistory(prevHistory => prevHistory.filter(item => item._id !== itemId));
      addToast("Item deleted successfully", "success"); // <--- Custom Toast
    } catch (error) {
      addToast("Failed to delete item", "error"); // <--- Custom Toast
      console.error(error);
    }
  };

  // --- 3. UPDATE PROFILE TEXT ---
  const handleUpdateProfile = () => {
    const saveProfile = async () => {
      try {
        const updatedUser = await authService.updateProfile(formData.username, formData.email);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
        window.dispatchEvent(new Event('user-update'));
        addToast('Profile details updated!', 'success');
      } catch (error) {
        console.error('Failed to update profile:', error);
        addToast('Failed to update profile.', 'error');
      }
    };

    void saveProfile();
  };

  // --- 4. HANDLE AVATAR UPLOAD ---
  const handleImageClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast("File is too big! Max 5MB.", "error"); // <--- Custom Toast
      event.target.value = "";
      return;
    }

    try {
      addToast("Uploading image...", "info"); // <--- Feedback while uploading
      
      const response = await authService.uploadAvatar(user.user_id, file);
      
      const updatedUser = { ...user, profile_picture: response.url };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event('user-update')); 
      
      addToast("Profile picture updated!", "success"); // <--- Custom Toast
    } catch (error) {
      console.error("Upload failed", error);
      addToast("Failed to upload image.", "error"); // <--- Custom Toast
    } finally {
        event.target.value = "";
    }
  };

  const handleLogout = () => {
    const logoutUser = async () => {
      try {
        await authService.logout();
      } catch {
        // Ignore logout cleanup failures.
      }

      localStorage.removeItem('user');
      window.dispatchEvent(new Event('user-update'));
      addToast('Logged out successfully', 'info');
      navigate('/');
    };

    void logoutUser();
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen text-gray-900 bg-gray-50 dark:text-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      <main className="flex-grow w-full p-4 mx-auto md:p-8 max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start justify-between gap-4 mb-8 md:flex-row md:items-center"
        >
          <div>
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account and view activity</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-400 transition-colors border rounded-lg bg-red-500/10 hover:bg-red-500/20 border-red-500/20"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </motion.div>

        {/* ... (The rest of the JSX is exactly the same as before) ... */}
        {/* Since the JSX logic didn't change, just the function calls, you can keep the grid layout below */}
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* USER CARD */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="relative p-6 overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl transition-colors">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-purple-600 opacity-20" />
              <div className="relative flex flex-col items-center">
                <div className="relative cursor-pointer group" onClick={handleImageClick} title="Change Profile Picture">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="object-cover w-24 h-24 transition-opacity border-4 border-white dark:border-gray-800 rounded-full shadow-lg hover:opacity-90" />
                  ) : (
                    <div className="flex items-center justify-center w-24 h-24 text-3xl font-bold text-gray-800 bg-gray-200 dark:text-white dark:bg-gray-700 border-4 border-white dark:border-gray-800 rounded-full shadow-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 bg-black/50 group-hover:opacity-100">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
                
                {!isEditing ? (
                  <>
                    <h2 className="mt-4 text-2xl font-bold">{user.username}</h2>
                    <p className="mb-6 text-gray-600 dark:text-gray-400">{user.email}</p>
                    <button onClick={() => setIsEditing(true)} className="flex items-center justify-center w-full gap-2 px-4 py-2 transition-colors text-gray-800 bg-gray-200 dark:text-white dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                      <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                  </>
                ) : (
                  <div className="w-full mt-4 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Username</label>
                        <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full p-2 text-gray-900 bg-gray-50 border border-gray-300 dark:text-white dark:bg-gray-900 dark:border-gray-600 rounded focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2 text-gray-900 bg-gray-50 border border-gray-300 dark:text-white dark:bg-gray-900 dark:border-gray-600 rounded focus:border-primary focus:outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleUpdateProfile} className="flex items-center justify-center flex-1 gap-2 py-2 text-white bg-green-600 rounded hover:bg-green-500"><Save className="w-4 h-4" /> Save</button>
                      <button onClick={() => setIsEditing(false)} className="flex items-center justify-center flex-1 gap-2 py-2 text-gray-800 bg-gray-200 hover:bg-gray-300 dark:text-white dark:bg-gray-700 rounded dark:hover:bg-gray-600"><X className="w-4 h-4" /> Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-6 mt-8 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2 text-sm text-gray-600 dark:text-gray-400"><span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Joined</span><span>Jan 2026</span></div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400"><span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Translations</span><span className="font-bold text-primary">{history.length}</span></div>
              </div>
            </div>
          </motion.div>

          {/* HISTORY LIST */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col h-[600px] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur transition-colors">
                <div className="flex items-center gap-4">
                  <h3 className="flex items-center gap-2 text-xl font-bold"><Clock className="w-5 h-5 text-primary" /> History</h3>
                  {filteredHistory.length > 0 && (
                    <button 
                      onClick={handleDeleteAll}
                      className="px-2 py-1 text-xs text-red-500 bg-red-100 rounded hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors"
                    >
                      Delete All
                    </button>
                  )}
                </div>
                
                {/* Filter Tabs */}
                <div className="flex flex-col items-end gap-2 mt-4 sm:mt-0">
                  <div className="flex flex-wrap bg-gray-200/50 dark:bg-gray-900/50 p-1 rounded-lg gap-1 w-fit">
                    {[
                      { id: 'all', label: 'All' }, 
                      { id: 'sign', label: 'Sign Mode' }, 
                      { id: 'text', label: 'Text Mode' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => { setHistoryFilter(f.id); setSignSubFilter('all'); }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          historyFilter === f.id 
                            ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {historyFilter === 'sign' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }} 
                        animate={{ opacity: 1, y: 0, height: 'auto' }} 
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="flex flex-wrap bg-indigo-50/50 dark:bg-[#1e293b]/50 p-1 rounded-lg gap-1 w-fit border border-indigo-100/50 dark:border-gray-700/50"
                      >
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'word', label: 'Word' }, 
                          { id: 'alphabet', label: 'Alphabet' }, 
                          { id: 'number', label: 'Number' }
                        ].map(sf => (
                          <button
                            key={sf.id}
                            onClick={() => setSignSubFilter(sf.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                              signSubFilter === sf.id 
                                ? 'bg-primary text-white shadow-sm' 
                                : 'text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            {sf.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex-grow p-4 space-y-3 overflow-y-auto custom-scrollbar">
                {loadingHistory ? (
                    <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 rounded-full border-primary border-t-transparent animate-spin"></div></div>
                ) : (
                    <AnimatePresence>
                    {filteredHistory.length === 0 ? (
                        <div className="mt-20 text-center text-gray-500"><p>No translations yet for this mode.</p><button onClick={() => navigate('/translator')} className="mt-2 text-primary hover:underline">Start translating</button></div>
                    ) : (
                      <>
                        {filteredHistory.slice(0, visibleCount).map((item) => (
                        <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }} className="relative p-4 transition-colors border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:border-primary/50 group">
                            <button onClick={() => handleDeleteItem(item._id)} className="absolute p-2 text-gray-500 transition-all rounded-lg opacity-0 top-4 right-4 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800"><Trash2 className="w-4 h-4" /></button>
                            <div className="flex items-start justify-between pr-8 mb-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-1 text-xs text-gray-700 bg-gray-200 dark:text-gray-400 dark:bg-gray-800 rounded">{new Date(item.timestamp).toLocaleDateString()}</span>
                                <span className="px-2 py-1 text-xs font-medium text-white bg-primary/80 rounded capitalize">{item.mode && item.mode !== 'text' ? item.mode : 'word'} Mode</span>
                                <span className="px-2 py-1 text-xs text-gray-700 bg-gray-200 dark:text-gray-400 dark:bg-gray-800 rounded font-medium">
                                  {getLangName(item.source_language || 'sign')} → {getLangName(item.target_language)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                            <div className="flex-1"><p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Original Sign</p><p className="text-lg font-semibold text-gray-900 dark:text-white">{item.original_text}</p></div>
                            <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-600 transition-colors group-hover:text-primary" />
                            <div className="flex-1 text-right"><p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Translated</p><p className="text-lg font-semibold text-primary">{item.translated_text}</p></div>
                            </div>
                        </motion.div>
                        ))}
                        {filteredHistory.length > visibleCount && (
                          <div className="flex justify-center pt-4 pb-2">
                            <button 
                              onClick={() => setVisibleCount(prev => prev + 6)}
                              className="px-6 py-2 text-sm font-semibold transition-all bg-white border shadow-sm text-primary border-primary/20 dark:bg-gray-800 dark:border-gray-700 rounded-full hover:bg-primary/5 dark:hover:bg-gray-700 active:scale-95"
                            >
                              See More
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;