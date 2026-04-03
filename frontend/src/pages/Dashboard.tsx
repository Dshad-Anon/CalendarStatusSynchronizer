import { useEffect, useState } from "react";

export const Dashboard = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome back, {user?.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Calendar Events</h3>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm opacity-90 mt-1">Upcoming this week</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Active Rules</h3>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm opacity-90 mt-1">Automations running</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Connections</h3>
          <p className="text-3xl font-bold">1</p>
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
