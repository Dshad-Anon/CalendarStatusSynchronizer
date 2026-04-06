import mongoose, { type Document, Schema } from "mongoose";

export interface IStatusLog extends Document {
  userId: mongoose.Types.ObjectId;
  platform: "slack" | "email";
  eventId: mongoose.Types.ObjectId | null;
  ruleId: mongoose.Types.ObjectId | null;
  action: string;
  status: "success" | "failed";
  errorMessage: string | null;
  metadata: Record<string, any>;
  timestamp: Date;
}

const statusLogSchema = new Schema<IStatusLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    platform: {
      type: String,
      enum: ["slack", "email"],
      required: true
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "CalendarEvent",
      default: null
    },
    ruleId: {
      type: Schema.Types.ObjectId,
      ref: "AutomationRule",
      default: null
    },
    action: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true
    },
    errorMessage: {
      type: String,
      default: null
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

statusLogSchema.index({ userId: 1, timestamp: -1 });
statusLogSchema.index({ userId: 1, platform: 1, timestamp: -1 });

export default mongoose.model<IStatusLog>("StatusLog", statusLogSchema);
