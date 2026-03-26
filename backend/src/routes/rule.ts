import { Router } from "express";
import { createRule, deleteRule, getRules, updateRule } from "../controllers/ruleController";

const router = Router();
router.post("/", createRule);
router.get("/", getRules);
router.put("/:id", updateRule);
router.delete("/:id", deleteRule);

export default router;

