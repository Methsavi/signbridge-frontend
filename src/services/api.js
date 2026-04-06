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

export const authService = {
  // OAuth login/register
  signInWithOAuth: (provider, successUrl, failureUrl) => {
    account.createOAuth2Session(provider, successUrl, failureUrl);
  },

  signInWithGoogle: (successUrl, failureUrl) => {
    account.createOAuth2Session('google', successUrl, failureUrl);
  },

  signInWithMicrosoft: (successUrl, failureUrl) => {
    account.createOAuth2Session('microsoft', successUrl, failureUrl);
  },

  // Login
  login: async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
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

      // Keep MongoDB users collection in sync with Appwrite-authenticated users.
      try {
        // Legacy backend schema expects username/email/password.
        await api.post('/users/register', {
          username: fullName,
          email,
          password,
        });
      } catch {
        // Fallback for newer schema variants that include explicit full_name/user_id.
        await api.post('/users/register', {
          user_id: user.$id,
          username: fullName,
          full_name: fullName,
          email,
          password,
        });
      }

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

      const imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

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

export default api;