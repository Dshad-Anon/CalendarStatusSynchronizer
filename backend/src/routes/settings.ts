import express, { type Response, type Router } from "express";
import { body, validationResult } from "express-validator";
import { type AuthRequest, authenticate } from "../middleware/auth";
import User from "../models/User";
import { monitorUserEmails } from "../services/emailMonitorService";
import { disableEmailAutoReply, setEmailAutoReply } from "../services/emailService";

const router: Router = express.Router();

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


export default router;
