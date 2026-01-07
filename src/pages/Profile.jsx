import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Calendar, Edit2, Save, X, 
  LogOut, Clock, ArrowRight, Trash2, Camera, AlertCircle 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { featureService, authService } from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Edit Form State
  const [formData, setFormData] = useState({ username: '', email: '' });
  
  // Hidden File Input Reference
  const fileInputRef = useRef(null);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    console.log("👤 Loaded User:", parsedUser); // DEBUG: Check if user_id exists
    setUser(parsedUser);
    setFormData({ username: parsedUser.username, email: parsedUser.email });

    fetchHistory(parsedUser.user_id);
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
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this translation?")) return;

    try {
      await featureService.deleteHistory(itemId, user.user_id);
      setHistory(prevHistory => prevHistory.filter(item => item._id !== itemId));
    } catch (error) {
      alert("Failed to delete item.");
      console.error(error);
    }
  };

  // --- 3. UPDATE PROFILE TEXT ---
  const handleUpdateProfile = () => {
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    window.dispatchEvent(new Event('user-update'));
    alert("Profile details updated!");
  };

  // --- 4. HANDLE AVATAR UPLOAD (DEBUG VERSION) ---
  const handleImageClick = () => {
    console.log("📸 Avatar clicked, opening file dialog...");
    if (fileInputRef.current) {
        fileInputRef.current.click();
    } else {
        console.error("❌ File Input ref is missing!");
    }
  };

  const handleFileChange = async (event) => {
    console.log("📂 File input changed! Event triggered.");
    const file = event.target.files[0];
    
    if (!file) {
        console.log("❌ No file selected (user cancelled)");
        return;
    }

    console.log(`📄 File Selected: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Basic validation
   if (file.size > 5 * 1024 * 1024) { 
      alert("File is too big! Max 5MB."); // Update message too
      event.target.value = ""; 
      return;
    }

    try {
      if (!user.user_id) {
          throw new Error("User ID is missing from session. Please logout and login again.");
      }

      console.log("🚀 Sending upload request...");
      // Upload to Backend
      const response = await authService.uploadAvatar(user.user_id, file);
      console.log("✅ Server Response:", response);
      
      // Update State & LocalStorage
      const updatedUser = { ...user, profile_picture: response.url };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      window.dispatchEvent(new Event('user-update'));
      alert("✅ Profile picture updated successfully!");
    } catch (error) {
      console.error("❌ Upload failed:", error);
      alert(`❌ Failed to upload: ${error.message || "Unknown Error"}`);
    } finally {
        // IMPORTANT: Reset the input so you can select the same file again if needed
        event.target.value = "";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen text-white bg-gray-900">
      <Navbar />

      <main className="flex-grow w-full p-4 mx-auto md:p-8 max-w-7xl">
        
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start justify-between gap-4 mb-8 md:flex-row md:items-center"
        >
          <div>
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <p className="text-gray-400">Manage your account and view activity</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-400 transition-colors border rounded-lg bg-red-500/10 hover:bg-red-500/20 border-red-500/20"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* --- LEFT COLUMN: USER CARD --- */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="relative p-6 overflow-hidden bg-gray-800 border border-gray-700 shadow-xl rounded-2xl">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-purple-600 opacity-20" />
              
              <div className="relative flex flex-col items-center">
                
                {/* AVATAR SECTION */}
                <div className="relative cursor-pointer group" onClick={handleImageClick} title="Change Profile Picture">
                  {user.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      className="object-cover w-24 h-24 transition-opacity border-4 border-gray-800 rounded-full shadow-lg hover:opacity-90"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-24 h-24 text-3xl font-bold text-white bg-gray-700 border-4 border-gray-800 rounded-full shadow-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Hover Overlay Icon */}
                  <div className="absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 bg-black/50 group-hover:opacity-100">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* HIDDEN INPUT - MOVED HERE */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                
                {/* USER DETAILS */}
                {!isEditing ? (
                  <>
                    <h2 className="mt-4 text-2xl font-bold">{user.username}</h2>
                    <p className="mb-6 text-gray-400">{user.email}</p>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center w-full gap-2 px-4 py-2 transition-colors bg-gray-700 rounded-lg hover:bg-gray-600"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                  </>
                ) : (
                  <div className="w-full mt-4 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Username</label>
                        <input 
                            type="text" 
                            value={formData.username} 
                            onChange={(e) => setFormData({...formData, username: e.target.value})} 
                            className="w-full p-2 text-white bg-gray-900 border border-gray-600 rounded focus:border-primary focus:outline-none" 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                        <input 
                            type="email" 
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            className="w-full p-2 text-white bg-gray-900 border border-gray-600 rounded focus:border-primary focus:outline-none" 
                        />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleUpdateProfile} 
                        className="flex items-center justify-center flex-1 gap-2 py-2 text-white bg-green-600 rounded hover:bg-green-500"
                      >
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)} 
                        className="flex items-center justify-center flex-1 gap-2 py-2 text-white bg-gray-700 rounded hover:bg-gray-600"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-6 mt-8 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2 text-sm text-gray-400">
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Joined</span>
                  <span>Jan 2026</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Translations</span>
                  <span className="font-bold text-primary">{history.length}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* --- RIGHT COLUMN: HISTORY LIST --- */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-gray-700 bg-gray-800/50 backdrop-blur">
                <h3 className="flex items-center gap-2 text-xl font-bold">
                  <Clock className="w-5 h-5 text-primary" /> Translation History
                </h3>
              </div>
              
              <div className="flex-grow p-4 space-y-3 overflow-y-auto custom-scrollbar">
                {loadingHistory ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 border-2 rounded-full border-primary border-t-transparent animate-spin"></div>
                    </div>
                ) : (
                    <AnimatePresence>
                    {history.length === 0 ? (
                        <div className="mt-20 text-center text-gray-500">
                        <p>No translations yet.</p>
                        <button onClick={() => navigate('/translator')} className="mt-2 text-primary hover:underline">Start translating</button>
                        </div>
                    ) : (
                        history.map((item) => (
                        <motion.div 
                            key={item._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20, height: 0 }}
                            className="relative p-4 transition-colors border border-gray-700 bg-gray-900/50 rounded-xl hover:border-primary/50 group"
                        >
                            <button 
                            onClick={() => handleDeleteItem(item._id)}
                            className="absolute p-2 text-gray-600 transition-all rounded-lg opacity-0 top-4 right-4 hover:text-red-500 group-hover:opacity-100 hover:bg-gray-800"
                            title="Delete Item"
                            >
                            <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="flex items-start justify-between pr-8 mb-2">
                            <span className="px-2 py-1 text-xs text-gray-500 bg-gray-800 rounded">
                                {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {item.target_language.toUpperCase()}
                            </span>
                            </div>
                            <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <p className="mb-1 text-sm text-gray-400">Original Sign</p>
                                <p className="text-lg font-semibold text-white">{item.original_text}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-600 transition-colors group-hover:text-primary" />
                            <div className="flex-1 text-right">
                                <p className="mb-1 text-sm text-gray-400">Translated</p>
                                <p className="text-lg font-semibold text-primary">{item.translated_text}</p>
                            </div>
                            </div>
                        </motion.div>
                        ))
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