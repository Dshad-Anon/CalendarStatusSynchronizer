import { useEffect, useState } from "react";
import { calendarService } from "../services/calendarService";
import type { CalendarEvent } from "../types";

export const Calendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getGroupLabel = (dateKey: string) => {
    const now = new Date();
    const today = getDateKey(now);

    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = getDateKey(tomorrowDate);

    if (dateKey === today) return "Today";
    if (dateKey === tomorrow) return "Tomorrow";

    const date = new Date(`${dateKey}T00:00:00`);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const formatEventTime = (startTime: string, endTime: string, isAllDay: boolean) => {
    if (isAllDay) {
      return new Date(startTime).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    return `${start.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  };

  const loadUpcomingEvents = async () => {
    setError(null);
    try {
      const upcoming = await calendarService.getUpcomingEvents(24 * 7);
      setEvents(upcoming);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load upcoming events");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  useEffect(() => {
    if (!syncMessage) return;

    const timeoutId = window.setTimeout(() => {
      setSyncMessage(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [syncMessage]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncMessage(null);

    try {
      const syncResult = await calendarService.syncCalendar();
      await loadUpcomingEvents();
      setSyncMessage(syncResult?.message || "Calendar synced successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Calendar sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const groupedEvents = events.reduce<Record<string, CalendarEvent[]>>((groups, event) => {
    const key = getDateKey(new Date(event.startTime));
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(event);
    return groups;
  }, {});

  const sortedGroupKeys = Object.keys(groupedEvents).sort((a, b) =>
    a.localeCompare(b)
  );

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const nextUpcomingEvent = sortedEvents[0];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? "Syncing..." : "Sync Calendar"}
          </button>
          {syncMessage && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-base font-semibold text-green-700 shadow-sm">
              {syncMessage}
            </p>
          )}
        </div>
      </div>

      {!isLoading && nextUpcomingEvent && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Next Upcoming</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{nextUpcomingEvent.summary}</p>
          <p className="mt-1 text-sm text-gray-700">
            {formatEventTime(
              nextUpcomingEvent.startTime,
              nextUpcomingEvent.endTime,
              nextUpcomingEvent.isAllDay
            )}
          </p>
          {nextUpcomingEvent.location && (
            <p className="mt-1 text-sm text-gray-600">{nextUpcomingEvent.location}</p>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Upcoming Events</h2>

        {isLoading ? (
          <p className="text-gray-600">Loading upcoming events...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-600">No events in the next 7 days.</p>
        ) : (
          <div className="space-y-5">
            {sortedGroupKeys.map((dateKey) => (
              <div key={dateKey}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {getGroupLabel(dateKey)}
                </h3>
                <div className="space-y-3">
                  {groupedEvents[dateKey].map((event) => (
                    <div
                      key={event._id}
                      className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300"
                    >
                      <p className="font-medium text-gray-900">{event.summary}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {formatEventTime(event.startTime, event.endTime, event.isAllDay)}
                      </p>
                      {event.location && (
                        <p className="mt-1 text-sm text-gray-500">{event.location}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

      </div>
    </div>
  );
};
