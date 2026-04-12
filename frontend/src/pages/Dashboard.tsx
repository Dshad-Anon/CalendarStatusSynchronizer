import { useEffect, useState } from "react";
import api from "../services/api";
import { calendarService } from "../services/calendarService";
import { rulesService } from "../services/rulesService";
import type { User } from "../types";

export const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [upcomingWeekCount, setUpcomingWeekCount] = useState(0);
  const [activeRulesCount, setActiveRulesCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData) as User;
        setUser(parsedUser);
      }

      try {
        const [upcomingEvents, rules, connections] = await Promise.all([
          calendarService.getUpcomingEvents(24 * 7),
          rulesService.getRules(),
          api.get("/settings/connections"),
        ]);

        const googleConnected = Boolean(connections.data.googleConnected);
        const slackConnected = Boolean(connections.data.slackConnected);

        const runnableRules = rules.filter(
          (rule) =>
            rule.enabled &&
            rule.actions.some(
              (action) =>
                (action.type === "email_auto_reply" && googleConnected) ||
                (action.type === "slack_status" && slackConnected)
            )
        );

        setUpcomingWeekCount(googleConnected ? upcomingEvents.length : 0);
        setActiveRulesCount(runnableRules.length);
        setConnectionsCount(connections.data.count || 0);
      } catch (error) {
        console.error("Failed to load dashboard metrics", error);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome back, {user?.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Calendar Events</h3>
          <p className="text-3xl font-bold">{upcomingWeekCount}</p>
          <p className="text-sm opacity-90 mt-1">Upcoming this week</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Active Rules</h3>
          <p className="text-3xl font-bold">{activeRulesCount}</p>
          <p className="text-sm opacity-90 mt-1">Automations running</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Connections</h3>
          <p className="text-3xl font-bold">{connectionsCount}</p>
          <p className="text-sm opacity-90 mt-1">Platforms connected</p>
        </div>
      </div>

      <div className="mt-8 card">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-3">
          <a
            href="/calendar"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">View Calendar</h3>
            <p className="text-sm text-gray-600">See your upcoming events</p>
          </a>
          <a
            href="/rules"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Create Rule</h3>
            <p className="text-sm text-gray-600">Automate your workflow</p>
          </a>
        </div>
      </div>
    </div>
  );
};
