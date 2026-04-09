import express, { type Response, type Router } from "express";
import { type AuthRequest, authenticate } from "../middleware/auth";
import CalendarEvent from "../models/CalendarEvent";
import StatusLog from "../models/StatusLog";

const router: Router = express.Router();

router.get("/stats", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const userId = req.user._id;
    const now = new Date();

    const currentEvents = await CalendarEvent.find({
      userId,
      startTime: { $lte: now },
      endTime: { $gte: now },
      status: { $ne: "cancelled" }
    });

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcomingEvents = await CalendarEvent.find({
      userId,
      startTime: { $gte: now, $lte: tomorrow },
      status: { $ne: "cancelled" }
    }).sort({ startTime: 1 });

    const recentLogs = await StatusLog.find({ userId }).sort({ timestamp: -1 }).limit(10);

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const pastEvents = await CalendarEvent.find({
      userId,
      startTime: { $gte: weekAgo, $lte: now },
      status: "confirmed"
    });

    const totalMeetingMinutes = pastEvents.reduce((total, event) => {
      const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
      return total + duration;
    }, 0);

    res.json({
      currentEvents,
      upcomingEvents: upcomingEvents.slice(0, 5),
      recentLogs,
      analytics: {
        totalMeetingMinutes: Math.round(totalMeetingMinutes),
        totalMeetingHours: Math.round((totalMeetingMinutes / 60) * 10) / 10,
        meetingCount: pastEvents.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/logs", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const platform = req.query.platform as string;

    const query: any = { userId: req.user._id };
    if (platform) query.platform = platform;

    const logs = await StatusLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("eventId")
      .populate("ruleId");

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
