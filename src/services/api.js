import axios from 'axios';
import { account, ID, normalizeUser } from '../lib/appwtite';

// The URL of your running FastAPI server
const API_URL = import.meta.env.VITE_API_URL;

// Create a configured axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getReadableAuthError = (error) => {
  const message = error?.response?.message || error?.message || 'Authentication failed.';

  if (String(message).includes('Precondition Failed') || error?.code === 412) {
    return 'Google authentication is not configured correctly in Appwrite. Please check Web platform and Google OAuth provider settings.';
  }

  return message;
};

export const authService = {
  // OAuth login/register
  signInWithOAuth: async (provider, successUrl, failureUrl) => {
    // Ensure the user can choose an account instead of silently reusing an existing Appwrite session.
    try {
      await account.deleteSession('current');
    } catch {
      // Ignore when no session exists.
    }

    account.createOAuth2Session(provider, successUrl, failureUrl);
  },

  signInWithGoogle: async (successUrl, failureUrl) => {
    try {
      await account.deleteSession('current');
    } catch {
      // Ignore when no session exists.
    }

    account.createOAuth2Session('google', successUrl, failureUrl);
  },

  signInWithMicrosoft: (successUrl, failureUrl) => {
    account.createOAuth2Session('microsoft', successUrl, failureUrl);
  },

  // Finalize OAuth callback and ensure the site account exists in backend.
  handleOAuthCallback: async () => {
    try {
      const user = await account.get();

      if (user?.emailVerification === false) {
        try {
          await account.deleteSession('current');
        } catch {
          // Ignore cleanup failure.
        }
        throw new Error('Your Google email is not verified. Please verify it in Google and try again.');
      }

      const normalized = normalizeUser(user);
      const username = normalized.username || user.name || user.email?.split('@')[0] || 'User';
      const email = normalized.email || user.email || '';

      // Keep user prefs consistent for profile pages and UI rendering.
      await account.updatePrefs({
        ...(user.prefs || {}),
        username,
        full_name: user.name || username,
        email,
        profile_picture: typeof user.prefs?.profile_picture === 'string' ? user.prefs.profile_picture : '',
      });

      // Sync OAuth users to backend users collection.
      // Backend register needs a password, so use a deterministic internal value for OAuth identities.
      if (email) {
        try {
          await api.post('/users/register', {
            username,
            email,
            password: `oauth-${user.$id}-google-signbridge`,
            appwrite_id: user.$id,  // Store Appwrite ID in MongoDB
          });
        } catch (syncError) {
          const detail = syncError?.response?.data?.detail;
          if (detail !== 'Email already registered') {
            throw syncError;
          }
        }
      }

      const refreshedUser = await account.get();
      return normalizeUser(refreshedUser);
    } catch (error) {
      throw error;
    }
  },

  // Login — also ensures the user exists in MongoDB (fallback sync)
  login: async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();

      // Fallback sync: if a user verified in Appwrite but MongoDB save failed,
      // we silently attempt to sync them now. This makes login resilient.
      try {
        await api.post('/users/register', {
          username: user.name || email.split('@')[0],
          email: user.email,
          password,          // re-use for MongoDB storage (hashed server-side)
          appwrite_id: user.$id,
        });
      } catch (syncError) {
        // 400 "Email already registered" is the normal case — user is already in MongoDB
        const status = syncError?.response?.status;
        if (status !== 400) {
          console.warn('Login-time MongoDB sync failed (non-fatal):', syncError?.response?.data?.detail);
        }
      }

      return normalizeUser(user);
    } catch (error) {
      throw error;
    }
  },

  // Start registration and send OTP email
  register: async (fullName, email, password) => {
    try {
      const createdUser = await account.create(ID.unique(), email, password, fullName);
      const token = await account.createEmailToken(createdUser.$id, email, false);

      return {
        userId: token.userId || createdUser.$id,
        email,
        fullName,
        message: 'Verification OTP sent to your email.',
      };
    } catch (error) {
      throw error;
    }
  },

  // Verify registration OTP and create session
  verifyRegistrationOtp: async (userId, otp, fullName, email, password) => {
    try {
      await account.createSession(userId, otp);
      const user = await account.get();

      await account.updatePrefs({
        username: fullName,
        full_name: fullName,
        email,
        profile_picture: '',
      });

      // ─── MANDATORY: Sync to MongoDB ───────────────────────────────────────
      // This MUST succeed before we consider registration complete.
      // If it fails (not a duplicate), we kill the Appwrite session and throw
      // so the user sees an error and can retry.
      try {
        await api.post('/users/register', {
          username: fullName,
          email,
          password,
          appwrite_id: user.$id,  // Store Appwrite user ID in MongoDB
        });
      } catch (syncError) {
        const detail = syncError?.response?.data?.detail;
        const status = syncError?.response?.status;
        // 400 "Email already registered" is fine (user already exists in MongoDB)
        if (status === 400 && detail === 'Email already registered') {
          // Already exists — no problem, continue
        } else {
          // Real backend error: kill the session and surface the error to user
          try { await account.deleteSession('current'); } catch { /* ignore */ }
          const msg = detail || syncError?.message || 'Failed to save account to database. Please try again.';
          throw new Error(msg);
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      const refreshedUser = await account.get();
      return normalizeUser(refreshedUser);
    } catch (error) {
      throw error;
    }
  },

  // Resend registration OTP
  resendRegistrationOtp: async (userId, email) => {
    try {
      const token = await account.createEmailToken(userId, email, false);
      return {
        userId: token.userId || userId,
        message: 'A new OTP has been sent to your email.',
      };
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {
      throw error;
    }
  },

  // Upload Avatar
  uploadAvatar: async (userId, file) => {
    try {
      const currentUser = await account.get();

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.patch(
        `/users/${encodeURIComponent(userId)}/profile-picture`,
        formData,
        {
          params: {
            email: currentUser.email,
          },
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const imageUrl = response?.data?.url;
      if (!imageUrl) {
        throw new Error('Profile image upload failed');
      }

      await account.updatePrefs({
        ...(currentUser.prefs || {}),
        profile_picture: imageUrl,
      });

      return { url: imageUrl };
    } catch (error) {
      throw error;
    }
  },

  // Get Fresh User Data (NEW)
  getUser: async () => {
    try {
      const user = await account.get();
      return normalizeUser(user);
    } catch (error) {
      throw error;
    }
  },

  // Update Profile
  updateProfile: async (username, email) => {
    try {
      const currentUser = await account.get();

      await account.updateName(username);
      await account.updatePrefs({
        ...(currentUser.prefs || {}),
        username,
        email,
      });

      const updatedUser = await account.get();
      return normalizeUser(updatedUser);
    } catch (error) {
      throw error;
    }
  }
};

export const featureService = {
  translate: async (text, targetLang, sourceLang = 'auto') => {
    const response = await api.post('/features/translate', { 
      text, 
      target_lang: targetLang,
      source_lang: sourceLang
    });
    return response.data;
  },

  saveHistory: async (userId, original, translated, lang, mode = 'word', sourceLang = 'sign') => {
    const response = await api.post('/features/history', {
      user_id: userId,
      original_text: `[${mode}|${sourceLang}]${original}`,
      translated_text: translated,
      target_language: lang,
      mode: mode // Kept for future backend compatibility
    });
    return response.data;
  },

  getHistory: async (userId) => {
    const response = await api.get(`/features/history/${userId}`);
    return response.data.map(item => {
      let parsedMode = item.mode;
      let parsedSource = parsedMode === 'text' ? 'auto' : 'sign';
      let text = item.original_text;
      
      const match = text?.match(/^\[(.*?)\](.*)/);
      if (match) {
        const metadata = match[1].split('|');
        parsedMode = metadata[0];
        if (metadata.length > 1) {
          parsedSource = metadata[1];
        } else {
          parsedSource = parsedMode === 'text' ? 'auto' : 'sign';
        }
        text = match[2] || '';
      }
      
      return {
        ...item,
        mode: parsedMode || 'text',
        source_language: parsedSource,
        original_text: text
      };
    });
  },

  deleteHistory: async (itemId, userId) => {
    const response = await api.delete(`/features/history/${itemId}`, {
      params: { user_id: userId }
    });
    return response.data;
  }
};

export const adminService = {
  getDashboardStats: async () => {
    const response = await api.get('/users/admin/dashboard-stats');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/users/admin/users', { params });
    return response.data;
  },

  createUser: async (payload) => {
    const response = await api.post('/users/admin/users', payload);
    return response.data;
  },

  updateUser: async (id, payload) => {
    const response = await api.put(`/users/admin/users/${encodeURIComponent(id)}`, payload);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/admin/users/${encodeURIComponent(id)}`);
    return response.data;
  },

  getAdmins: async (params = {}) => {
    const response = await api.get('/users/admin/admins', { params });
    return response.data;
  },

  createAdmin: async (payload) => {
    const response = await api.post('/users/admin/admins', payload);
    return response.data;
  },

  updateAdmin: async (id, payload) => {
    const response = await api.put(`/users/admin/admins/${encodeURIComponent(id)}`, payload);
    return response.data;
  },

  deleteAdmin: async (id) => {
    const response = await api.delete(`/users/admin/admins/${encodeURIComponent(id)}`);
    return response.data;
  }
};

export const feedbackService = {
  // User: submit new feedback
  submit: async (payload) => {
    const response = await api.post('/feedbacks/', payload);
    return response.data;
  },

  // User: get own feedbacks
  getMyFeedbacks: async (userId) => {
    const response = await api.get(`/feedbacks/user/${encodeURIComponent(userId)}`);
    return response.data;
  },

  // User: update own feedback
  update: async (feedbackId, payload) => {
    const response = await api.put(`/feedbacks/${encodeURIComponent(feedbackId)}`, payload);
    return response.data;
  },

  // User: delete own feedback
  delete: async (feedbackId) => {
    const response = await api.delete(`/feedbacks/${encodeURIComponent(feedbackId)}`);
    return response.data;
  },

  // Admin: list all feedbacks
  adminList: async (params = {}) => {
    const response = await api.get('/feedbacks/admin/all', { params });
    return response.data;
  },

  // Admin: get stats
  adminStats: async () => {
    const response = await api.get('/feedbacks/admin/stats');
    return response.data;
  },

  // Admin: delete any feedback
  adminDelete: async (feedbackId) => {
    const response = await api.delete(`/feedbacks/${encodeURIComponent(feedbackId)}`);
    return response.data;
  },
};

export { getReadableAuthError };

export const dictionaryService = {
  // Upload an image or video file, returns { url, media_type }
  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/dictionary/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Fetch all entries (optional: category filter & search)
  getEntries: async (params = {}) => {
    const response = await api.get('/dictionary/', { params });
    return response.data; // { items, count }
  },

  // Create a new entry (after media is uploaded)
  createEntry: async (payload) => {
    const response = await api.post('/dictionary/', payload);
    return response.data;
  },

  // Update an existing entry
  updateEntry: async (id, payload) => {
    const response = await api.put(`/dictionary/${encodeURIComponent(id)}`, payload);
    return response.data;
  },

  // Delete an entry
  deleteEntry: async (id) => {
    const response = await api.delete(`/dictionary/${encodeURIComponent(id)}`);
    return response.data;
  },
};

export default api;