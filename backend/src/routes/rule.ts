import { Router } from "express";
import { createRule, deleteRule, getRules, updateRule } from "../controllers/ruleController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.post("/", createRule);
router.get("/", getRules);
router.put("/:id", updateRule);
router.delete("/:id", deleteRule);

export default router;

