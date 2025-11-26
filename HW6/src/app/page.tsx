import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <section className="rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-slate-900">
          Emoji Maze Puzzle
        </h1>
        <p className="mt-4 text-slate-700">
          這是 HW6 的 LINE 聊天機器人後端。加入我們的 LINE Bot 後，就能在龐克風 Emoji
          迷宮中收集 🔑、解開 ❓，再逃向 🚪。
        </p>
        <div className="mt-6 space-y-2 text-sm text-slate-600">
          <p>Step 1. 將 LINE Bot 加為好友（QR code 或 ID 可放在此處）。</p>
          <p>Step 2. 說「開始」或使用快速回覆移動角色。</p>
          <p>Step 3. 蒐集鑰匙、解謎、抵達出口即可過關！</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">管理後台</h2>
        <p className="mt-2 text-sm text-slate-600">
          課程助教可透過下方連結登入後台，查看玩家進度、對話紀錄與 LLM 使用狀態。
        </p>
        <Link
          href="/admin"
          className="mt-4 inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          進入 Admin Dashboard
        </Link>
      </section>
    </main>
  );
}

