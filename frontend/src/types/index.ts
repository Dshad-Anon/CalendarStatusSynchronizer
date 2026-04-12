export interface User {
  id: string;
  email: string;
  name: string;
  googleConnected?: boolean;
  slackConnected?: boolean;
  lastSync?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CalendarEvent {
  _id: string;
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  isAllDay: boolean;
}

export interface RuleCondition {
  type: 'title_contains';
  operator: 'contains' | 'equals';
  value: string;
}

export interface RuleAction {
  type: 'slack_status' | 'email_auto_reply';
  config: {
    statusText?: string;
    statusEmoji?: string;
    subject?: string;
    autoReplyMessage?: string;
  };
}

export interface AutomationRule {
  _id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusLog {
  _id: string;
  platform: 'slack' | 'email';
  action: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  timestamp: string;
}

export interface DashboardStats {
  currentEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  recentLogs: StatusLog[];
  analytics: {
    totalMeetingMinutes: number;
    totalMeetingHours: number;
    meetingCount: number;
  };
}