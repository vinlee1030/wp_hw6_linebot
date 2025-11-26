import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/connect";
import { GameSessionModel } from "@/lib/db/models/GameSession";
import { MessageLogModel } from "@/lib/db/models/MessageLog";
import { renderMap } from "@/lib/game/engine";

interface SessionPageProps {
  params: { id: string };
}

export default async function SessionPage({ params }: SessionPageProps) {
  await connectToDatabase();
  const session = await GameSessionModel.findById(params.id).populate("userId");
  if (!session) {
    notFound();
  }

  const messages = await MessageLogModel.find({
    gameSessionId: session._id,
  })
    .sort({ timestamp: 1 })
    .lean();

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <a href="/admin" className="text-sm text-slate-500 underline">
        ← 回列表
      </a>

      <section className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">使用者</p>
          <p className="text-lg font-semibold text-slate-900">
            {(session.userId as any)?.displayName || (session.userId as any)?.lineUserId}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">狀態</p>
          <p className="text-lg font-semibold text-slate-900">{session.status}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">步數</p>
          <p className="text-lg font-semibold text-slate-900">{session.steps}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">鑰匙</p>
          <p className="text-lg font-semibold text-slate-900">
            {session.hasKey ? "已取得" : "尚未取得"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">謎題</p>
          <p className="text-lg font-semibold text-slate-900">
            {session.riddlesSolved > 0 ? "已解" : "未解"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">最後動作</p>
          <p className="text-lg font-semibold text-slate-900">
            {session.lastAction}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-slate-50 p-4 font-mono text-sm text-slate-800">
        <pre>{renderMap(session as any)}</pre>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">對話紀錄</h2>
        <div className="mt-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message._id.toString()}
              className={`rounded-lg border px-4 py-3 text-sm ${
                message.direction === "user"
                  ? "border-sky-100 bg-sky-50 text-slate-900"
                  : "border-emerald-100 bg-emerald-50 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{message.direction === "user" ? "玩家" : "Bot"}</span>
                <span>{new Date(message.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-2 whitespace-pre-line">{message.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

