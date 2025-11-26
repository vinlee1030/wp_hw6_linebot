import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/User";
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

  const [totalUsers, totalSessions, totalWins, totalMessages] = await Promise.all([
    UserModel.countDocuments(),
    GameSessionModel.countDocuments(),
    GameSessionModel.countDocuments({ status: "won" }),
    MessageLogModel.countDocuments(),
  ]);

  return NextResponse.json({ totalUsers, totalSessions, totalWins, totalMessages });
}

