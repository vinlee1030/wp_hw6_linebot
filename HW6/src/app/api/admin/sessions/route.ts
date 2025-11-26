import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { GameSessionModel } from "@/lib/db/models/GameSession";
import { MessageLogModel } from "@/lib/db/models/MessageLog";
import { validateAdminAuth } from "@/lib/admin/auth";

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Emoji Maze Admin"' } }
  );
}

export async function GET(request: NextRequest) {
  if (!validateAdminAuth(request.headers.get("authorization"))) {
    return unauthorized();
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions: Record<string, any> = {};
  if (from || to) {
    conditions.updatedAt = {};
    if (from) conditions.updatedAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      conditions.updatedAt.$lte = end;
    }
  }

  const sessions = await GameSessionModel.find(conditions)
    .sort({ updatedAt: -1 })
    .limit(50)
    .populate("userId")
    .lean();

  const filtered = q
    ? sessions.filter((session) => {
        const user = session.userId as any;
        return (
          user?.lineUserId?.toLowerCase().includes(q) ||
          user?.displayName?.toLowerCase().includes(q)
        );
      })
    : sessions;

  const ids = filtered.map((s) => s._id);
  const llmCounts = await MessageLogModel.aggregate([
    { $match: { gameSessionId: { $in: ids }, usedLLM: true } },
    { $group: { _id: "$gameSessionId", count: { $sum: 1 } } },
  ]);
  const llmMap = new Map(
    llmCounts.map((entry) => [entry._id.toString(), entry.count])
  );

  const response = filtered.map((session) => ({
    id: session._id.toString(),
    userId: (session.userId as any)?.lineUserId ?? "unknown",
    displayName: (session.userId as any)?.displayName,
    status: session.status,
    steps: session.steps,
    hasKey: session.hasKey,
    riddlesSolved: session.riddlesSolved,
    updatedAt: session.updatedAt,
    usedLLMCount: llmMap.get(session._id.toString()) ?? 0,
  }));

  return NextResponse.json(response);
}

