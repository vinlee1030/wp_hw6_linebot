import { headers } from "next/headers";
import { validateAdminAuth, isAdminAuthConfigured } from "@/lib/admin/auth";
import "../globals.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authHeader = headers().get("authorization");
  const authorized = validateAdminAuth(authHeader);

  if (!authorized) {
    const message = isAdminAuthConfigured()
      ? "需要管理員帳號密碼才能檢視後台。"
      : "尚未設定 ADMIN_BASIC_AUTH_USER / PASS。";
    return (
      <html lang="zh-Hant">
        <body className="bg-slate-50">
          <main className="flex min-h-screen items-center justify-center">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-700 shadow">
              <p>{message}</p>
            </div>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="zh-Hant">
      <body className="bg-slate-50">
        <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}

