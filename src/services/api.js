import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  register: async (username, email, password) => {
    try {
      const response = await api.post('/users/register', { 
        username, 
        email, 
        password 
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // --- FIXED UPLOAD FUNCTION ---
  uploadAvatar: async (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.patch(`/users/${userId}/profile-picture`, formData, {
      headers: {
        // IMPORTANT: We set this to undefined (or null) to remove the default 'application/json'
        // This lets the browser automatically set 'multipart/form-data; boundary=...'
        'Content-Type': undefined 
      }
    });
    return response.data;
  }
};

export const featureService = {
  translate: async (text, targetLang) => {
    const response = await api.post('/features/translate', { 
      text, 
      target_lang: targetLang 
    });
    return response.data;
  },

  saveHistory: async (userId, original, translated, lang) => {
    const response = await api.post('/features/history', {
      user_id: userId,
      original_text: original,
      translated_text: translated,
      target_language: lang
    });
    return response.data;
  },

  getHistory: async (userId) => {
    const response = await api.get(`/features/history/${userId}`);
    return response.data;
  },

  deleteHistory: async (itemId, userId) => {
    const response = await api.delete(`/features/history/${itemId}`, {
      params: { user_id: userId }
    });
    return response.data;
  }
};

export default api;