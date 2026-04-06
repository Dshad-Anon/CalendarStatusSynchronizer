import mongoose, { type Document, Schema } from "mongoose";

export interface ICalendarEvent extends Document {
  userId: mongoose.Types.ObjectId;
  googleEventId: string;
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  attendees: string[];
  status: "confirmed" | "tentative" | "cancelled";
  calendarId: string;
  isAllDay: boolean;
  recurring: boolean;
  lastSynced: Date;
  createdAt: Date;
  updatedAt: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    googleEventId: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: {
      type: Date,
      required: true,
      index: true
    },
    location: {
      type: String,
      default: ""
    },
    attendees: [
      {
        type: String
      }
    ],
    status: {
      type: String,
      enum: ["confirmed", "tentative", "cancelled"],
      default: "confirmed"
    },
    calendarId: {
      type: String,
      required: true
    },
    isAllDay: {
      type: Boolean,
      default: false
    },
    recurring: {
      type: Boolean,
      default: false
    },
    lastSynced: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

calendarEventSchema.index({ userId: 1, startTime: 1, endTime: 1 });
calendarEventSchema.index({ userId: 1, googleEventId: 1 }, { unique: true });

export default mongoose.model<ICalendarEvent>("CalendarEvent", calendarEventSchema);
