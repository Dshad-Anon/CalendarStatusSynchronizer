import mongoose, { type Document, Schema } from "mongoose";

export interface IAutomationRule extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: {
    type: "title_contains";
    operator: "contains" | "equals";
    value: string;
  }[];
  actions: {
    type: "slack_status" | "email_auto_reply";
    config: {
      statusText?: string;
      statusEmoji?: string;
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
          enum: ["title_contains"],
          required: true
        },
        operator: {
          type: String,
          enum: ["contains", "equals"],
          required: true
        },
        value: {
          type: String,
          required: true,
          trim: true
        }
      }
    ],
    actions: [
      {
        type: {
          type: String,
          enum: ["slack_status", "email_auto_reply"],
          required: true
        },
        config: {
          statusText: { type: String },
          statusEmoji: { type: String },
          subject: { type: String },
          autoReplyMessage: { type: String },
          _id: false
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

automationRuleSchema.index({ userId: 1, enabled: 1, priority: -1 });

export default mongoose.model<IAutomationRule>("AutomationRule", automationRuleSchema);
