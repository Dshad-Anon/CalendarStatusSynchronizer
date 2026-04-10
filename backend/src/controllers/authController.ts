import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import User from "../models/User";
import { getGoogleUserProfile, getTokensFromCode } from "../services/googleService";

/**
 * Registers a new user by hashing the password and generating a JWT token.
 * @param req  Request object containing name, email, and password in the body.
 * @param res Response object to send back the token and user information or error messages.
 * @returns  A JSON response with the JWT token and user information on success, or an error message on failure.
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "Please provide name, email, and password"
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = jwt.sign({ userId: user._id }, config.jwtSecret as string, { expiresIn: "1hr" });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
/**
 * Login function that authenticates a user.
 * @param req  Request object containing email and password in the body.
 * @param res Response object to send back the token and user information or error messages.
 * @returns  A JSON response with the JWT token and user information on success, or an error message on failure.
 */

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Please provide email and password. "
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid user or password. Please try again." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, config.jwtSecret as string, { expiresIn: "1hr" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Google login function that authenticates a user using Google OAuth.
 * @param req  Request object containing email and name in the body.
 * @param res Response object to send back the token and user information or error messages.
 * @returns  A JSON response with the JWT token and user information on success, or an error message on failure.
 */
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { code: rawCode } = req.body;
    if (!rawCode) {
      return res.status(400).json({ message: "Authorization code is required" });
    }
    const code = decodeURIComponent(rawCode);
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code, true);
    if (!tokens.access_token) {
      return res.status(400).json({ message: "Failed to obtain access token" });
    }
    const googleProfile = await getGoogleUserProfile(tokens.access_token);

    // Ensure required Google profile fields are present before proceeding
    if (!googleProfile.name || !googleProfile.email || !googleProfile.googleId) {
      return res.status(400).json({
        message: "Google profile is missing required information (name, email, or id)"
      });
    }

    const normalizedEmail = googleProfile.email.toLowerCase().trim();

    // Atomic upsert prevents duplicate-key races when callback is triggered more than once.
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $setOnInsert: {
          name: googleProfile.name,
          email: normalizedEmail
        },
        $set: {
          googleId: googleProfile.googleId
        }
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true
      }
    );

    if (!user) {
      return res.status(500).json({ message: "Google Authentication Failed." });
    }

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: "1hr" });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Google Authentication Failed." });
  }
};
