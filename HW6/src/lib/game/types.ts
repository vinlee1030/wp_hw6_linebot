import type { GameSession } from "@/lib/db/models/GameSession";

export type GameAction =
  | "START"
  | "MOVE_UP"
  | "MOVE_DOWN"
  | "MOVE_LEFT"
  | "MOVE_RIGHT"
  | "MAP"
  | "HINT"
  | "RESTART"
  | "STATUS";

export interface SessionSummary {
  sessionId: string;
  status: GameSession["status"];
  mapId: string;
  playerX: number;
  playerY: number;
  hasKey: boolean;
  riddlesSolved: number;
  steps: number;
  lastAction: string;
}

export function summarizeSession(session: GameSession): SessionSummary {
  return {
    sessionId: session._id.toString(),
    status: session.status,
    mapId: session.mapId,
    playerX: session.playerX,
    playerY: session.playerY,
    hasKey: session.hasKey,
    riddlesSolved: session.riddlesSolved,
    steps: session.steps,
    lastAction: session.lastAction,
  };
}

