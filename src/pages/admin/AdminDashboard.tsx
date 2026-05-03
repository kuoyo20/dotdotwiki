import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import TopNav from "@/components/TopNav";
import { useUserContext } from "@/hooks/useUserContext";
import { supabase } from "@/lib/supabase";

function useAdminStats() {
  const { activeWorkspace, isCoach } = useUserContext();
  return useQuery({
    queryKey: ["admin-stats", activeWorkspace?.id],
    enabled: !!activeWorkspace && isCoach,
    queryFn: async () => {
      const wsId = activeWorkspace!.id;

      const [cohorts, members, companies] = await Promise.all([
        supabase
          .from("cohorts")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId),
        supabase
          .from("workspace_members")
          .select("user_id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .eq("role", "student"),
        supabase
          .from("companies")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId),
      ]);

      return {
        cohorts: cohorts.count ?? 0,
        students: members.count ?? 0,
        companies: companies.count ?? 0,
      };
    },
  });
}

export default function AdminDashboard() {
  const { isCoach, activeWorkspace, loading } = useUserContext();
  const { data: stats } = useAdminStats();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">載入中…</p>
      </main>
    );
  }
  if (!isCoach) return <Navigate to="/home" replace />;

  const cards = [
    {
      label: "課程班 (Cohort)",
      value: stats?.cohorts ?? "—",
      to: "/admin/cohorts",
      cta: "管理 →",
    },
    {
      label: "學員",
      value: stats?.students ?? "—",
      to: "/admin/cohorts",
      cta: "從課程班邀請 →",
    },
    {
      label: "公司",
      value: stats?.companies ?? "—",
      to: undefined,
      cta: "由學員建立",
    },
  ];

  return (
    <>
      <TopNav />
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            顧問後台
          </p>
          <h1 className="font-serif text-3xl">{activeWorkspace?.name}</h1>
        </div>

        <section className="grid sm:grid-cols-3 gap-4">
          {cards.map((s) => (
            <div
              key={s.label}
              className="border border-border rounded-lg p-5 space-y-3"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className="text-3xl font-serif">{s.value}</p>
              {s.to ? (
                <Link
                  to={s.to}
                  className="text-xs text-primary hover:underline inline-block"
                >
                  {s.cta}
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">{s.cta}</p>
              )}
            </div>
          ))}
        </section>

        <section className="border border-dashed border-border rounded-lg p-6 bg-muted/20">
          <h2 className="text-sm font-medium mb-3">下一步</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>
              <Link
                to="/admin/cohorts"
                className="text-primary hover:underline"
              >
                建一個課程班
              </Link>
              （含邀請碼）
            </li>
            <li>進入課程班 → 邀請學員 → 預設開通模組</li>
            <li>學員收信 → 點連結 → 自動進首頁，建立第一間公司</li>
          </ul>
        </section>
      </main>
    </>
  );
}
