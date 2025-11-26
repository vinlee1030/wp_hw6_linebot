import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { MessageLogModel } from "@/lib/db/models/MessageLog";
import { validateAdminAuth } from "@/lib/admin/auth";

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Emoji Maze Admin"' } }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!validateAdminAuth(request.headers.get("authorization"))) {
    return unauthorized();
  }

  await connectToDatabase();
  const messages = await MessageLogModel.find({
    gameSessionId: params.id,
  })
    .sort({ timestamp: 1 })
    .lean();

  return NextResponse.json(
    messages.map((message) => ({
      id: message._id.toString(),
      direction: message.direction,
      text: message.text,
      usedLLM: message.usedLLM,
      timestamp: message.timestamp,
    }))
  );
}

