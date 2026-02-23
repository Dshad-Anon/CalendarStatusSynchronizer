import mongoose, { type Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  googleTokens?: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      }
    },
    googleId: { type: String, sparse: true },
    googleTokens: {
      accessToken: String,
      refreshToken: String,
      expiryDate: Number
    }
  },
  { timestamps: true }
);
export default mongoose.model<IUser>("User", userSchema);
