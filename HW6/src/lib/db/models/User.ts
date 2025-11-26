import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    lineUserId: { type: String, required: true, unique: true },
    displayName: { type: String },
    locale: { type: String },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = models.User || model("User", userSchema);

