import CalendarEvent from "../models/CalendarEvent";
import User from "../models/User";
import logger from "../utils/logger";
import * as googleService from "./googleService";

export const syncCalendar = async (userId: string): Promise<void> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.googleTokens?.accessToken) {
      logger.warn(`User ${userId} has not connected Google account, skipping calendar sync`);
      return;
    }

    // Fetch calendar events for the next 7 days.
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    const events = await googleService.fetchCalendarEvents(user, timeMin, timeMax);

    // Process and save the events.
    for (const event of events) {
      if (!event.id || !event.start || !event.end) {
        continue;
      }
      const eventData = {
        userId: user._id,
        googleEventId: event.id,
        summary: event.summary || "Untitled Event",
        description: event.description || "",
        startTIme: new Date(event.start.dateTime || event.start.date || ""),
        endTime: new Date(event.end.dateTime || event.end.date || ""),
        location: event.location || "",
        attendees: event.attendees ? event.attendees.map(a => a.email || "") : [],
        status: (event.status as "confirmed" | "cancelled") || "confirmed",
        calendarId: "primary",
        isAllDay: !!event.start.date,
        recurring: !!event.recurringEventId,
        lastSynced: new Date(),
      };

      await CalendarEvent.findOneAndUpdate(
        { userId: user._id, googleEventId: event.id },
        eventData,
        { upsert: true, new: true }
      );
    }
    user.lastSync = new Date();
    await user.save();

    logger.info(`Synced calendar for user ${userId}: ${events.length} events`);
  } catch (error: any) {
    logger.error(`Failed to sync calendar for user ${userId}:`, error);
    throw error;
  }
};
// Get current events for a user
export const getCurrentEvents = async (userId: string) => {
  const now = new Date();

  return CalendarEvent.find({
    userId,
    startTime: { $lte: now },
    endTime: { $gte: now },
    status: { $ne: 'cancelled' },
  }).sort({ startTime: 1 });
};

export const getUpcomingEvents = async (userId: string, hours: number = 24) => {
  const now = new Date();
  const future = new Date(now.getTime() + hours * 60 * 60 * 1000);

  return CalendarEvent.find({
    userId,
    startTime: { $gte: now, $lte: future },
    status: { $ne: 'cancelled' },
  }).sort({ startTime: 1 });
};