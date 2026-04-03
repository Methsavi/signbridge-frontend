import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { authService } from '../services/api';

const Login = () => {
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
      const data = await authService.login(formData.email, formData.password);
      localStorage.setItem('user', JSON.stringify(data));
      window.dispatchEvent(new Event('user-update'));
      navigate('/');
    } catch (err) {
      setError(err.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-gray-900 bg-gray-50 dark:text-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      
      <main className="relative flex items-center justify-center flex-grow px-4 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md p-8 space-y-8 border shadow-2xl bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 backdrop-blur-lg rounded-2xl transition-colors"
        >
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary/20 rounded-xl"
            >
              <LogIn className="w-6 h-6 text-primary" />
            </motion.div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to access your translation history
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 text-sm text-red-200 border rounded-lg bg-red-500/10 border-red-500/50"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
            
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500 transition-colors group-focus-within:text-primary" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full py-3 pl-10 pr-3 leading-5 text-gray-900 placeholder-gray-400 transition-all border border-gray-300 rounded-lg bg-white/50 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-600 dark:bg-gray-900/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                  placeholder="Email address"
                  onChange={handleChange}
                />
              </div>
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500 transition-colors group-focus-within:text-primary" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="block w-full py-3 pl-10 pr-3 leading-5 text-gray-900 placeholder-gray-400 transition-all border border-gray-300 rounded-lg bg-white/50 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-600 dark:bg-gray-900/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                  placeholder="Password"
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-bold text-white transition-all border border-transparent rounded-lg group bg-primary hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium transition-colors text-primary hover:text-indigo-400">
                Register here
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;