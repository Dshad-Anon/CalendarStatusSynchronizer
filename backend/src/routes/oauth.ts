import { Router } from "express";
import jwt from "jsonwebtoken";
import { googleCallback } from "../controllers/oauthController";
import { config } from "../config/config";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";
import { disconnectGoogle, getGoogleAuthUrl } from "../services/googleService";

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

export default router;
