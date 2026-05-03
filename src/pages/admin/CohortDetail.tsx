import { useState, type FormEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import TopNav from "@/components/TopNav";
import { useUserContext } from "@/hooks/useUserContext";
import { useCohort } from "@/hooks/useCohorts";
import { MODULE_TYPES, MODULES, type ModuleType } from "@/lib/modules";
import { supabase } from "@/lib/supabase";

interface InviteResult {
  email: string;
  status: "invited" | "error";
  error?: string;
}

export default function CohortDetail() {
  const { id } = useParams<{ id: string }>();
  const { isCoach, loading: ctxLoading } = useUserContext();
  const { cohort, students, loading } = useCohort(id);
  const qc = useQueryClient();

  const [emails, setEmails] = useState("");
  const [selected, setSelected] = useState<Set<ModuleType>>(
    new Set(["assessment"]),
  );
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (ctxLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">載入中…</p>
      </main>
    );
  }
  if (!isCoach) return <Navigate to="/home" replace />;
  if (!cohort) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">找不到課程班</p>
      </main>
    );
  }

  function toggleModule(m: ModuleType) {
    const next = new Set(selected);
    next.has(m) ? next.delete(m) : next.add(m);
    setSelected(next);
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    const list = emails
      .split(/[\n,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
    if (list.length === 0) {
      setError("請輸入至少一個有效 email");
      return;
    }
    if (selected.size === 0) {
      setError("請至少勾選一個模組");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResults(null);

    const { data, error: err } = await supabase.functions.invoke(
      "invite-students",
      {
        body: {
          cohort_id: cohort!.id,
          emails: list,
          modules: Array.from(selected),
        },
      },
    );

    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }

    setResults(data?.results ?? []);
    setEmails("");
    qc.invalidateQueries({ queryKey: ["cohort-students", id] });
  }

  return (
    <>
      <TopNav />
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div>
          <Link
            to="/admin/cohorts"
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            ← 課程班列表
          </Link>
          <h1 className="font-serif text-3xl mt-2">{cohort.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            邀請碼：<span className="font-mono">{cohort.invite_code}</span>
            {" · "}
            {students.length} 位學員
          </p>
        </div>

        <section className="border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-medium">+ 邀請學員</h2>

          <form onSubmit={onInvite} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">
                Email 列表（每行一個 / 逗號分隔）
              </label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={5}
                disabled={submitting}
                placeholder={"alice@example.com\nbob@example.com"}
                className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">
                預設開通模組
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MODULE_TYPES.map((m) => (
                  <label
                    key={m}
                    className={`flex items-start gap-2 p-3 border rounded-md cursor-pointer transition ${
                      selected.has(m)
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(m)}
                      onChange={() => toggleModule(m)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium">{MODULES[m].name}</p>
                      <p className="text-xs text-muted-foreground">
                        {MODULES[m].group} · {MODULES[m].description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? "邀請中…" : "寄出邀請"}
            </button>
          </form>

          {results && (
            <div className="border-t border-border pt-4 space-y-1">
              <p className="text-sm font-medium">邀請結果</p>
              <ul className="text-xs space-y-1">
                {results.map((r, i) => (
                  <li
                    key={i}
                    className={
                      r.status === "invited"
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-600"
                    }
                  >
                    {r.status === "invited" ? "✓" : "✗"} {r.email}
                    {r.error && <span> — {r.error}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">學員（{students.length}）</h2>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
              還沒有學員，從上面邀請第一位。
            </p>
          ) : (
            <ul className="divide-y divide-border border border-border rounded-md">
              {students.map((s) => (
                <li
                  key={s.students.id}
                  className="px-5 py-3 flex justify-between items-center"
                >
                  <p className="text-sm">{s.students.display_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    加入於{" "}
                    {new Date(s.enrolled_at).toLocaleDateString("zh-TW")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
