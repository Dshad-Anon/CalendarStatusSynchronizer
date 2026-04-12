import type { AutomationRule } from "../types";
import api from "./api";

export const rulesService = {
  getRules: async (): Promise<AutomationRule[]> => {
    const response = await api.get("/rules");
    return response.data.rules;
  },

  createRule: async (rule: Partial<AutomationRule>): Promise<AutomationRule> => {
    const response = await api.post("/rules", rule);
    return response.data.rule;
  },

  updateRule: async (id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> => {
    const response = await api.patch(`/rules/${id}`, updates);
    return response.data.rule;
  },

  deleteRule: async (id: string) => {
    const response = await api.delete(`/rules/${id}`);
    return response.data;
  }
};
