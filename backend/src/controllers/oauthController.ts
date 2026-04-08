import type { Response } from "express";
import { config } from "../config/config";
import type { AuthRequest } from "../middleware/auth";
import { getTokensFromCode, saveGoogleTokens } from "../services/googleService";
import logger from "../utils/logger";

export const googleCallback = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.redirect(`${config.frontendUrl}/settings?error=no_code`);
    }
    if (!req.user) {
      return res.redirect(`${config.frontendUrl}/settings?error=unauthorized`);
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code, false);
    logger.info(`Google OAuth tokens received for user: ${req.user}`);

    // Save tokens with encryption
    await saveGoogleTokens(req.user._id.toString(), tokens);

    res.redirect(`${config.frontendUrl}/settings?success=calendar_connected`);
  } catch (error) {
    logger.error("Google OAuth callback error:", error);
    res.redirect(`${config.frontendUrl}/settings?error=connection_failed`);
  }
};
