import { google } from "googleapis";
import User from "../models/User";
import { oauth2Client } from "./googleService";

export const getCalendarEvents = async (userId: string) => {
  try {
    // Get users google tokens
    const user = await User.findById(userId);
    if (!user || !user.googleTokens) {
      throw new Error("User not connected to Google Calendar");
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken
    });
    // Create Calendar API client
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Fetch events from primary calendar
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime"
    });
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
};

export const createCalendarEvent = async (
  userId: string,
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
  }
) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.googleTokens) {
      throw new Error("User not connected to Google Calendar");
    }

    oauth2Client.setCredentials({
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken
    });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    //Fetch events from primary calendar
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event
    });

    return response.data;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
};
