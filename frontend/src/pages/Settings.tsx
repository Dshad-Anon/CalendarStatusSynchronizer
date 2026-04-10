import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { oauthService } from "../services/oauthService";
import { getErrorMessage } from "../utils/errorMessage";

const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [globalReplyTemplate, setGlobalReplyTemplate] = useState(
    "I am doing {calendar.event}. I will get back to you by {calendar.eventEnd}."
  );

  const loadSettings = async () => {
    try {
      const [emailRes, autoReplyRes] = await Promise.all([
        api.get("/settings/email"),
        api.get("/settings/email/auto-reply")
      ]);

      const config = emailRes.data.emailConfig;
      setEmailEnabled(Boolean(config?.enabled));
      setGlobalReplyTemplate(
        config?.autoReplyMessage ||
          "I am doing {calendar.event}. I will get back to you by {calendar.eventEnd}."
      );

      setGoogleConnected(Boolean(autoReplyRes.data.googleConnected));
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

    if (error) {
      const errorMap: Record<string, string> = {
        no_code: "Google callback did not include an authorization code",
        missing_state: "OAuth state was missing from callback",
        invalid_state: "OAuth state was invalid or expired. Please try again",
        unauthorized: "Authentication required. Please log in again",
        connection_failed: "Failed to connect Google Calendar"
      };
      toast.error(errorMap[error] || "Google connection failed");
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const connectGoogle = async () => {
    try {
      setLoading(true);
      const authUrl = await oauthService.getGoogleCalendarAuthUrl();
      window.location.href = authUrl;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to start Google connection"));
      setLoading(false);
    }
  };

  const disconnectGoogle = async () => {
    try {
      setDisconnecting(true);
      await oauthService.disconnectGoogle();
      setGoogleConnected(false);
      toast.success("Google account disconnected");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to disconnect Google account"));
    } finally {
      setDisconnecting(false);
    }
  };

  const saveGlobalReply = async () => {
    try {
      setSaving(true);
      await api.patch("/settings/email", {
        enabled: emailEnabled,
        autoReplyMessage: globalReplyTemplate
      });
      toast.success("Global reply template saved");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to save global reply template"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Connect Google and set a reusable auto-reply template.</p>
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
            disabled={loading}
          >
            {loading ? "Redirecting..." : "Sync Google Calendar"}
          </button>

          {googleConnected && (
            <button
              className="btn-secondary text-sm px-3 py-1.5"
              onClick={disconnectGoogle}
              disabled={disconnecting || loading}
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          )}
        </div>
      </div>

      <div className="card mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Global Reply Template</h2>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
          />
          <span className="text-sm text-gray-700">Enable email automation module</span>
        </label>

        <textarea
          className="input w-full"
          rows={4}
          value={globalReplyTemplate}
          onChange={(e) => setGlobalReplyTemplate(e.target.value)}
          placeholder="I am doing {calendar.event}. I will get back to you by {calendar.eventEnd}."
        />

        <div className="text-xs text-gray-600 space-y-1">
          <p>Valid placeholders:</p>
          <p>{"{calendar.event}"} = matched calendar event title</p>
          <p>{"{calendar.eventEnd}"} = matched calendar event end time</p>
          <p>
            Example: I am doing {"{calendar.event}"}. I will get back to you by{" "}
            {"{calendar.eventEnd}"}.
          </p>
        </div>

        <button
          className="btn-primary text-sm px-3 py-1.5"
          onClick={saveGlobalReply}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Template"}
        </button>
      </div>
    </div>
  );
};

export default Settings;
