import api from './api';

export const authService = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  googleLogin: async (code: string) => {
    const response = await api.post('/auth/google/callback', { code });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (name: string) => {
    const response = await api.patch('/auth/me', { name });
    return response.data;
  },
};