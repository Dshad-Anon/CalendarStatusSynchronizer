
import type { AuthRequest } from '../middleware/auth';
import type { Response } from 'express';
import { getCalendarEvents, createCalendarEvent } from '../services/calendarService';
import { getUpcomingEvents, syncCalendar } from '../services/calendarSyncService';

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const events = await getCalendarEvents(req.user._id.toString());
    res.json({ events });
  } catch (error: any) {
    console.error('Get events error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch calendar events'
    });
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { summary, description, start, end } = req.body;

    if (!summary || !start || !end) {
      return res.status(400).json({
        message: 'Summary, start, and end are required'
      });
    }

    const event = await createCalendarEvent(req.user._id.toString(), {
      summary,
      description,
      start,
      end,
    });

    res.status(201).json({ event });
  } catch (error: any) {
    console.error('Create event error:', error);
    res.status(500).json({
      message: error.message || 'Failed to create calendar event'
    });
  }
};

export const syncUserCalendar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await syncCalendar(req.user._id.toString());
    res.json({ message: 'Calendar synced successfully' });
  } catch (error: any) {
    console.error('Calendar sync error:', error);
    res.status(500).json({
      message: error.message || 'Failed to sync calendar'
    });
  }
};

export const getUpcomingCalendarEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.user.googleTokens?.accessToken) {
      return res.json({ events: [] });
    }

    const hours = Number(req.query.hours) || 24;
    const events = await getUpcomingEvents(req.user._id.toString(), hours);

    res.json({ events });
  } catch (error: any) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch upcoming events'
    });
  }
};