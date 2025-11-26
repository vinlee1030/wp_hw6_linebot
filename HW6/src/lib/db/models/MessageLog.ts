import { Schema, model, models, type InferSchemaType } from "mongoose";

const messageLogSchema = new Schema(
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

export type MessageLog = InferSchemaType<typeof messageLogSchema>;

export const MessageLogModel =
  models.MessageLog || model("MessageLog", messageLogSchema);

