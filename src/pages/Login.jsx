import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';
import { authService, getReadableAuthError } from '../services/api';

const GoogleLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5a9.5 9.5 0 1 0 0 19c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.6H12z" />
    <path fill="#4285F4" d="M3.5 7.5l3.2 2.3C7.5 8.2 9.6 6.7 12 6.7c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5c-3.7 0-6.9 2.1-8.5 5z" />
    <path fill="#FBBC05" d="M12 21.5c2.5 0 4.6-.8 6.2-2.2l-2.9-2.4c-.8.6-1.9 1-3.3 1-2.9 0-5.3-1.9-6.2-4.6l-3.3 2.5c1.6 3.3 5 5.7 9.5 5.7z" />
    <path fill="#34A853" d="M3.5 16.5l3.3-2.5c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.5 7.5C2.8 8.9 2.5 10.4 2.5 12s.3 3.1 1 4.5z" />
  </svg>
);

const MicrosoftLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="9" height="9" fill="#F25022" />
    <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
    <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
    <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
  </svg>
);

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_error') === '1') {
      setError('Google sign-in failed. Please check Appwrite OAuth settings and try again.');
    }

    const syncOAuthSession = async () => {
      try {
        const user = await authService.handleOAuthCallback();
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-update'));
        navigate('/');
      } catch {
        // No active session yet; user can continue normal login.
      }
    };

    void syncOAuthSession();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await authService.login(formData.email, formData.password);
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('user-update'));
      navigate('/');
    } catch (err) {
      setError(err?.message || err?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    const successUrl = `${window.location.origin}/login?oauth=1&provider=${encodeURIComponent(provider)}`;
    const failureUrl = `${window.location.origin}/login?oauth_error=1&provider=${encodeURIComponent(provider)}`;

    setError('');

    try {
      if (provider === 'google') {
        await authService.signInWithGoogle(successUrl, failureUrl);
        return;
      }

      await authService.signInWithOAuth(provider, successUrl, failureUrl);
    } catch (err) {
      setError(getReadableAuthError(err));
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL — Video Animation
      ═══════════════════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col overflow-hidden">
        {/* Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/LoginAnimation.webm"
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Dark gradient overlay so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-gray-900/60 to-purple-900/70" />

        {/* Top-left brand */}
        <div className="relative z-10 p-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>

        {/* Centred branding */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Logo mark */}
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C13.18 6.04 14 7.7 14 9.5c0 3.5-2.686 6.364-6 6.364a6.318 6.318 0 01-3.334-.958" />
              </svg>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white mb-4 leading-tight">
              Sign<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Bridge</span> AI
            </h1>
            <p className="text-lg text-white/70 max-w-sm leading-relaxed">
              Real-time sign language translation powered by advanced computer vision.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {['✋ Real-Time Detection', '🌐 Multi-Language', '🔊 Sign-to-Speech'].map((feat) => (
              <span
                key={feat}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 backdrop-blur-md border border-white/20 text-white/80"
              >
                {feat}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom caption */}
        <div className="relative z-10 p-8 text-center">
          <p className="text-white/40 text-xs">© 2026 SignBridge AI. All rights reserved.</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL — Login Form
      ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-gray-50 dark:bg-gray-900 overflow-y-auto">

        {/* Mobile: back link */}
        <div className="absolute top-4 left-4 lg:hidden">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
              className="flex items-center justify-center w-14 h-14 mb-5 bg-primary/10 dark:bg-primary/20 rounded-2xl shadow-lg shadow-primary/10"
            >
              <LogIn className="w-7 h-7 text-primary" />
            </motion.div>

            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sign in to access your translation history and more.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-3 mb-5 text-sm text-red-600 dark:text-red-400 border rounded-xl bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  onChange={handleChange}
                  className="block w-full py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  onChange={handleChange}
                  className="block w-full py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold text-white rounded-xl animate-gradient bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:300%_100%] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/30 mt-2 hover:shadow-primary/50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <span className="relative flex justify-center">
              <span className="px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase bg-gray-50 dark:bg-gray-900">
                Or continue with
              </span>
            </span>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all"
            >
              <GoogleLogo />
              Sign in with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('microsoft')}
              className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all"
            >
              <MicrosoftLogo />
              Sign in with Microsoft
            </button>
          </div>

          {/* Register link */}
          <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-indigo-400 transition-colors">
              Create new account
            </Link>
          </p>

        </motion.div>
      </div>

    </div>
  );
};

export default Login;
