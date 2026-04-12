import { WebClient } from "@slack/web-api";
import axios from "axios";
import { config } from "../config/config";
import User, { type IUser } from "../models/User";
import { decrypt, encrypt } from "../utils/encryption";
import logger from "../utils/logger";

export const getAuthUrl = (): string => {
  const scopes = ["users.profile:write", "users:write"].join(",");

  return `https://slack.com/oauth/v2/authorize?client_id=${config.slack.clientId}&scope=${scopes}&redirect_uri=${config.slack.redirectUri}`;
};

export const exchangeCodeForTokens = async (code: string) => {
  const response = await axios.post("https://slack.com/api/oauth.v2.access", null, {
    params: {
      client_id: config.slack.clientId,
      client_secret: config.slack.clientSecret,
      code,
      redirect_uri: config.slack.redirectUri
    }
  });

  if (!response.data.ok) {
    throw new Error(response.data.error || "Failed to exchange code for tokens");
  }

  return response.data;
};

export const saveSlackTokens = async (userId: string, tokenData: any): Promise<void> => {
  const accessToken = encrypt(tokenData.authed_user.access_token);

  await User.findByIdAndUpdate(userId, {
    slackTokens: {
      accessToken,
      userId: tokenData.authed_user.id,
      teamId: tokenData.team.id,
      expiresAt: null
    }
  });
};

export const getSlackClient = async (user: IUser): Promise<WebClient> => {
  if (!user.slackTokens?.accessToken) {
    throw new Error("Slack account not connected");
  }

  const accessToken = decrypt(user.slackTokens.accessToken);
  return new WebClient(accessToken);
};

export const updateSlackStatus = async (
  user: IUser,
  statusText: string,
  statusEmoji: string = ":calendar:",
  expiration?: number
): Promise<void> => {
  try {
    const client = await getSlackClient(user);

    await client.users.profile.set({
      profile: {
        status_text: statusText,
        status_emoji: statusEmoji,
        status_expiration: expiration || 0
      }
    });

    logger.info(`Updated Slack status for user ${user._id}`);
  } catch (error: any) {
    logger.error("Failed to update Slack status:", error);
    throw error;
  }
};

export const clearSlackStatus = async (user: IUser): Promise<void> => {
  try {
    const client = await getSlackClient(user);

    await client.users.profile.set({
      profile: {
        status_text: "",
        status_emoji: "",
        status_expiration: 0
      }
    });

    logger.info(`Cleared Slack status for user ${user._id}`);
  } catch (error: any) {
    logger.error("Failed to clear Slack status:", error);
    throw error;
  }
};

export const disconnectSlack = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    slackTokens: null
  });
};
