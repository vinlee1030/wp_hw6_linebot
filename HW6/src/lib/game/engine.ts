import { Types } from "mongoose";
import { GameSessionModel, type GameSession } from "@/lib/db/models/GameSession";
import { MAPS } from "./maps";
import type { GameAction } from "./types";

const DEFAULT_MAP_ID = "maze1";
const START_X = 1;
const START_Y = 1;

function getMap(session: GameSession) {
  return MAPS[session.mapId] ?? MAPS[DEFAULT_MAP_ID];
}

export async function createNewSession(userId: Types.ObjectId) {
  return GameSessionModel.create({
    userId,
    status: "playing",
    mapId: DEFAULT_MAP_ID,
    playerX: START_X,
    playerY: START_Y,
    hasKey: false,
    riddlesSolved: 0,
    steps: 0,
    lastAction: "START",
  });
}

export function renderMap(session: GameSession) {
  const map = getMap(session);
  const rows = map.map((row, y) =>
    row
      .map((cell, x) => {
        if (session.playerX === x && session.playerY === y) {
          return "🙂";
        }
        switch (cell) {
          case "W":
            return "🧱";
          case "K":
            return session.hasKey ? "⬜" : "🔑";
          case "E":
            return "🚪";
          case "R":
            return session.riddlesSolved > 0 ? "⬜" : "❓";
          default:
            return "⬜";
        }
      })
      .join("")
  );

  rows.push("Legend: 🙂你 🧱牆 🔑鑰匙 🚪出口 ❓謎題 ⬜可走");
  return rows.join("\n");
}

export function applyAction(
  session: GameSession,
  action: GameAction
): { session: GameSession; messages: string[]; needsHint: boolean } {
  const messages: string[] = [];
  let needsHint = false;
  const map = getMap(session);

  const movePlayer = (dx: number, dy: number) => {
    const nextX = session.playerX + dx;
    const nextY = session.playerY + dy;
    const target = map[nextY]?.[nextX];
    if (!target || target === "W") {
      messages.push("那裡有牆或超出地圖範圍，走不過去。");
      return;
    }
    session.playerX = nextX;
    session.playerY = nextY;
    session.steps += 1;
    messages.push(`你往${dy === -1 ? "上" : dy === 1 ? "下" : dx === -1 ? "左" : "右"}走了一步。`);
    handleTile(target);
  };

  const handleTile = (tile: string) => {
    if (tile === "K" && !session.hasKey) {
      session.hasKey = true;
      messages.push("你撿起了🔑鑰匙！");
    }
    if (tile === "R" && session.riddlesSolved === 0) {
      session.riddlesSolved = 1;
      needsHint = true;
      messages.push("你觸發了❓謎題，解開它才能更接近出口。");
    }
    if (tile === "E") {
      if (session.hasKey && session.riddlesSolved > 0) {
        session.status = "won";
        messages.push("🚪 你帶著鑰匙與謎題答案抵達出口，順利逃出迷宮！");
      } else {
        messages.push(
          "出口目前上鎖，確定已取得鑰匙並解開謎題後再回來。"
        );
      }
    }
  };

  switch (action) {
    case "MOVE_UP":
      movePlayer(0, -1);
      break;
    case "MOVE_DOWN":
      movePlayer(0, 1);
      break;
    case "MOVE_LEFT":
      movePlayer(-1, 0);
      break;
    case "MOVE_RIGHT":
      movePlayer(1, 0);
      break;
    case "RESTART":
      session.status = "playing";
      session.playerX = START_X;
      session.playerY = START_Y;
      session.hasKey = false;
      session.riddlesSolved = 0;
      session.steps = 0;
      session.lastAction = "RESTART";
      messages.push("遊戲重新開始，回到入口。");
      break;
    case "MAP":
      messages.push("🧭 目前的迷宮地圖：");
      break;
    case "STATUS":
      messages.push(
        `狀態：${session.status}，步數 ${session.steps}，鑰匙：${
          session.hasKey ? "已取得" : "未取得"
        }，謎題：${session.riddlesSolved > 0 ? "已解" : "未解"}。`
      );
      break;
    case "HINT":
      needsHint = true;
      messages.push("你向謎題守護者尋求提示...");
      break;
    case "START":
      messages.push("Emoji Maze Puzzle 開始！試著走到🔑與🚪吧。");
      break;
    default:
      messages.push("我不太明白你的動作，請用方向鍵或輸入移動指令。");
  }

  if (
    action === "MAP" ||
    action === "STATUS" ||
    action === "START" ||
    action === "HINT"
  ) {
    session.lastAction = action;
  } else if (action.startsWith("MOVE")) {
    session.lastAction = action;
  }

  return { session, messages, needsHint };
}

