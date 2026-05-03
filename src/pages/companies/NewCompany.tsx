import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import TopNav from "@/components/TopNav";
import { useUserContext } from "@/hooks/useUserContext";
import { SIZE_BANDS } from "@/lib/modules";
import { supabase } from "@/lib/supabase";

export default function NewCompany() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialType = params.get("type") === "client" ? "client" : "own";
  const { activeWorkspace, loading } = useUserContext();

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [sizeBand, setSizeBand] = useState<string>("");
  const [type, setType] = useState<"own" | "client">(initialType);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">載入中…</p>
      </main>
    );
  }
  if (!activeWorkspace) return <Navigate to="/login" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    // Get current student id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("尚未登入");
      setSubmitting(false);
      return;
    }
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!student) {
      setError("找不到 students 紀錄，請聯絡管理員");
      setSubmitting(false);
      return;
    }

    const { data: created, error: err } = await supabase
      .from("companies")
      .insert({
        workspace_id: activeWorkspace!.id,
        owner_student_id: student.id,
        company_type: type,
        name: name.trim(),
        industry: industry.trim() || null,
        size_band: sizeBand || null,
      })
      .select("id")
      .single();

    setSubmitting(false);
    if (err || !created) {
      setError(err?.message ?? "建立失敗");
      return;
    }

    navigate(`/companies/${created.id}`, { replace: true });
  }

  return (
    <>
      <TopNav />
      <main className="max-w-xl mx-auto px-6 py-12 space-y-6">
        <div>
          <Link
            to="/home"
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            ← 首頁
          </Link>
          <h1 className="font-serif text-3xl mt-2">建立公司</h1>
          <p className="text-sm text-muted-foreground mt-1">
            這間公司是你模組分析的研究主體。可以是你自己經營的、也可以是你服務的客戶。
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium block">類型</label>
            <div className="grid grid-cols-2 gap-2">
              {(["own", "client"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`p-3 border rounded-md text-left transition ${
                    type === t
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <p className="text-sm font-medium">
                    {t === "own" ? "我自己的公司" : "我服務的客戶"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t === "own"
                      ? "你經營的事業（通常 1-2 間）"
                      : "如果你是顧問，這是你的客戶公司"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block" htmlFor="name">
              公司名稱
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：苗林行"
              className="w-full h-10 px-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium block" htmlFor="industry">
                產業（選填）
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="食品流通"
                className="w-full h-10 px-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block" htmlFor="size">
                規模（選填）
              </label>
              <select
                id="size"
                value={sizeBand}
                onChange={(e) => setSizeBand(e.target.value)}
                className="w-full h-10 px-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">—</option>
                {SIZE_BANDS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full h-11 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {submitting ? "建立中…" : "建立公司"}
          </button>
        </form>
      </main>
    </>
  );
}
