import { Router } from "express";
import { googleCallback } from "../controllers/oauthController";
import { authenticate } from "../middleware/auth";
import { getGoogleAuthUrl } from "../services/googleService";

const router = Router();

router.get("/google/calendar", authenticate, (req, res) => {
  const authUrl = getGoogleAuthUrl();
  res.json({ authUrl });
});

router.get("/google/callback", authenticate, googleCallback);

export default router;
