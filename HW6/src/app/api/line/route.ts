import { NextResponse, type NextRequest } from "next/server";
import { validateSignature } from "@line/bot-sdk";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/User";
import { GameSessionModel } from "@/lib/db/models/GameSession";
import { MessageLogModel } from "@/lib/db/models/MessageLog";
import { lineClient } from "@/lib/line/client";
import {
  buildQuickReplyItems,
  buildTextMessagesWithQuickReply,
  matchQuickCommand,
} from "@/lib/line/helpers";
import { applyAction, createNewSession, renderMap } from "@/lib/game/engine";
import { summarizeSession, type GameAction } from "@/lib/game/types";
import {
  LLMRateLimitError,
  generateHintOrFlavor,
  parseUserCommand,
} from "@/lib/llm/gemini";

const channelSecret = process.env.LINE_CHANNEL_SECRET ?? "";
let llmDisabledUntil = 0;

function buildHelpFlex() {
  return {
    type: "flex",
    altText: "Emoji Maze Puzzle 說明",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "Emoji Maze Puzzle",
            weight: "bold",
            size: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            contents: [
              { type: "text", text: "🙂 玩家", size: "sm" },
              { type: "text", text: "🧱 牆壁", size: "sm" },
              { type: "text", text: "🔑 鑰匙", size: "sm" },
              { type: "text", text: "❓ 謎題", size: "sm" },
              { type: "text", text: "🚪 出口", size: "sm" },
            ],
          },
          {
            type: "text",
            text: "操作：使用方向鍵或輸入上/下/左/右，先拿🔑，解謎，再到🚪。",
            wrap: true,
            margin: "md",
            size: "sm",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "善用快速回覆：🧭 地圖 / 💡 提示 / 🔄 重來",
            wrap: true,
            size: "sm",
          },
        ],
      },
    },
    quickReply: { items: buildQuickReplyItems() },
  };
}

async function loadUser(lineUserId: string) {
  let user = await UserModel.findOne({ lineUserId });
  if (!user) {
    user = await UserModel.create({ lineUserId });
  }
  return user;
}

async function loadSession(userId: Types.ObjectId) {
  let session = await GameSessionModel.findOne({
    userId,
    status: { $in: ["playing", "idle"] },
  });
  if (!session) {
    session = await createNewSession(userId);
  }
  return session;
}

async function handleTextEvent(
  event: any,
  userId: Types.ObjectId,
  session: any
) {
  const userText = event.message.text?.trim() ?? "";
  const normalized = userText.toLowerCase();

  await MessageLogModel.create({
    userId,
    gameSessionId: session._id,
    direction: "user",
    type: "text",
    text: userText,
    rawEvent: event,
    usedLLM: false,
  });

  if (["help", "說明", "使用說明"].some((keyword) => normalized.includes(keyword))) {
    const flex = buildHelpFlex();
    await lineClient.replyMessage(event.replyToken, [flex]);
    await MessageLogModel.create({
      userId,
      gameSessionId: session._id,
      direction: "bot",
      type: "system",
      text: "help-flex",
      usedLLM: false,
    });
    return;
  }

  let action: GameAction | null = matchQuickCommand(userText);
  let usedLLM = false;

  if (!action) {
    if (Date.now() < llmDisabledUntil) {
      action = "STATUS";
    } else {
      try {
        const parsed = await parseUserCommand(userText, summarizeSession(session));
        action = parsed.action ?? "STATUS";
        usedLLM = true;
      } catch (error) {
        if (error instanceof LLMRateLimitError) {
          llmDisabledUntil = Date.now() + 10 * 60 * 1000;
          action = "STATUS";
        } else {
          action = "STATUS";
        }
      }
    }
  }

  const result = applyAction(session, action ?? "STATUS");
  await session.save();

  const replyTexts = [...result.messages];

  if (result.needsHint) {
    if (Date.now() < llmDisabledUntil) {
      replyTexts.push("💡 提示系統正在冷卻，先探索附近吧！");
    } else {
      try {
        const hint = await generateHintOrFlavor(summarizeSession(session));
        usedLLM = true;
        replyTexts.push(`💡 提示：${hint}`);
      } catch (error) {
        if (error instanceof LLMRateLimitError) {
          llmDisabledUntil = Date.now() + 10 * 60 * 1000;
        }
        replyTexts.push("💡 提示系統目前有點忙，請稍後再試。");
      }
    }
  }

  replyTexts.push(renderMap(session));
  const lineMessages = buildTextMessagesWithQuickReply(replyTexts);
  await lineClient.replyMessage(event.replyToken, lineMessages);

  await MessageLogModel.create({
    userId,
    gameSessionId: session._id,
    direction: "bot",
    type: "text",
    text: replyTexts.join("\n---\n"),
    usedLLM,
  });
}

export async function POST(request: NextRequest) {
  if (!channelSecret) {
    return NextResponse.json({ error: "Missing channel secret" }, { status: 500 });
  }

  const signature = request.headers.get("x-line-signature") ?? "";
  const bodyText = await request.text();

  const isValid = validateSignature(bodyText, channelSecret, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(bodyText);
  await connectToDatabase();

  for (const event of body.events ?? []) {
    if (event.type !== "message" || event.message.type !== "text") {
      continue;
    }
    const lineUserId = event.source?.userId;
    if (!lineUserId) {
      continue;
    }

    const user = await loadUser(lineUserId);
    const session = await loadSession(user._id);

    try {
      await handleTextEvent(event, user._id, session);
    } catch (error) {
      console.error("Webhook error", error);
      await lineClient.replyMessage(event.replyToken, [
        {
          type: "text",
          text: "系統忙碌中，請稍後再試或使用方向按鈕移動 🙏",
          quickReply: { items: buildQuickReplyItems() },
        },
      ]);
    }
  }

  return NextResponse.json({ received: true });
}

