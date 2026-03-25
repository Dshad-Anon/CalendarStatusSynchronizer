
import { config } from "../config/config";
import type { AuthRequest } from "../middleware/auth";
import { getTokensFromCode } from "../services/googleService";
import type { Response } from "express";
import User from "../models/User";

export const googleCallback = async(req: AuthRequest, res: Response) => {
  try{
    const {code} = req.query;

    if(!code || typeof code !== "string"){
      return res.redirect(`${config.frontendUrl}/settings?error=no_code`);
    }
    if(!req.userId){
      return res.redirect(`${config.frontendUrl}/settings?error=unauthorized`);
    }
    // Exchange code for tokens 
    const tokens =  await getTokensFromCode(code,false);

    await User.findByIdAndUpdate(req.userId, {
      googleTokens:{
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      },
    });

      res.redirect(`${config.frontendUrl}/settings?success=calendar_connected`);
    }
    catch(error){
      console.error("Google OAuth callback error:", error);
      res.redirect(`${config.frontendUrl}/settings?error=connection_failed`);
    }
    };