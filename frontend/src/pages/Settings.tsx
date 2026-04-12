import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { oauthService } from "../services/oauthService";
import { getErrorMessage } from "../utils/errorMessage";

const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleDisconnecting, setGoogleDisconnecting] = useState(false);
  const [slackLoading, setSlackLoading] = useState(false);
  const [slackDisconnecting, setSlackDisconnecting] = useState(false);
  const [updatingAutoReply, setUpdatingAutoReply] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [runtimeAutoReplyEnabled, setRuntimeAutoReplyEnabled] = useState(false);

  const loadSettings = async () => {
    try {
      const [emailRes, autoReplyRes, connectionsRes] = await Promise.all([
        api.get("/settings/email"),
        api.get("/settings/email/auto-reply"),
        api.get("/settings/connections")
      ]);

      const config = emailRes.data.emailConfig;
      setEmailEnabled(Boolean(config?.enabled));

      setGoogleConnected(Boolean(autoReplyRes.data.googleConnected));
      setSlackConnected(Boolean(connectionsRes.data.slackConnected));
      setRuntimeAutoReplyEnabled(Boolean(autoReplyRes.data.emailAutoReply?.enabled));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load settings"));
    }
  };

  useEffect(() => {
    void loadSettings();

    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (!success && !error) return;

    if (success === "calendar_connected") {
      setGoogleConnected(true);
      toast.success("Google Calendar connected successfully");
    }

    if (success === "slack_connected") {
      setSlackConnected(true);
      toast.success("Slack connected successfully");
    }

    if (error) {
      const errorMap: Record<string, string> = {
        no_code: "Google callback did not include an authorization code",
        missing_state: "OAuth state was missing from callback",
        invalid_state: "OAuth state was invalid or expired. Please try again",
        unauthorized: "Authentication required. Please log in again",
        connection_failed: "Failed to connect the selected account"
      };
      toast.error(errorMap[error] || "Connection failed");
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const connectGoogle = async () => {
    try {
      setGoogleLoading(true);
      const authUrl = await oauthService.getGoogleCalendarAuthUrl();
      window.location.href = authUrl;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to start Google connection"));
      setGoogleLoading(false);
    }
  };

  const disconnectGoogle = async () => {
    try {
      setGoogleDisconnecting(true);
      await oauthService.disconnectGoogle();
      setGoogleConnected(false);
      toast.success("Google account disconnected");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to disconnect Google account"));
    } finally {
      setGoogleDisconnecting(false);
    }
  };

  const connectSlack = async () => {
    try {
      setSlackLoading(true);
      const authUrl = await oauthService.getSlackAuthUrl();
      window.location.href = authUrl;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to start Slack connection"));
      setSlackLoading(false);
    }
  };

  const disconnectSlack = async () => {
    try {
      setSlackDisconnecting(true);
      await oauthService.disconnectSlack();
      setSlackConnected(false);
      toast.success("Slack account disconnected");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to disconnect Slack account"));
    } finally {
      setSlackDisconnecting(false);
    }
  };

  const updateAutoReplyFeature = async (enabled: boolean) => {
    if (enabled && !googleConnected) {
      toast.error("Please connect Google first before enabling auto-reply");
      return;
    }

    try {
      setUpdatingAutoReply(true);
      await api.patch("/settings/email", {
        enabled
      });
      setEmailEnabled(enabled);
      toast.success(enabled ? "Auto-reply feature enabled" : "Auto-reply feature disabled");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update auto-reply feature"));
    } finally {
      setUpdatingAutoReply(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">
          Connect  Slack and Google Calendar to enable automatic status updates.
        </p>
      </div>

      <div className="card mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Google Integration</h2>
        <p className="text-sm text-gray-600">
          Click sync to authorize Google Calendar + Gmail access used by automation.
        </p>

        <p
          className={`text-sm font-medium ${googleConnected ? "text-green-700" : "text-amber-700"}`}
        >
          Status: {googleConnected ? "Connected" : "Not connected"}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn-primary text-sm px-3 py-1.5"
            onClick={connectGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? "Redirecting..." : "Sync Google Calendar"}
          </button>

          {googleConnected && (
            <button
              className="btn-secondary text-sm px-3 py-1.5"
              onClick={disconnectGoogle}
              disabled={googleDisconnecting || googleLoading}
            >
              {googleDisconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          )}
        </div>
      </div>

      <div className="card mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Slack Integration</h2>
        <p className="text-sm text-gray-600">
          Connect Slack so your automation rules can update your status when calendar events change.
        </p>

        <p className={`text-sm font-medium ${slackConnected ? "text-green-700" : "text-amber-700"}`}>
          Status: {slackConnected ? "Connected" : "Not connected"}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn-primary text-sm px-3 py-1.5"
            onClick={connectSlack}
            disabled={slackLoading}
          >
            {slackLoading ? "Redirecting..." : "Connect Slack"}
          </button>

          {slackConnected && (
            <button
              className="btn-secondary text-sm px-3 py-1.5"
              onClick={disconnectSlack}
              disabled={slackDisconnecting || slackLoading}
            >
              {slackDisconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          )}
        </div>
      </div>

      <div className="card mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Email Auto-Reply</h2>

        <p className={`text-sm font-medium ${googleConnected ? "text-green-700" : "text-red-700"}`}>
          Google Status: {googleConnected ? "Connected" : "Disconnected"}
        </p>

        <p className={`text-sm font-medium ${emailEnabled ? "text-green-700" : "text-gray-700"}`}>
          Feature Switch: {emailEnabled ? "Enabled" : "Disabled"}
        </p>

        <p
          className={`text-sm font-medium ${runtimeAutoReplyEnabled ? "text-green-700" : "text-gray-700"}`}
        >
          Runtime Status (rule matched): {runtimeAutoReplyEnabled ? "Active" : "Inactive"}
        </p>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => {
              void updateAutoReplyFeature(e.target.checked);
            }}
            disabled={updatingAutoReply}
          />
          <span className="text-sm text-gray-700">Enable Auto-Reply Feature (master switch)</span>
        </label>

        <p className="text-xs text-gray-600">
          The feature switch is saved in emailConfig.enabled. Runtime status is emailAutoReply.enabled and
          becomes active only when a calendar event matches an enabled rule with email_auto_reply action.
        </p>
      </div>
    </div>
  );
};

export default Settings;
