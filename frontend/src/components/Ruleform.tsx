import { Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { rulesService } from "../services/rulesService.ts";
import type { AutomationRule, RuleAction } from "../types";

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
    name: rule?.name || "",
    enabled: rule?.enabled ?? true,
    priority: rule?.priority ?? 0,
    conditions: rule?.conditions?.map((c) => ({
      type: "title_contains",
      operator: c.operator,
      value: String(c.value || "")
    })) || [{ type: "title_contains", operator: "contains", value: "" }],
    actions: rule?.actions?.map((a) => ({
      type: a.type,
      config: {
        statusText: a.config.statusText,
        statusEmoji: a.config.statusEmoji,
        subject: a.config.subject,
        message: a.config.autoReplyMessage
      }
    })) || [{ type: "slack_status", config: { statusText: "", statusEmoji: ":calendar:" } }]
  }));

  const conditionTypes = [{ value: "title_contains", label: "Email Subject" }];

  const actionTypes = [
    { value: "slack_status", label: "Update Slack Status" },
    { value: "email_auto_reply", label: "Email Auto-Reply" }
  ];

  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    const conditions = [...formData.conditions];
    conditions[index] = { ...conditions[index], [field]: value };
    setFormData({ ...formData, conditions });
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { type: "title_contains", operator: "contains", value: "" }
      ]
    });
  };

  const removeCondition = (index: number) => {
    if (formData.conditions.length === 1) return toast.error("At least one condition is required");
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const updateActionType = (index: number, type: Action["type"]) => {
    const actions = [...formData.actions];
    actions[index] = { type, config: {} };
    setFormData({ ...formData, actions });
  };

  const updateActionConfig = (index: number, key: string, value: string) => {
    const actions = [...formData.actions];
    actions[index] = {
      ...actions[index],
      config: { ...actions[index].config, [key]: value }
    };
    setFormData({ ...formData, actions });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: "slack_status", config: {} }]
    });
  };

  const removeAction = (index: number) => {
    if (formData.actions.length === 1) return toast.error("At least one action is required");
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const processedActions = formData.actions.map((action) => {
        const backendAction: RuleAction = {
          type: action.type,
          config: { ...action.config }
        };

        if (action.config.message) {
          backendAction.config.autoReplyMessage = action.config.message;
          delete (backendAction.config as { message?: string }).message;
        }

        return backendAction;
      });

      const payload = {
        ...formData,
        conditions: formData.conditions,
        actions: processedActions
      };

      if (rule?._id) {
        await rulesService.updateRule(rule._id, payload);
        toast.success("Rule updated");
      } else {
        await rulesService.createRule(payload);
        toast.success("Rule created");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save rule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{rule ? "Edit Rule" : "Create Rule"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="label">Rule Name</label>
            <input
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <input
                type="number"
                className="input"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                min={0}
              />
            </div>
            <label className="flex items-center gap-2 mt-7">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
              Enabled
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Conditions</h3>
              <button
                type="button"
                className="text-blue-600 flex items-center gap-1"
                onClick={addCondition}
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {formData.conditions.map((condition, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-start"
              >
                <select
                  className="input"
                  value={condition.type}
                  onChange={(e) => updateCondition(index, "type", e.target.value)}
                >
                  {conditionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <select
                  className="input"
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, "operator", e.target.value)}
                >
                  <option value="contains">Contains</option>
                  <option value="equals">Equals</option>
                </select>
                <input
                  className="input"
                  placeholder="keyword (e.g. invoice)"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, "value", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="text-red-600 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Actions</h3>
              <button
                type="button"
                className="text-green-600 flex items-center gap-1"
                onClick={addAction}
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {formData.actions.map((action, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-3">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
                  <select
                    className="input"
                    value={action.type}
                    onChange={(e) => updateActionType(index, e.target.value as Action["type"])}
                  >
                    {actionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeAction(index)}
                    className="text-red-600 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {action.type === "slack_status" && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input"
                      placeholder="Status text"
                      value={action.config.statusText || ""}
                      onChange={(e) => updateActionConfig(index, "statusText", e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder=":calendar:"
                      value={action.config.statusEmoji || ""}
                      onChange={(e) => updateActionConfig(index, "statusEmoji", e.target.value)}
                    />
                  </div>
                )}

                {action.type === "email_auto_reply" && (
                  <div className="space-y-2">
                    <input
                      className="input"
                      placeholder="Reply subject"
                      value={action.config.subject || ""}
                      onChange={(e) => updateActionConfig(index, "subject", e.target.value)}
                    />
                    <textarea
                      className="input"
                      placeholder="Auto-reply message"
                      rows={3}
                      value={action.config.message || ""}
                      onChange={(e) => updateActionConfig(index, "message", e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RuleForm;
