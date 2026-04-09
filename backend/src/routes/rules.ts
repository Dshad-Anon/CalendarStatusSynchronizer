import type { Response } from "express";
import express, { type Router } from "express";
import { body, validationResult } from "express-validator";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";
import AutomationRule from "../models/AutomationRule";

const router: Router = express.Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const rules = await AutomationRule.find({ userId: req.user._id }).sort({ priority: -1 });
    res.json({ rules });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/",
  authenticate,
  [
    body("name").isString().trim().notEmpty(),
    body("conditions").isArray({ min: 1 }),
    body("actions").isArray({ min: 1 }),
    body("conditions.*.type").equals("title_contains"),
    body("conditions.*.operator").isIn(["contains", "equals"]),
    body("conditions.*.value").isString().notEmpty(),
    body("actions.*.type").isIn(["slack_status", "email_auto_reply"])
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const { name, enabled, priority, conditions, actions } = req.body;

      const rule = await AutomationRule.create({
        userId: req.user._id,
        name,
        enabled: enabled !== undefined ? enabled : true,
        priority: priority ?? 0,
        conditions,
        actions
      });

      res.status(201).json({ rule });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.patch("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const rule = await AutomationRule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!rule) {
      res.status(404).json({ error: "Rule not found" });
      return;
    }

    res.json({ rule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const rule = await AutomationRule.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!rule) {
      res.status(404).json({ error: "Rule not found" });
      return;
    }

    res.json({ success: true, message: "Rule deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
