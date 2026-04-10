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
  try {
    const users = await User.find({
      "emailAutoReply.enabled": true,
      "googleTokens.accessToken": { $exists: true, $ne: null }
    });

    if (users.length === 0) {
      logger.info('No users with active email auto-reply found');
      return;
    }

    logger.info(`Monitoring emails for ${users.length} users`);

    // Process emails for each user
    for (const user of users) {
      try {
        // Check if auto-reply is still within time limit
        if (user.emailAutoReply?.untilTime && new Date() > user.emailAutoReply.untilTime) {
          // Auto-reply period has ended
          user.emailAutoReply.enabled = false;
          await user.save();
          logger.info(`Auto-reply expired for user ${user._id}, disabling`);
          continue;
        }

        await processUnreadEmails(user);
      } catch (error: any) {
        logger.error(`Failed to monitor emails for user ${user._id}:`, error);
        // Continue with next user
      }
    }

    logger.info('Email monitoring completed for all users');
  } catch (error: any) {
    logger.error('Failed to monitor user emails:', error);
    throw error;
  }
};
