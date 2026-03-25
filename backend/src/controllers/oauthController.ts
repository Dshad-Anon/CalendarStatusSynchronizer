import type { Response } from "express";
import fs from "fs";
import { config } from "../config/config";
import type { AuthRequest } from "../middleware/auth";
import User from "../models/User";
import { getTokensFromCode } from "../services/googleService";

export const googleCallback = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.redirect(`${config.frontendUrl}/settings?error=no_code`);
    }
    if (!req.userId) {
      return res.redirect(`${config.frontendUrl}/settings?error=unauthorized`);
    }
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code, false);
    console.log("Google tokens response for user", req.userId, ":", tokens);
    try {
      fs.appendFileSync(
        "oauth_debug.log",
        `TOKENS ${new Date().toISOString()} user:${req.userId} ${JSON.stringify(tokens)}\n`
      );
    } catch (e) {
      console.error("Failed to write oauth_debug.log", e);
    }

    await User.findByIdAndUpdate(req.userId, {
      googleTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      }
    });

    res.redirect(`${config.frontendUrl}/settings?success=calendar_connected`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    try {
      fs.appendFileSync(
        "oauth_debug.log",
        `ERROR ${new Date().toISOString()} user:${req.userId} ${String(error)} ${JSON.stringify((error as any).response?.data || (error as any).response || {})}\n`
      );
    } catch (e) {
      console.error("Failed to write oauth_debug.log", e);
    }
    if (error && (error as any).response) {
      console.error(
        "OAuth error response data:",
        (error as any).response.data || (error as any).response
      );
    }
    res.redirect(`${config.frontendUrl}/settings?error=connection_failed`);
  }
};
