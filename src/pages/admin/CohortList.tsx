import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import TopNav from "@/components/TopNav";
import { useUserContext } from "@/hooks/useUserContext";
import { useCohorts } from "@/hooks/useCohorts";
import { generateInviteCode } from "@/lib/invite-code";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export default function CohortList() {
  const { user } = useAuth();
  const { activeWorkspace, isCoach, loading: ctxLoading } = useUserContext();
  const { data: cohorts, isLoading } = useCohorts();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (ctxLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">載入中…</p>
      </main>
    );
  }
  if (!isCoach) return <Navigate to="/home" replace />;

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!user || !activeWorkspace || !name.trim()) return;

    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from("cohorts").insert({
      workspace_id: activeWorkspace.id,
      name: name.trim(),
      invite_code: generateInviteCode(),
      created_by: user.id,
    });

    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }

    setName("");
    qc.invalidateQueries({ queryKey: ["cohorts"] });
  }

  return (
    <>
      <TopNav />
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div>
          <Link
            to="/admin"
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            ← 後台
          </Link>
          <h1 className="font-serif text-3xl mt-2">課程班</h1>
          <p className="text-sm text-muted-foreground mt-1">
            建一個課程班，然後邀請學員加入。
          </p>
        </div>

        <form
          onSubmit={onCreate}
          className="border border-border rounded-lg p-5 space-y-3"
        >
          <h2 className="text-sm font-medium">+ 新增課程班</h2>
          <div className="flex gap-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：MX 第一期 Beta"
              disabled={submitting}
              className="flex-1 h-10 px-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="h-10 px-5 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? "建立中…" : "建立"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600">建立失敗：{error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            邀請碼會自動產生，建立後可在詳情頁看到。
          </p>
        </form>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">載入中…</p>
        ) : cohorts && cohorts.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
            還沒有課程班，從上面新增第一個。
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-md overflow-hidden">
            {cohorts?.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/admin/cohorts/${c.id}`}
                  className="flex justify-between items-center px-5 py-4 hover:bg-muted/30 transition"
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      邀請碼：
                      <span className="font-mono">{c.invite_code}</span>
                    </p>
                  </div>
                  <p
                    className={
                      c.is_active
                        ? "text-xs text-green-700 dark:text-green-400"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {c.is_active ? "● 進行中" : "已結束"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
