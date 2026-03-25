import { Router } from "express";
import { createEvent, getEvents } from "../controllers/calendarController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/events", getEvents);

router.post("/events", createEvent);

export default router;
