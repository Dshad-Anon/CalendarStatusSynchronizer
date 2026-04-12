import { Router } from "express";
import jwt from "jsonwebtoken";
import { googleCallback, slackCallback } from "../controllers/oauthController";
import { config } from "../config/config";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";
import { disconnectGoogle, getGoogleAuthUrl } from "../services/googleService";
import { disconnectSlack, getAuthUrl as getSlackAuthUrl } from "../services/slackService";

const router = Router();

router.get("/google/calendar", authenticate, (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const state = jwt.sign(
    { userId: req.user._id.toString(), intent: "google_calendar_connect" },
    config.jwtSecret,
    { expiresIn: "15m" }
  );

  const authUrl = getGoogleAuthUrl(state);
  res.json({ authUrl });
});

router.get("/google/callback", googleCallback);

router.get("/slack", authenticate, (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const state = jwt.sign(
    { userId: req.user._id.toString(), intent: "slack_connect" },
    config.jwtSecret,
    { expiresIn: "15m" }
  );

  const authUrl = getSlackAuthUrl(state);
  res.json({ authUrl });
});

router.get("/slack/callback", slackCallback);

router.delete("/google", authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    await disconnectGoogle(req.user._id.toString());
    res.json({ message: "Google account disconnected" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to disconnect Google account";
    res.status(500).json({ error: message });
  }
});

router.delete("/slack", authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    await disconnectSlack(req.user._id.toString());
    res.json({ message: "Slack account disconnected" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to disconnect Slack account";
    res.status(500).json({ error: message });
  }
});

export default router;
