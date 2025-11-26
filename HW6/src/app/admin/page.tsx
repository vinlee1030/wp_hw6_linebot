"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StatsResponse {
  totalUsers: number;
  totalSessions: number;
  totalWins: number;
  totalMessages: number;
}

interface SessionSummary {
  id: string;
  userId: string;
  displayName?: string;
  status: string;
  steps: number;
  hasKey: boolean;
  riddlesSolved: number;
  updatedAt: string;
  usedLLMCount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [query, from, to]);

  const statsUrl = "/api/admin/stats";
  const sessionsUrl = `/api/admin/sessions${queryString ? `?${queryString}` : ""}`;

  const { data: stats } = useSWR<StatsResponse>(statsUrl, fetcher, {
    refreshInterval: 3000,
  });
  const { data: sessions } = useSWR<SessionSummary[]>(sessionsUrl, fetcher, {
    refreshInterval: 3000,
  });

  const statCards = [
    { label: "使用者", value: stats?.totalUsers ?? 0 },
    { label: "遊戲場次", value: stats?.totalSessions ?? 0 },
    { label: "完成次數", value: stats?.totalWins ?? 0 },
    { label: "訊息量", value: stats?.totalMessages ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          追蹤玩家進度、LLM 使用情況與最新對話。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">查詢條件</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">使用者 ID / 暱稱</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="user123 或 Terry"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">起始日期</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">結束日期</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">最近遊戲場次</h2>
          <p className="text-sm text-slate-500">
            {sessions ? `${sessions.length} 筆` : "載入中..."}
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="px-3 py-2 font-medium">使用者</th>
                <th className="px-3 py-2 font-medium">狀態</th>
                <th className="px-3 py-2 font-medium">步數</th>
                <th className="px-3 py-2 font-medium">鑰匙</th>
                <th className="px-3 py-2 font-medium">謎題</th>
                <th className="px-3 py-2 font-medium">LLM 次數</th>
                <th className="px-3 py-2 font-medium">更新時間</th>
              </tr>
            </thead>
            <tbody>
              {(sessions ?? []).map((session) => (
                <tr
                  key={session.id}
                  className="cursor-pointer border-b border-slate-100 text-slate-800 hover:bg-slate-50"
                  onClick={() => router.push(`/admin/sessions/${session.id}`)}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {session.displayName || session.userId}
                    </div>
                    <div className="text-xs text-slate-500">{session.userId}</div>
                  </td>
                  <td className="px-3 py-2">{session.status}</td>
                  <td className="px-3 py-2">{session.steps}</td>
                  <td className="px-3 py-2">{session.hasKey ? "✅" : "🚫"}</td>
                  <td className="px-3 py-2">
                    {session.riddlesSolved > 0 ? "✅" : "🚫"}
                  </td>
                  <td className="px-3 py-2">{session.usedLLMCount}</td>
                  <td className="px-3 py-2">
                    {new Date(session.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

