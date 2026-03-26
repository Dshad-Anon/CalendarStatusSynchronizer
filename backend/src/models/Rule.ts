import mongoose, { type Document, Schema } from "mongoose";

export interface IRule extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  isActive: boolean;
  conditions: {
    platform: "google_calendar";
    eventType: "event_created" | "event_updated" | "event_deleted";
    filters?: {
      titleContains?: string;
      descriptionContains?: string;
      startTimeAfter?: Date;
      startTimeBefore?: Date;
    };
  }[];
  actions: {
    type: "create_event" | "send_notification" | "update_event";
    platform: "google_calendar" | "slack" | "email";
    config: any;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ruleSchema = new Schema<IRule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    conditions: [
      {
        platform: { type: String, required: true },
        eventType: { type: String, required: true },
        filters: {
          titleContains: String,
          descriptionContains: String,
          startTimeAfter: Date,
          startTimeBefore: Date
        }
      }
    ],
    actions: [
      {
        type: { type: String, required: true },
        platform: { type: String, required: true },
        config: {
          type: Schema.Types.Mixed,
          required: true
        }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<IRule>("Rule", ruleSchema);
