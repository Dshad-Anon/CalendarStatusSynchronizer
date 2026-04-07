import AutomationRule from "../models/AutomationRule";
import User, { type IUser } from "../models/User";
import logger from "../utils/logger";
import {
  getGmailMessage,
  getGmailMessages,
  modifyGmailMessage,
  sendGmailMessage
} from "./googleService";
import { logStatusUpdate } from "./statusUpdateService";

const getHeader = (headers: any[], name: string): string => {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
};

const shouldSkipAutoReply = (
  fromHeader: string,
  subjectHeader: string,
  headers: any[]
): boolean => {
  const subject = subjectHeader.toLowerCase();
  const from = fromHeader.toLowerCase();

  if (
    !from ||
    from.includes("noreply") ||
    from.includes("no-reply") ||
    from.includes("donotreply")
  ) {
    return true;
  }

  if (
    subject.includes("unsubscribe") ||
    subject.includes("promotion") ||
    subject.includes("newsletter")
  ) {
    return true;
  }

  if (getHeader(headers, "List-Unsubscribe")) {
    return true;
  }

  if (getHeader(headers, "List-Id")) {
    return true;
  }

  return false;
};

const getSenderEmail = (fromHeader: string): string => {
  const emailMatch = fromHeader.match(/<(.+?)>/) || fromHeader.match(/([^\s]+@[^\s]+)/);
  return emailMatch ? emailMatch[1] : fromHeader;
};

const findMatchingEmailRule = async (userId: string, subjectHeader: string) => {
  const subject = subjectHeader.toLowerCase();

  const rules = await AutomationRule.find({
    userId,
    enabled: true,
    "actions.type": "email_auto_reply"
  }).sort({ priority: -1 });

  return rules.find((rule) =>
    rule.conditions.every((c) => {
      if (c.type !== "title_contains") return false;
      const value = String(c.value).toLowerCase();
      if (c.operator === "equals") return subject === value;
      return subject.includes(value);
    })
  );
};

export const setEmailAutoReply = async (
  user: IUser,
  subject: string,
  message: string,
  untilTime?: Date
): Promise<void> => {
  user.emailAutoReply = {
    enabled: true,
    subject,
    message,
    untilTime,
    lastUpdated: new Date()
  };
  await user.save();
};

export const disableEmailAutoReply = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.emailAutoReply) {
    user.emailAutoReply.enabled = false;
    await user.save();
  }
};

export const sendGmailAutoReply = async (
  user: IUser,
  originalMessageId: string,
  replySubject: string,
  recipientEmail: string,
  replyMessage: string,
  untilTime?: Date
): Promise<void> => {
  const original = await getGmailMessage(user, originalMessageId);
  const headers = original.payload?.headers || [];
  const messageIdHeader = getHeader(headers, "Message-ID");
  const references = getHeader(headers, "References");

  const finalMessage = untilTime
    ? `${replyMessage}\n\nI will be available again at ${untilTime.toLocaleString()}.`
    : replyMessage;

  await sendGmailMessage(
    user,
    recipientEmail,
    replySubject,
    finalMessage,
    messageIdHeader || undefined,
    references ? `${references} ${messageIdHeader}` : messageIdHeader || undefined
  );

  // Mark original as read.
  await modifyGmailMessage(user, originalMessageId, undefined, ["UNREAD"]);
};

export const processUnreadEmails = async (user: IUser): Promise<void> => {
  if (!user.googleTokens?.accessToken || !user.emailAutoReply?.enabled) {
    return;
  }

  const messages = await getGmailMessages(user, 20, "is:unread in:inbox");
  if (!messages?.length) return;

  for (const message of messages) {
    if (!message.id) continue;

    try {
      const fullMessage = await getGmailMessage(user, message.id);
      const headers = fullMessage.payload?.headers || [];
      const fromHeader = getHeader(headers, "From");
      const subjectHeader = getHeader(headers, "Subject") || "No Subject";

      if (shouldSkipAutoReply(fromHeader, subjectHeader, headers)) {
        continue;
      }

      const matchingRule = await findMatchingEmailRule(user._id.toString(), subjectHeader);
      if (!matchingRule) continue;

      const emailAction = matchingRule.actions.find((a) => a.type === "email_auto_reply");
      if (!emailAction) continue;

      const senderEmail = getSenderEmail(fromHeader);
      const replySubject = emailAction.config.subject || `Re: ${subjectHeader}`;
      const replyMessage =
        emailAction.config.autoReplyMessage ||
        user.emailConfig.autoReplyMessage ||
        "I am currently unavailable and will respond as soon as possible.";

      await sendGmailAutoReply(
        user,
        message.id,
        replySubject,
        senderEmail,
        replyMessage,
        user.emailAutoReply?.untilTime
      );

      await logStatusUpdate({
        userId: user._id.toString(),
        platform: "email",
        action: "gmail_auto_reply_sent",
        ruleId: matchingRule._id.toString()
      });
    } catch (error: any) {
      logger.error(`Failed processing unread email for user ${user._id}:`, error);
      await logStatusUpdate(
        {
          userId: user._id.toString(),
          platform: "email",
          action: "gmail_auto_reply_failed"
        },
        true,
        error.message
      );
    }
  }
};
