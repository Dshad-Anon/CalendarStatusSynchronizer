
import React, { useState } from "react";
import { AutomationRule, RuleAction } from "../types";

interface Condition {
  type: "title_contains";
  operator: "contains" | "equals";
  value: string;
}

interface Action {
  type: "slack_status" | "email_auto_reply";
  config: {
    statusText?: string;
    statusEmoji?: string;
    subject?: string;
    message?: string;
  };
}

interface RuleFormData {
  name: string;
  enabled: boolean;
  priority: number;
  conditions: Condition[];
  actions: Action[];
}

interface RuleFormProps {
  rule?: AutomationRule;
  onClose: () => void;
  onSuccess: () => void;
}

const RuleForm: React.FC<RuleFormProps> = ({ rule, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>(() => ({
    name: rule?.name || '',
    enabled: rule?.enabled ?? true,
    priority: rule?.priority ?? 0,
    conditions:
      rule?.conditions?.map((c) => ({
        type: 'title_contains',
        operator: c.operator,
        value: String(c.value || ''),
      })) || [{ type: 'title_contains', operator: 'contains', value: '' }],
    actions:
      rule?.actions?.map((a) => ({
        type: a.type,
        config: {
          statusText: a.config.statusText,
          statusEmoji: a.config.statusEmoji,
          subject: a.config.subject,
          message: a.config.autoReplyMessage,
        },
      })) || [{ type: 'slack_status', config: { statusText: '', statusEmoji: ':calendar:' } }],
  }));

  const conditionTypes = [{ value: 'title_contains', label: 'Email Subject' }];
  
  const actionTypes = [
    { value: 'slack_status', label: 'Update Slack Status' },
    { value: 'email_auto_reply', label: 'Email Auto-Reply' },
  ];

  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    const conditions = [...formData.conditions];
    conditions[index] = { ...conditions[index], [field]: value };
    setFormData({ ...formData, conditions });
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { type: 'title_contains', operator: 'contains', value: '' }],
    });
  };

  const removeCondition = (index: number) => {
    if (formData.conditions.length === 1) return toast.error('At least one condition is required');
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };