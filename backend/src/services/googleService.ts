import { config } from "../config/config";
import { google } from "googleapis";



// OAuth2 client for login flow( reditect to frontend after successful login)
export const loginOAuth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.loginRedirectUri
);

// OAuth client for calendar connection( redirects to the backend route after successful connection)
export const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

// Genrate OAuth URL for login flow and calendar connection 
export const getGoogleLoginAuthUrl = () => {
  return loginOAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });
};
  
export const getGoogleCalendarAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ],
    prompt: "consent",
  });
};

// Exchange authorization code for access token and get user profile information

export const getTokensFromCode = async(code:string, isLogin = false) => {
  const client = isLogin ? loginOAuth2Client : oauth2Client;
  const {tokens} = await client.getToken(code);
  return tokens;
}

export const getGoogleUserProfile = async (accessToken: string) => {
  const oauth2 = google.oauth2({
    auth : loginOAuth2Client,
    version: "v2",
  });

  loginOAuth2Client.setCredentials({ access_token: accessToken });

  const {data} = await oauth2.userinfo.get();

  return{
    googleId: data.id,
    email: data.email,
    name: data.name,
  };
};
