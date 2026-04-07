import User from "../models/User";
import logger from "../utils/logger";
import { processUnreadEmails } from "./emailService";

export const monitorUserEmails = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.googleTokens?.accessToken) {
    throw new Error("Google account not connected");
  }

  if (!user.emailAutoReply?.enabled) {
    logger.info(`Auto-reply disabled for user ${userId}`);
    return;
  }

  if (user.emailAutoReply.untilTime && new Date() > user.emailAutoReply.untilTime) {
    user.emailAutoReply.enabled = false;
    await user.save();
    logger.info(`Auto-reply expired and disabled for user ${userId}`);
    return;
  }

  await processUnreadEmails(user);
};

export const monitorAllUsersEmails = async (): Promise<void> => {
  const users = await User.find({
    "emailAutoReply.enabled": true,
    "googleTokens.accessToken": { $exists: true, $ne: null }
  });

  for (const user of users) {
    try {
      await monitorUserEmails(user._id.toString());
    } catch (error: any) {
      logger.error(`Email monitor failed for user ${user._id}:`, error);
    }
  }
};
