import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import Rule from "../models/Rule";

export const createRule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { name, conditions, actions } = req.body;
    if (!name || !conditions || !actions) {
      return res.status(400).json({ message: "Name, conditions, and actions are required" });
    }
    const rule = await Rule.create({
      userId: req.user?._id.toString(),
      name,
      conditions,
      actions,
      isActive: true,
    });
    res.status(201).json({ message: "Rule created successfully", rule });
  } catch (error) {
    console.error("Error creating rule:", error);
    res.status(500).json({ message: "Failed to create rule" });
  }
};


export const getRules = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const rules = await Rule.find({ userId: req.user?._id.toString() }).sort({ createdAt: -1 });
    res.json({ rules });
  } catch (error) {
    console.error("Error fetching rules:", error);
    res.status(500).json({ message: "Failed to fetch rules" });
  }
};

export const updateRule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    const updates = req.body;

    const rule = await Rule.findOneAndUpdate(
      { _id: id, userId: req.user?._id.toString() },
      updates,
      { returnDocument: "after" }
    );
    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }
    res.json({ message: "Rule updated successfully", rule });
  } catch (error) {
    console.error("Error updating rule:", error);
    res.status(500).json({ message: "Failed to update rule" });
  }

};

export const deleteRule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { id } = req.params;
    const rule = await Rule.findOneAndDelete({ _id: id, userId: req.user?._id.toString() });
    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }
    res.json({ message: "Rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting rule:", error);
    res.status(500).json({ message: "Failed to delete rule" });
  }
};
