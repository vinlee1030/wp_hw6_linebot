import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GameAction, SessionSummary } from "@/lib/game/types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set; LLM features will be disabled.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export class LLMRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMRateLimitError";
  }
}

async function safeGenerate(modelId: string, prompt: string) {
  if (!genAI) {
    throw new Error("Gemini client unavailable");
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 429) {
      throw new LLMRateLimitError("Gemini rate limit exceeded");
    }
    throw error;
  }
}

export async function parseUserCommand(
  input: string,
  summary: SessionSummary
): Promise<{ action: GameAction; confidence: number; reason: string }> {
  const systemPrompt = `You are a command router for the Emoji Maze Puzzle LINE game.
Allowed actions: START, MOVE_UP, MOVE_DOWN, MOVE_LEFT, MOVE_RIGHT, MAP, HINT, RESTART, STATUS.
Only reply with a strict JSON object: {"action":"ACTION","confidence":0-1,"reason":"short chinese reason"}.
Use STATUS if unsure.`;

  const context = `Session:
status=${summary.status}
coords=(${summary.playerX},${summary.playerY})
hasKey=${summary.hasKey}
riddlesSolved=${summary.riddlesSolved}
lastAction=${summary.lastAction}
steps=${summary.steps}`;

  const prompt = `${systemPrompt}
Player said: """${input}"""
${context}`;

  try {
    const text = await safeGenerate("gemini-1.5-flash", prompt);
    const jsonText = text?.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) {
      throw new Error("Gemini response missing JSON");
    }
    const parsed = JSON.parse(jsonText);
    return {
      action: parsed.action ?? "STATUS",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.4,
      reason: parsed.reason ?? "LLM解析",
    };
  } catch (error) {
    if (error instanceof LLMRateLimitError) {
      throw error;
    }
    console.error("parseUserCommand error", error);
    return { action: "STATUS", confidence: 0, reason: "fallback" };
  }
}

export async function generateHintOrFlavor(summary: SessionSummary) {
  const systemPrompt = `你是Emoji Maze Puzzle的謎題守護者，請用不超過60字的繁體中文給玩家一個與當前狀態相關的提示或敘事，避免直接告訴答案。`;

  const prompt = `${systemPrompt}
狀態：${summary.status}，座標(${summary.playerX},${summary.playerY})，鑰匙=${
    summary.hasKey ? "已取得" : "未取得"
  }，謎題已解=${summary.riddlesSolved > 0 ? "是" : "否"}，步數=${summary.steps}。`;

  try {
    const text = await safeGenerate("gemini-1.5-flash", prompt);
    return text?.trim() || "試著探索周遭，也許有新發現。";
  } catch (error) {
    if (error instanceof LLMRateLimitError) {
      throw error;
    }
    console.error("generateHintOrFlavor error", error);
    return "目前提示系統休息中，先多走幾步吧！";
  }
}

