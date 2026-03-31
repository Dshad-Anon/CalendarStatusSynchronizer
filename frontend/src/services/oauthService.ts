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
};