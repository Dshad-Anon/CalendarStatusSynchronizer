import { Edit2, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import RuleForm from "../components/Ruleform";
import { rulesService } from "../services/rulesService";
import type { AutomationRule } from "../types";

export const Rules: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>(undefined);

  const loadRules = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await rulesService.getRules();
      setRules(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to load rules");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => b.priority - a.priority);
  }, [rules]);

  const handleCreate = () => {
    setEditingRule(undefined);
    setShowForm(true);
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(undefined);
  };

  const handleToggle = async (rule: AutomationRule) => {
    try {
      setBusyId(rule._id);
      await rulesService.updateRule(rule._id, { enabled: !rule.enabled });
      toast.success(rule.enabled ? "Rule disabled" : "Rule enabled");
      await loadRules(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to toggle rule");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (ruleId: string) => {
    const confirmed = window.confirm("Delete this rule permanently?");
    if (!confirmed) return;

    try {
      setBusyId(ruleId);
      await rulesService.deleteRule(ruleId);
      toast.success("Rule deleted");
      await loadRules(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to delete rule");
    } finally {
      setBusyId(null);
    }
  };

  const renderCondition = (rule: AutomationRule): string => {
    const c = rule.conditions[0];
    if (!c) return "No condition set";
    return `title ${c.operator} "${c.value}"`;
  };

  const renderActions = (rule: AutomationRule): string => {
    const labels = rule.actions.map((action) => {
      if (action.type === "slack_status") {
        return `Slack: ${action.config.statusText || "custom status"}`;
      }
      if (action.type === "email_auto_reply") {
        return `Email: ${action.config.subject || "auto reply"}`;
      }
      return action.type;
    });
    return labels.join(" | ");
  };

  useEffect(() => {
    loadRules();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="card">Loading rules...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Automation Rules</h1>
          <p className="text-gray-600 mt-1">
            Rules trigger only when a subject matches your keyword condition.
          </p>
        </div>
        <button className="btn-primary inline-flex items-center" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </button>
      </div>

      {sortedRules.length === 0 ? (
        <div className="card">
          <p className="text-gray-700 font-medium">No rules yet.</p>
          <p className="text-gray-600 text-sm mt-1">
            Create your first rule with condition like: title contains "Testing App".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRules.map((rule) => (
            <div key={rule._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900">{rule.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">Condition: {renderCondition(rule)}</p>
                  <p className="text-sm text-gray-600 mt-1">Actions: {renderActions(rule)}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Priority: {rule.priority} | Status: {rule.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="btn-secondary inline-flex items-center"
                    onClick={() => handleEdit(rule)}
                    disabled={busyId === rule._id}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </button>

                  <button
                    className="btn-secondary inline-flex items-center"
                    onClick={() => handleToggle(rule)}
                    disabled={busyId === rule._id}
                  >
                    {rule.enabled ? (
                      <PowerOff className="w-4 h-4 mr-1" />
                    ) : (
                      <Power className="w-4 h-4 mr-1" />
                    )}
                    {rule.enabled ? "Disable" : "Enable"}
                  </button>

                  <button
                    className="btn-danger inline-flex items-center"
                    onClick={() => handleDelete(rule._id)}
                    disabled={busyId === rule._id}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RuleForm rule={editingRule} onClose={handleCloseForm} onSuccess={() => loadRules(false)} />
      )}
    </div>
  );
};

export default Rules;
