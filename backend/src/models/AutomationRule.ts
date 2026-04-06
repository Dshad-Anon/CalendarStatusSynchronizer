import mongoose, { type Document, Schema } from "mongoose";

export interface IAutomationRule extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: {
    // Example for attended can be if events has more than 10 attendees then make it a meeting, 
    // if it has less than 5 then make it do not disturb for 30 minutes as it might be daily scrum meetings
    // If number of attendees is more than 20 send automatic email reply email.
    type: "title_contains" | "event_type" | "time_range" | "attendee_count";
    operator: "contains" | "equals" | "greater_than" | "less_than" | "between";
    value: string | number;
    secondaryValue?: string | number;
  }[];
  actions: {
    type: "slack_status" | "slack_dnd" | "email_auto_reply";
    config: {
      statusText?: string;
      statusEmoji?: string;
      dndMinutes?: number;
      subject?: string;
      autoReplyMessage?: string;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const automationRuleSchema = new Schema<IAutomationRule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    conditions: [
      {
        type: {
          type: String,
          enum: ["title_contains", "event_type", "time_range", "attendee_count"],
          required: true
        },
        operator: {
          type: String,
          enum: ["contains", "equals", "greater_than", "less_than", "between"],
          required: true
        },
        value: {
          type: Schema.Types.Mixed,
          required: true
        },
        secondaryValue: {
          type: Schema.Types.Mixed
        }
      }
    ],
    actions: [
      {
        type: {
          type: String,
          enum: ["slack_status", "slack_dnd", "email_auto_reply"],
          required: true
        },
        config: {
          statusText: { type: String },
          statusEmoji: { type: String },
          dndMinutes: { type: Number },
          subject: { type: String },
          autoReplyMessage: { type: String },
          _id: false
        }
      }
    ]
  },
  { timestamps: true }
);

// Index for efficient queries by user and enabled status, sorted by priority
automationRuleSchema.index({ userId: 1, enabled: 1, priority: -1 });

export default mongoose.model<IAutomationRule>("AutomationRule", automationRuleSchema);
