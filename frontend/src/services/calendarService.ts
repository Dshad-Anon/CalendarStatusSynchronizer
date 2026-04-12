import type { CalendarEvent } from "../types";
import { getErrorMessage } from "../utils/errorMessage";
import api from "./api";

export const calendarService = {
  syncCalendar: async () => {
    try {
      const response = await api.post("/calendar/sync");
      return response.data;
    } catch (error: unknown) {
      console.error("Calendar sync error:", getErrorMessage(error, "Calendar sync failed"));
      throw error;
    }
  },

  getCurrentEvents: async (): Promise<CalendarEvent[]> => {
    const response = await api.get("/calendar/current");
    return response.data.events;
  },

  getUpcomingEvents: async (hours: number = 24): Promise<CalendarEvent[]> => {
    const response = await api.get(`/calendar/upcoming?hours=${hours}`);
    return response.data.events;
  }
};
