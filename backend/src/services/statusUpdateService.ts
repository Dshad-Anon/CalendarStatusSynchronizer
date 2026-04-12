import type { IAutomationRule } from "../models/AutomationRule";
import type { ICalendarEvent } from "../models/CalendarEvent";
import StatusLog from "../models/StatusLog";
import User, { type IUser } from "../models/User";
import logger from "../utils/logger";
import * as automationEngine from "./automationEngine";
import * as calendarSyncService from "./calendarSyncService";
import * as emailService from "./emailService";
import * as slackService from "./slackService";

interface StatusUpdate {
  userId: string;
  platform: "slack" | "email";
  action: string;
  eventId?: string;
  ruleId?: string;
}

export const logStatusUpdate = async (
  update: StatusUpdate,
  failed: boolean = false,
  errorMessage: string | null = null
): Promise<void> => {
  try {
    await StatusLog.create({
      userId: update.userId,
      platform: update.platform,
      eventId: update.eventId || null,
      ruleId: update.ruleId || null,
      action: update.action,
      status: failed ? "failed" : "success",
      errorMessage,
      metadata: {},
      timestamp: new Date()
    });
  } catch (error: any) {
    logger.error("Failed to write StatusLog:", error);
  }
};

const applyRuleActions = async (
  user: IUser,
  event: ICalendarEvent,
  rule: IAutomationRule
): Promise<void> => {
  for (const action of rule.actions) {
    try {
      switch (action.type) {
        case "slack_status": {
          if (!user.slackTokens?.accessToken) break;

          const statusText = action.config.statusText || event.summary;
          const statusEmoji = action.config.statusEmoji || ":calendar:";
          const expiration = Math.floor(event.endTime.getTime() / 1000);

          await slackService.updateSlackStatus(user, statusText, statusEmoji, expiration);

          await logStatusUpdate({
            userId: user._id.toString(),
            platform: "slack",
            action: "update_status",
            eventId: event._id.toString(),
            ruleId: rule._id.toString()
          });
          break;
        }

        case "email_auto_reply": {
          if (!user.emailConfig?.enabled) break;

          const subject = action.config.subject || `Re: ${event.summary}`;
          const autoReplyMessage =
            action.config.autoReplyMessage ||
            user.emailConfig.autoReplyMessage ||
            `I am in "${event.summary}" right now. I will reply soon.`;

          await emailService.setEmailAutoReply(user, subject, autoReplyMessage, event.endTime);

          await logStatusUpdate({
            userId: user._id.toString(),
            platform: "email",
            action: "auto_reply_enabled",
            eventId: event._id.toString(),
            ruleId: rule._id.toString()
          });
          break;
        }
      }
    } catch (error: any) {
      await logStatusUpdate(
        {
          userId: user._id.toString(),
          platform: action.type === "slack_status" ? "slack" : "email",
          action: action.type,
          eventId: event._id.toString(),
          ruleId: rule._id.toString()
        },
        true,
        error.message
      );
    }
  }
};

const applyDefaultStatus = async (user: IUser, event: ICalendarEvent): Promise<void> => {
  if (!user.slackTokens?.accessToken) return;

  const statusText = `In a meeting: ${event.summary}`;
  const expiration = Math.floor(event.endTime.getTime() / 1000);

  await slackService.updateSlackStatus(user, statusText, ":calendar:", expiration);

  await logStatusUpdate({
    userId: user._id.toString(),
    platform: "slack",
    action: "default_status",
    eventId: event._id.toString()
  });
};

export const processUserStatus = async (userId: string): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Refresh user's calendar cache before evaluating matching rules.
    await calendarSyncService.syncCalendar(userId);

    const currentEvents = await calendarSyncService.getCurrentEvents(userId);
    if (!currentEvents.length) {
      if (user.slackTokens?.accessToken) {
        await slackService.clearSlackStatus(user);
        await logStatusUpdate({
          userId,
          platform: "slack",
          action: "clear_status"
        });
      }
      return;
    }

    for (const event of currentEvents) {
      const rules = await automationEngine.findMatchingRules(userId, event);
      if (rules.length > 0) {
        await applyRuleActions(user, event, rules[0]);
      } else {
        await applyDefaultStatus(user, event);
      }
    }
  } catch (error: any) {
    logger.error(`Failed processing status for user ${userId}:`, error);
  }
};

export const processAllUsers = async (): Promise<void> => {
  const users = await User.find({
    $or: [
      { "slackTokens.accessToken": { $exists: true, $ne: null } },
      { "emailConfig.enabled": true }
    ]
  });

  for (const user of users) {
    await processUserStatus(user._id.toString());
  }
};
