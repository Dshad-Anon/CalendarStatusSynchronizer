
import type { AuthRequest } from '../middleware/auth';
import type { Response } from 'express';
import { getCalendarEvents, createCalendarEvent } from '../services/calendarService';

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const events = await getCalendarEvents(req.userId);
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
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { summary, description, start, end } = req.body;

    if (!summary || !start || !end) {
      return res.status(400).json({ 
        message: 'Summary, start, and end are required' 
      });
    }

    const event = await createCalendarEvent(req.userId, {
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