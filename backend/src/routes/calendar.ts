import { Router } from "express";
import {
  createEvent,
  getEvents,
  getUpcomingCalendarEvents,
  syncUserCalendar,
} from "../controllers/calendarController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/events", getEvents);
router.get("/upcoming", getUpcomingCalendarEvents);

router.post("/events", createEvent);
router.post("/sync", syncUserCalendar);

export default router;
