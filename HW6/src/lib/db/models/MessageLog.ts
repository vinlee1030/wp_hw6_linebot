import { Schema, model, models, type Document, type Types } from "mongoose";

export interface MessageLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  gameSessionId?: Types.ObjectId;
  direction: "user" | "bot";
  type: "text" | "system";
  text?: string;
  rawEvent?: unknown;
  usedLLM: boolean;
  llmLatencyMs?: number;
  timestamp: Date;
}

const messageLogSchema = new Schema<MessageLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gameSessionId: { type: Schema.Types.ObjectId, ref: "GameSession" },
    direction: { type: String, enum: ["user", "bot"], required: true },
    type: { type: String, enum: ["text", "system"], default: "text" },
    text: { type: String },
    rawEvent: { type: Schema.Types.Mixed },
    usedLLM: { type: Boolean, default: false },
    llmLatencyMs: { type: Number },
    timestamp: { type: Date, default: Date.now },
  },
  { minimize: false }
);

export const MessageLogModel =
  models.MessageLog || model<MessageLog>("MessageLog", messageLogSchema);

