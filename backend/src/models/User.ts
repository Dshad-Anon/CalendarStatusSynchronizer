import bcrypt from "bcryptjs";
import mongoose, { type Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  name: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSync: Date | null;
  googleTokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
  } | null;
  slackTokens: {
    accessToken: string;
    userId: string;
    teamId: string;
    expiresAt: Date | null;
  } | null;
  emailConfig: {
    enabled: boolean;
    autoReplyMessage: string;
    host?: string;
    port?: number;
    email?: string;
  };
  emailAutoReply?: {
    enabled: boolean;
    subject: string;
    message: string;
    untilTime?: Date;
    lastUpdated: Date;
  };
  comparePassword(userPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: false,
      minlength: 6
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    googleId: {
      type: String,
      default: null
    },
    lastSync: {
      type: Date,
      default: null
    },
    googleTokens: {
      accessToken: { type: String, default: null },
      refreshToken: { type: String, default: null },
      expiresAt: { type: Date, default: null }
    },
    slackTokens: {
      accessToken: { type: String, default: null },
      userId: { type: String, default: null },
      teamId: { type: String, default: null },
      expiresAt: { type: Date, default: null }
    },
    emailConfig: {
      enabled: { type: Boolean, default: false },
      autoReplyMessage: {
        type: String,
        default: "I am currently unavailable. I will respond to your message as soon as possible."
      },
      host: { type: String, default: null },
      port: { type: Number, default: null },
      email: { type: String, default: null }
    },
    emailAutoReply: {
      enabled: { type: Boolean, default: false },
      subject: { type: String, default: "" },
      message: { type: String, default: "" },
      untilTime: { type: Date, default: null },
      lastUpdated: { type: Date, default: null }
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (userPassword: string): Promise<boolean> {
  return bcrypt.compare(userPassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
