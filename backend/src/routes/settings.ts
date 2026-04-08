import express, { type Response, type Router } from "express";
import { body, validationResult } from "express-validator";
import { type AuthRequest, authenticate } from "../middleware/auth";
import User from "../models/User";
import { monitorUserEmails } from "../services/emailMonitorService";
import { disableEmailAutoReply, setEmailAutoReply } from "../services/emailService";

const router: Router = express.Router();

/**
 * @route PATCH /email
 * @description Update email configuration settings for the authenticated user
 * @param {Object} req - Express request object with authenticated user
 * @param {string} [req.body.enabled] - Boolean to enable/disable email monitoring
 * @param {string} [req.body.autoReplyMessage] - Custom auto-reply message text
 * @param {Response} res - Express response object
 * @returns {Object} Success response with updated emailConfig
 * @throws Error codes
 */
router.patch(
  "/email",
  authenticate,
  [body("enabled").isBoolean().optional(), body("autoReplyMessage").isString().optional()],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const { enabled, autoReplyMessage } = req.body;

      const user = await User.findById(req.user._id);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (enabled !== undefined) {
        user.emailConfig.enabled = enabled;
      }

      if (autoReplyMessage !== undefined) {
        user.emailConfig.autoReplyMessage = autoReplyMessage;
      }

      await user.save();

      res.json({
        message: "Email configuration updated",
        emailConfig: user.emailConfig
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route GET /email
 * @description Retrieve email configuration for the authenticated user
 * @param {Object} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Email configuration object
 * @throws error codes
 */
router.get("/email", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ emailConfig: user.emailConfig });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /email/auto-reply
 * @description Enable Gmail auto-reply for the authenticated user
 * @param {Object} req - Express request object with authenticated user
 * @param {string} req.body.subject - Auto-reply subject line (required)
 * @param {string} req.body.message - Auto-reply message body (required)
 * @param {string} [req.body.untilTime] - ISO8601 datetime to disable auto-reply automatically
 * @param {Response} res - Express response object
 * @returns {Object} Success response with emailAutoReply configuration
 * @throws error codes
 */
router.post(
  "/email/auto-reply",
  authenticate,
  [
    body("subject").isString().notEmpty(),
    body("message").isString().notEmpty(),
    body("untilTime").isISO8601().optional()
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const { subject, message, untilTime } = req.body;

      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!user.googleTokens?.accessToken) {
        res
          .status(400)
          .json({
            error: "Google account not connected. Please connect your Google account first."
          });
        return;
      }

      const until = untilTime ? new Date(untilTime) : undefined;
      await setEmailAutoReply(user, subject, message, until);

      res.json({
        message: "Gmail auto-reply enabled",
        emailAutoReply: user.emailAutoReply
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route DELETE /email/auto-reply
 * @description Disable Gmail auto-reply for the authenticated user
 * @param {Object} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Success message
 * @throws error codes
 */
router.delete(
  "/email/auto-reply",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      await disableEmailAutoReply(req.user._id.toString());

      res.json({ message: "Gmail auto-reply disabled" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route GET /email/auto-reply
 * @description Retrieve Gmail auto-reply settings for the authenticated user
 * @param {Object} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} emailAutoReply configuration and Google connection status
 * @throws error codes
 */
router.get(
  "/email/auto-reply",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        emailAutoReply: user.emailAutoReply,
        googleConnected: !!user.googleTokens?.accessToken
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route POST /email/check-now
 * @description Manually trigger email monitoring and auto-reply check for the authenticated user
 * @param {Object} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Success message indicating monitoring completion
 * @throws error codes
 */
router.post(
  "/email/check-now",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!user.googleTokens?.accessToken) {
        res.status(400).json({ error: "Google account not connected" });
        return;
      }

      if (!user.emailAutoReply?.enabled) {
        res.status(400).json({ error: "Auto-reply is not enabled" });
        return;
      }

      await monitorUserEmails(req.user._id.toString());

      res.json({ message: "Email monitoring completed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);


export default router;
