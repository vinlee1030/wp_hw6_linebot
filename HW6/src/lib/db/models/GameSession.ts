import { Schema, model, models, type InferSchemaType } from "mongoose";

const gameSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["idle", "playing", "won", "lost"],
      default: "playing",
    },
    mapId: { type: String, default: "maze1" },
    playerX: { type: Number, default: 1 },
    playerY: { type: Number, default: 1 },
    hasKey: { type: Boolean, default: false },
    riddlesSolved: { type: Number, default: 0 },
    steps: { type: Number, default: 0 },
    lastAction: { type: String, default: "START" },
  },
  { timestamps: true }
);

export type GameSession = InferSchemaType<typeof gameSessionSchema>;

export const GameSessionModel =
  models.GameSession || model("GameSession", gameSessionSchema);

