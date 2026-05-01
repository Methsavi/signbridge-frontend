import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, UserPlus, AlertCircle, ArrowLeft, CheckCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { authService, getReadableAuthError } from '../../services/api';

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

const Register = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [isVerificationSuccess, setIsVerificationSuccess] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_error') === '1') {
      setError('Google sign-up failed. Please check Appwrite OAuth settings and try again.');
    }

    const syncOAuthSession = async () => {
      try {
        const user = await authService.handleOAuthCallback();
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-update'));
        navigate('/');
      } catch {
        // No active session yet; user can continue with registration.
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
    setSuccessMessage('');
    setIsVerificationSuccess(false);
    setIsLoading(true);

    try {
      const pending = await authService.register(formData.fullName, formData.email, formData.password);
      setPendingRegistration(pending);
      setSuccessMessage(pending.message || 'OTP sent to your email.');
    } catch (err) {
      setError(err?.message || err?.detail || 'Registration failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const user = await authService.verifyRegistrationOtp(
        pendingRegistration.userId,
        otp,
        formData.fullName,
        formData.email,
        formData.password
      );
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('user-update'));
      setIsVerificationSuccess(true);
      setSuccessMessage('Verification success');
    } catch (err) {
      setError(err?.message || err?.detail || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingRegistration) return;

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const data = await authService.resendRegistrationOtp(pendingRegistration.userId, formData.email);
      setPendingRegistration((prev) => ({ ...prev, userId: data.userId || prev.userId }));
      setSuccessMessage(data.message || 'A new OTP has been sent.');
    } catch (err) {
      setError(err?.message || err?.detail || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    const successUrl = `${window.location.origin}/register?oauth=1&provider=${encodeURIComponent(provider)}`;
    const failureUrl = `${window.location.origin}/register?oauth_error=1&provider=${encodeURIComponent(provider)}`;

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

  /* ── derive current step label & subtitle ─────────────────────── */
  const stepTitle = isVerificationSuccess
    ? 'You\'re all set!'
    : pendingRegistration
    ? 'Check your inbox'
    : 'Create your account';

  const stepSubtitle = isVerificationSuccess
    ? 'Your account has been verified successfully.'
    : pendingRegistration
    ? `Enter the verification code sent to ${formData.email}`
    : 'Join SignBridge to start communicating.';

  return (
    <div className="flex min-h-screen bg-gray-900 text-white overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL — Video Animation
      ═══════════════════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col overflow-hidden">
        {/* Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/RegisterAnimation.webm"
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-gray-900/60 to-indigo-900/70" />

        {/* Top-left back link */}
        <div className="relative z-10 p-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>

        {/* Centre branding */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Logo mark */}
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <UserPlus className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white mb-4 leading-tight">
              Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">SignBridge</span>
            </h1>
            <p className="text-lg text-white/70 max-w-sm leading-relaxed">
              Create your free account and start breaking communication barriers today.
            </p>
          </motion.div>

          {/* Steps / feature pills */}
          <motion.div
            className="mt-10 w-full max-w-xs space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {[
              { num: '01', label: 'Create your account' },
              { num: '02', label: 'Verify your email' },
              { num: '03', label: 'Start translating' },
            ].map((step) => (
              <div
                key={step.num}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20"
              >
                <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                  {step.num}
                </span>
                <span className="text-sm font-medium text-white/80">{step.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom caption */}
        <div className="relative z-10 p-8 text-center">
          <p className="text-white/40 text-xs">© 2026 SignBridge AI. All rights reserved.</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL — Register Form
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
          {/* ── Header ─────────────────────────────────────── */}
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
              className={`flex items-center justify-center w-14 h-14 mb-5 rounded-2xl shadow-lg ${
                isVerificationSuccess
                  ? 'bg-emerald-500/10 shadow-emerald-500/10'
                  : pendingRegistration
                  ? 'bg-amber-500/10 shadow-amber-500/10'
                  : 'bg-primary/10 shadow-primary/10'
              }`}
            >
              {isVerificationSuccess ? (
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              ) : pendingRegistration ? (
                <ShieldCheck className="w-7 h-7 text-amber-500" />
              ) : (
                <UserPlus className="w-7 h-7 text-primary" />
              )}
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={stepTitle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {stepTitle}
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {stepSubtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Error banner ────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 mb-5 text-sm text-red-600 dark:text-red-400 border rounded-xl bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Success (OTP sent) banner ────────────────────── */}
          <AnimatePresence>
            {successMessage && !isVerificationSuccess && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 mb-5 text-sm text-emerald-600 dark:text-emerald-400 border rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════════════════════════════════════════════
              STEP 3 — Verification Success
          ══════════════════════════════════════════════════ */}
          {isVerificationSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  Welcome aboard, {formData.fullName}! Your account is ready.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold text-white rounded-xl bg-primary hover:bg-indigo-600 transition-all shadow-lg shadow-primary/30"
              >
                Go to Home Page
              </button>
            </motion.div>
          ) : (
            /* ══════════════════════════════════════════════════
                STEP 1 & 2 — Registration form / OTP form
            ══════════════════════════════════════════════════ */
            <form
              className="space-y-5"
              onSubmit={pendingRegistration ? handleVerifyOtp : handleSubmit}
            >
              <AnimatePresence mode="wait">
                {!pendingRegistration ? (
                  /* STEP 1: Registration fields */
                  <motion.div
                    key="registration-fields"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Full Name */}
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Full name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <User className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                          name="fullName"
                          type="text"
                          required
                          autoComplete="name"
                          placeholder="Your full name"
                          onChange={handleChange}
                          className="block w-full py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="group">
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
                    <div className="group">
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
                          autoComplete="new-password"
                          placeholder="••••••••"
                          onChange={handleChange}
                          className="block w-full py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* STEP 2: OTP field */
                  <motion.div
                    key="otp-field"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Verification Code
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <ShieldCheck className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        value={otp}
                        placeholder="Enter OTP from email"
                        onChange={(e) => setOtp(e.target.value.trim())}
                        className="block w-full py-3 pl-11 pr-4 text-sm tracking-[0.25em] text-gray-900 dark:text-white placeholder-gray-400 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold text-white rounded-xl animate-gradient bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:300%_100%] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin" />
                ) : pendingRegistration ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify OTP
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </>
                )}
              </button>

              {/* Resend OTP */}
              {pendingRegistration && (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary hover:text-indigo-400 disabled:opacity-60 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend OTP
                </button>
              )}

              {/* OAuth — only on step 1 */}
              {!pendingRegistration && (
                <>
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <span className="relative flex justify-center">
                      <span className="px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase bg-gray-50 dark:bg-gray-900">
                        Or continue with
                      </span>
                    </span>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleOAuth('google')}
                      className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all"
                    >
                      <GoogleLogo />
                      Sign up with Google
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOAuth('microsoft')}
                      className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all"
                    >
                      <MicrosoftLogo />
                      Sign up with Microsoft
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* Sign in link */}
          <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-indigo-400 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

    </div>
  );
};

export default Register;