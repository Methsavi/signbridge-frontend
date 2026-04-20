import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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

  return (
    <div className="relative flex flex-col min-h-screen text-gray-900 transition-colors duration-300 bg-gray-50 dark:text-white dark:bg-gray-900">
      {/* Background Blobs moved to absolutely positioned container so they don't affect Navbar styling/positioning */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
      </div>

      <Navbar />
      
      <main className="relative z-10 flex items-center justify-center flex-grow px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md p-8 space-y-8 transition-colors border border-indigo-100 shadow-2xl bg-indigo-50/90 dark:bg-gray-800/50 dark:border-gray-700 backdrop-blur-lg rounded-2xl"
        >
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-secondary/20 rounded-xl"
            >
              <UserPlus className="w-6 h-6 text-secondary" />
            </motion.div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isVerificationSuccess ? 'Verification Success' : pendingRegistration ? 'Verify Email OTP' : 'Create Account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isVerificationSuccess
                ? 'Your account has been verified successfully.'
                : pendingRegistration
                ? `Enter the OTP sent to ${formData.email}`
                : 'Join SignBridge to start communicating'}
            </p>
          </div>

          {!isVerificationSuccess ? (
          <form className="mt-8 space-y-6" onSubmit={pendingRegistration ? handleVerifyOtp : handleSubmit}>
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

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 text-sm text-green-200 border rounded-lg bg-green-500/10 border-green-500/50"
              >
                {successMessage}
              </motion.div>
            )}
            
            <div className="space-y-4">
              {!pendingRegistration ? (
                <>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <User className="w-5 h-5 text-gray-500 transition-colors group-focus-within:text-primary" />
                    </div>
                    <input
                      name="fullName"
                      type="text"
                      required
                      className="block w-full py-3 pl-10 pr-3 leading-5 text-gray-900 placeholder-gray-400 transition-all border border-gray-300 rounded-lg bg-white/50 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-600 dark:bg-gray-900/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                      placeholder="Full name"
                      onChange={handleChange}
                    />
                  </div>

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
                </>
              ) : (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-500 transition-colors group-focus-within:text-primary" />
                  </div>
                  <input
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={otp}
                    className="block w-full py-3 pl-10 pr-3 leading-5 tracking-[0.2em] text-gray-900 placeholder-gray-400 transition-all border border-gray-300 rounded-lg bg-white/50 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-600 dark:bg-gray-900/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                    placeholder="Enter OTP"
                    onChange={(e) => setOtp(e.target.value.trim())}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-bold text-white transition-all border border-transparent rounded-lg group bg-primary hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
            >
               {isLoading ? (
                <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin" />
              ) : (
                pendingRegistration ? 'Verify OTP' : 'Sign Up'
              )}
            </button>

            {pendingRegistration && (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="w-full py-2 text-sm font-medium transition-colors text-primary hover:text-indigo-400 disabled:opacity-70"
              >
                Resend OTP
              </button>
            )}

            {!pendingRegistration && (
              <div className="space-y-3">
                <div className="relative text-center">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                  </div>
                  <span className="relative px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase bg-indigo-50 dark:bg-gray-800">
                    Or continue with
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-semibold text-gray-800 transition-colors bg-white border border-gray-300 rounded-lg dark:text-gray-100 dark:bg-gray-900/40 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <GoogleLogo />
                  Sign in with Google
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth('microsoft')}
                  className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-semibold text-gray-800 transition-colors bg-white border border-gray-300 rounded-lg dark:text-gray-100 dark:bg-gray-900/40 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MicrosoftLogo />
                  Sign in with Microsoft
                </button>
              </div>
            )}
          </form>
          ) : (
            <div className="mt-8 space-y-4">
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 text-sm text-green-200 border rounded-lg bg-green-500/10 border-green-500/50"
                >
                  {successMessage}
                </motion.div>
              )}

              <button
                type="button"
                onClick={() => navigate('/')}
                className="relative flex justify-center w-full px-4 py-3 text-sm font-bold text-white transition-all border border-transparent rounded-lg group bg-primary hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary"
              >
                Go to home page
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium transition-colors text-primary hover:text-indigo-400">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;