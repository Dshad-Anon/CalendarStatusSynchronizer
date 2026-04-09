import type { Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import type { AuthRequest } from "../middleware/auth";
import { getTokensFromCode, saveGoogleTokens } from "../services/googleService";
import logger from "../utils/logger";

export const googleCallback = async (req: AuthRequest, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== "string") {
      return res.redirect(`${config.frontendUrl}/settings?error=no_code`);
    }

    if (!state || typeof state !== "string") {
      return res.redirect(`${config.frontendUrl}/settings?error=missing_state`);
    }

    let userId: string;
    try {
      const decoded = jwt.verify(state, config.jwtSecret) as {
        userId?: string;
        intent?: string;
      };

      if (!decoded.userId || decoded.intent !== "google_calendar_connect") {
        return res.redirect(`${config.frontendUrl}/settings?error=invalid_state`);
      }

      userId = decoded.userId;
    } catch {
      return res.redirect(`${config.frontendUrl}/settings?error=invalid_state`);
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code, false);
    logger.info(`Google OAuth tokens received for user: ${userId}`);

    // Save tokens with encryption
    await saveGoogleTokens(userId, tokens);

    res.redirect(`${config.frontendUrl}/settings?success=calendar_connected`);
  } catch (error) {
    logger.error("Google OAuth callback error:", error);
    res.redirect(`${config.frontendUrl}/settings?error=connection_failed`);
  }
};
