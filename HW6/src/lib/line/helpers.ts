import type { Message, QuickReplyItem } from "@line/bot-sdk";
import type { GameAction } from "@/lib/game/types";

const COMMAND_MAP: Record<string, GameAction> = {
  上: "MOVE_UP",
  "⬆️": "MOVE_UP",
  up: "MOVE_UP",
  u: "MOVE_UP",
  下: "MOVE_DOWN",
  "⬇️": "MOVE_DOWN",
  down: "MOVE_DOWN",
  d: "MOVE_DOWN",
  左: "MOVE_LEFT",
  "⬅️": "MOVE_LEFT",
  left: "MOVE_LEFT",
  l: "MOVE_LEFT",
  右: "MOVE_RIGHT",
  "➡️": "MOVE_RIGHT",
  right: "MOVE_RIGHT",
  r: "MOVE_RIGHT",
  地圖: "MAP",
  map: "MAP",
  "🧭": "MAP",
  hint: "HINT",
  提示: "HINT",
  "💡": "HINT",
  重來: "RESTART",
  restart: "RESTART",
  start: "START",
  開始: "START",
  狀態: "STATUS",
  status: "STATUS",
};

export function matchQuickCommand(text: string): GameAction | null {
  const normalized = text.trim().toLowerCase();
  return COMMAND_MAP[text.trim()] || COMMAND_MAP[normalized] || null;
}

export function buildQuickReplyItems(): QuickReplyItem[] {
  const items: Array<{ label: string; text: string }> = [
    { label: "⬆️ 上", text: "⬆️" },
    { label: "⬇️ 下", text: "⬇️" },
    { label: "⬅️ 左", text: "⬅️" },
    { label: "➡️ 右", text: "➡️" },
    { label: "🧭 地圖", text: "地圖" },
    { label: "💡 提示", text: "提示" },
    { label: "🔄 重來", text: "重來" },
  ];

  return items.map((item) => ({
    type: "action",
    action: {
      type: "message",
      label: item.label,
      text: item.text,
    },
  }));
}

export function buildTextMessagesWithQuickReply(texts: string[]): Message[] {
  if (texts.length === 0) {
    return [];
  }

  return texts.map((text, index) => {
    const message: Message = { type: "text", text };
    if (index === texts.length - 1) {
      message.quickReply = { items: buildQuickReplyItems() };
    }
    return message;
  });
}

