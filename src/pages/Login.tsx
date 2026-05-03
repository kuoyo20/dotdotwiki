import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { signInWithMagicLink } from "@/lib/auth";

type Status = "idle" | "sending" | "sent" | "error";

export default function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setError(null);
    const { error: err } = await signInWithMagicLink(email.trim());
    if (err) {
      setStatus("error");
      setError(err.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-2">
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition"
          >
            ← 360bizthinker
          </Link>
          <h1 className="font-serif text-3xl">登入 / 註冊</h1>
          <p className="text-sm text-muted-foreground">
            輸入 email，我們會寄一封登入連結給你。沒有帳號的話會自動建立。
          </p>
        </div>

        {status === "sent" ? (
          <div className="border border-border rounded-md p-6 space-y-2 bg-muted/30">
            <p className="font-medium">📬 登入連結已寄出</p>
            <p className="text-sm text-muted-foreground">
              請到 <strong>{email}</strong> 收信，點信中的連結回到這個網站。
              連結 1 小時內有效。
            </p>
            <button
              onClick={() => {
                setStatus("idle");
                setEmail("");
              }}
              className="text-sm text-primary hover:underline pt-2"
            >
              改用其他 email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium block">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === "sending"}
                className="w-full h-11 px-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full h-11 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {status === "sending" ? "寄送中…" : "寄送登入連結"}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              第一次來？直接輸入 email 即可，系統自動建立帳號。
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
