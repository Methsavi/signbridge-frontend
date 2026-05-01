import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { authService, adminService } from '../../services/api';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await authService.login(formData.email, formData.password);

      // Verify admin privileges using backend records
      const adminsResponse = await adminService.getAdmins();
      const adminList = adminsResponse.items || adminsResponse || [];
      const isAdmin = adminList.some(admin => admin.email === user.email && admin.role === 'Admin');

      if (!isAdmin) {
        await authService.logout();
        throw new Error('Access denied. You do not have administrative privileges.');
      }

      const adminUserSession = { ...user, is_admin_session: true };
      localStorage.setItem('user', JSON.stringify(adminUserSession));
      window.dispatchEvent(new Event('user-update'));

      // Navigate to admin dashboard
      navigate('/admin');
    } catch (err) {
      setError(err?.message || err?.detail || 'Invalid admin credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen text-slate-900 transition-colors duration-300 bg-slate-100 dark:text-white dark:bg-slate-950 font-sans">

      {/* Abstract Background for Admin Panel */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 transition-colors bg-white/50 border border-slate-200 rounded-lg backdrop-blur-md hover:bg-white/80 dark:text-slate-300 dark:bg-slate-900/50 dark:border-slate-800 dark:hover:bg-slate-800/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Site
        </button>
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center flex-grow px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-lg p-8 sm:p-10 transition-colors border shadow-2xl bg-glass border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl rounded-3xl"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
              className="flex items-center justify-center w-16 h-16 mx-auto mb-6 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl"
            >
              <ShieldCheck className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Admin Portal</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              SignBridge Administration Access
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 text-sm font-medium text-red-600 border rounded-xl bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Admin Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all border border-white/20 rounded-xl bg-white/50 focus:bg-white dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:text-sm"
                    placeholder="admin@signbridge.com"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Security Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    className="block w-full py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all border border-white/20 rounded-xl bg-white/50 focus:bg-white dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:text-sm"
                    placeholder="••••••••"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative flex items-center justify-center w-full px-4 py-4 text-sm font-bold text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:opacity-75 disabled:cursor-not-allowed group overflow-hidden shadow-lg shadow-indigo-600/20"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                "Authorize Access"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For authorized personnel only. All access attempts are logged.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminLogin;
