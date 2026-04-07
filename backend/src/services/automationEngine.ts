import type { IAutomationRule } from "../models/AutomationRule";
import AutomationRule from "../models/AutomationRule";
import type { ICalendarEvent } from "../models/CalendarEvent";

/**
 * Evaluates a single condition against a calendar event.
 * @param condition: For now we only support "title_contains" type, but this can be extended in the future.
 * @param event: The calendar event to evaluate the condition against.
 * @returns A boolean indicating whether the condition is satisfied or not by the event.
 */
export const evaluateCondition = (
  condition: IAutomationRule["conditions"][0],
  event: ICalendarEvent
): boolean => {
  const summary = event.summary.toLowerCase();
  const expected = String(condition.value).toLowerCase();

  if (condition.type === "title_contains") {
    if (condition.operator === "contains") {
      return summary.includes(expected);
    }
    if (condition.operator === "equals") {
      return summary === expected;
    }
  }
  return false;
};

/**
 * Evaluates an automation rule against a calendar event.
 * @param rule: The automation rule to evaluate.
 * @param event: The calendar event to evaluate the rule against.
 * @returns A boolean indicating whether the rule is satisfied or not by the event.
 */
export const evaluateRule = (rule: IAutomationRule, event: ICalendarEvent): boolean => {
  if (!rule.enabled) {
    return false;
  }
  return rule.conditions.every((condition) => evaluateCondition(condition, event));
};
/*
 * Finds all automation rules for a user that match a given calendar event.
 * @param userId: The ID of the user whose rules we want to evaluate.
 * @param event: The calendar event to evaluate the rules against.
 * @returns An array of automation rules that match the event.
 */
export const findMatchingRules = async (
  userId: string,
  event: ICalendarEvent
): Promise<IAutomationRule[]> => {
  const rules = await AutomationRule.find({
    userId,
    enabled: true
  }).sort({ priority: -1 });

  return rules.filter((rule) => evaluateRule(rule, event));
};

/*
 * Extracts the action configuration for a specific action type from an automation rule.
 * @param rule: The automation rule containing the actions.
 * @param actionType: The type of action to extract the configuration for (e.g., "slack_status" or "email_auto_reply").
 * @returns The configuration object for the specified action type.
 */
export const getActionConfig = (
  rule: IAutomationRule,
  actionType: 'slack_status' | 'email_auto_reply'
) => {
  const action = rule.actions.find((a) => a.type === actionType);
  return action?.config;
};