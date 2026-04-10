import api from './api';

export const oauthService = {
  getGoogleLoginAuthUrl: async () => {
    const response = await api.get('/auth/google/login');
    return response.data.authUrl;
  },

  getGoogleCalendarAuthUrl: async () => {
    const response = await api.get('/oauth/google/calendar');
    return response.data.authUrl;
  },
  handleGoogleCallback: async (code: string) => {
    const response = await api.get(`/oauth/google/callback?code=${code}`);
    return response.data;
  },

  disconnectGoogle: async () => {
    const response = await api.delete('/oauth/google');
    return response.data;
  },

};