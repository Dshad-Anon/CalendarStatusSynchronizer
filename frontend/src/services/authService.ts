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
};