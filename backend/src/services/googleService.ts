import { google } from "googleapis";
import { config } from "../config/config";
import User, { type IUser } from "../models/User";
import { decrypt, encrypt } from "../utils/encryption";
import logger from "../utils/logger";

// OAuth2 client for login flow (redirect to frontend after successful login)
export const loginOAuth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.loginRedirectUri
);

// OAuth client for calendar connection (redirects to the backend route after successful connection)
export const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

// Generate OAuth URL for login flow and calendar connection
export const getGoogleLoginAuthUrl = () => {
  return loginOAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ],
    prompt: "consent",
    state: "google_login"
  });
};

export const getGoogleAuthUrl = (state?: string) => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify"
    ],
    prompt: "consent",
    state
  });
};

// Exchange authorization code for access token and get user profile information
export const getTokensFromCode = async (code: string, isLogin = false) => {
  const client = isLogin ? loginOAuth2Client : oauth2Client;
  const { tokens } = await client.getToken(code);
  return tokens;
};

export const getGoogleUserProfile = async (accessToken: string) => {
  const oauth2 = google.oauth2({
    auth: loginOAuth2Client,
    version: "v2"
  });

  loginOAuth2Client.setCredentials({ access_token: accessToken });

  const { data } = await oauth2.userinfo.get();

  return {
    googleId: data.id,
    email: data.email,
    name: data.name
  };
};

export const getGmailProfile = async (user: IUser) => {
  const auth = await getGoogleClient(user);
  const gmail = google.gmail({ version: "v1", auth });

  const response = await gmail.users.getProfile({
    userId: "me"
  });

  return response.data;
};

// Save Google tokens with encryption
export const saveGoogleTokens = async (userId: string, tokens: any): Promise<void> => {
  const accessToken = encrypt(tokens.access_token);
  const refreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
  const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));

  await User.findByIdAndUpdate(userId, {
    googleTokens: {
      accessToken,
      refreshToken,
      expiresAt
    }
  });
};

// Get Google client with token refresh handling
export const getGoogleClient = async (user: IUser) => {
  if (!user.googleTokens?.accessToken) {
    throw new Error("Google account not connected");
  }

  const accessToken = decrypt(user.googleTokens.accessToken);
  const refreshToken = user.googleTokens.refreshToken
    ? decrypt(user.googleTokens.refreshToken)
    : null;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  // Check if token is expired and refresh if needed
  if (user.googleTokens.expiresAt && new Date() >= user.googleTokens.expiresAt) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await saveGoogleTokens(user._id.toString(), credentials);
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      logger.error("Failed to refresh Google token:", error);
      throw new Error("Failed to refresh Google token");
    }
  }

  return oauth2Client;
};

// Fetch calendar events
export const fetchCalendarEvents = async (user: IUser, timeMin?: Date, timeMax?: Date) => {
  const auth = await getGoogleClient(user);
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: (timeMin || new Date()).toISOString(),
    timeMax: timeMax?.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100
  });

  return response.data.items || [];
};

// Disconnect Google account
export const disconnectGoogle = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    googleTokens: null
  });
};

// Get Gmail messages
export const getGmailMessages = async (user: IUser, maxResults: number = 10, query?: string) => {
  const auth = await getGoogleClient(user);
  const gmail = google.gmail({ version: "v1", auth });

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: query || "is:unread"
  });

  return response.data.messages || [];
};

// Get Gmail message by ID
export const getGmailMessage = async (user: IUser, messageId: string) => {
  const auth = await getGoogleClient(user);
  const gmail = google.gmail({ version: "v1", auth });

  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full"
  });

  return response.data;
};

// Send Gmail message
export const sendGmailMessage = async (
  user: IUser,
  to: string,
  subject: string,
  message: string,
  inReplyTo?: string,
  references?: string
) => {
  const auth = await getGoogleClient(user);
  const gmail = google.gmail({ version: "v1", auth });

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${utf8Subject}`
  ];

  if (inReplyTo) {
    messageParts.push(`In-Reply-To: ${inReplyTo}`);
  }
  if (references) {
    messageParts.push(`References: ${references}`);
  }

  messageParts.push("");
  messageParts.push(message);

  const email = messageParts.join("\r\n");
  const encodedMessage = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage
    }
  });

  return response.data;
};

// Modify Gmail message (add/remove labels)
export const modifyGmailMessage = async (
  user: IUser,
  messageId: string,
  addLabelIds?: string[],
  removeLabelIds?: string[]
) => {
  const auth = await getGoogleClient(user);
  const gmail = google.gmail({ version: "v1", auth });

  const response = await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds,
      removeLabelIds
    }
  });

  return response.data;
};
