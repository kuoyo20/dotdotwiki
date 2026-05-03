import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import TopNav from "@/components/TopNav";
import { useCompany } from "@/hooks/useCompanies";
import { useUserContext } from "@/hooks/useUserContext";
import { MODULES, MODULE_TYPES, type ModuleType } from "@/lib/modules";
import { supabase } from "@/lib/supabase";

interface ModuleStatus {
  module_type: ModuleType;
  enabled: boolean;
  status: "locked" | "not_started" | "in_progress" | "completed";
}

function useCompanyModules(companyId: string | undefined) {
  const { activeWorkspace } = useUserContext();
  return useQuery({
    queryKey: ["company-modules", companyId, activeWorkspace?.id],
    enabled: !!companyId && !!activeWorkspace,
    queryFn: async (): Promise<ModuleStatus[]> => {
      const { data: access, error: accessErr } = await supabase
        .from("student_module_access")
        .select("module_type, is_enabled");
      if (accessErr) throw accessErr;
      const enabledSet = new Set(
        (access ?? [])
          .filter((a) => a.is_enabled)
          .map((a) => a.module_type as ModuleType),
      );

      const { data: dataRows, error: mdErr } = await supabase
        .from("module_data")
        .select("module_type, status")
        .eq("company_id", companyId!);
      if (mdErr) throw mdErr;
      const statusMap = new Map<ModuleType, string>();
      for (const row of dataRows ?? []) {
        statusMap.set(row.module_type as ModuleType, row.status);
      }

      return MODULE_TYPES.map((m) => {
        const enabled = enabledSet.has(m);
        let status: ModuleStatus["status"] = "locked";
        if (enabled) {
          const s = statusMap.get(m);
          if (s === "completed") status = "completed";
          else if (s === "in_progress" || s === "draft") status = "in_progress";
          else status = "not_started";
        }
        return { module_type: m, enabled, status };
      });
    },
  });
}

const STATUS_LABEL: Record<ModuleStatus["status"], string> = {
  locked: "未開通",
  not_started: "尚未開始",
  in_progress: "進行中",
  completed: "已完成",
};

const STATUS_CLASS: Record<ModuleStatus["status"], string> = {
  locked: "text-muted-foreground",
  not_started: "text-foreground",
  in_progress: "text-blue-700 dark:text-blue-400",
  completed: "text-green-700 dark:text-green-400",
};

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: company, isLoading, error } = useCompany(id);
  const { data: modules } = useCompanyModules(id);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">載入中…</p>
      </main>
    );
  }
  if (error) return <Navigate to="/home" replace />;
  if (!company) return <Navigate to="/home" replace />;

  return (
    <>
      <TopNav />
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div>
          <Link
            to="/home"
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            ← 我的公司
          </Link>
          <div className="flex items-baseline gap-3 mt-2">
            <h1 className="font-serif text-3xl">{company.name}</h1>
            <span className="text-xs px-2 py-0.5 border border-border rounded">
              {company.company_type === "own" ? "我的公司" : "客戶"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {company.industry ?? "—"}
            {company.size_band && ` · ${company.size_band}`}
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            模組
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules?.map((m) => {
              const meta = MODULES[m.module_type];
              const card = (
                <div
                  className={`p-5 border rounded-lg space-y-2 transition ${
                    m.enabled
                      ? "border-border hover:border-primary cursor-pointer"
                      : "border-border bg-muted/20 opacity-60"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {meta.group}
                      </p>
                      <p className="font-medium mt-1">{meta.name}</p>
                    </div>
                    <p className={`text-xs ${STATUS_CLASS[m.status]}`}>
                      {STATUS_LABEL[m.status]}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {meta.description}
                  </p>
                  {meta.external && m.enabled && (
                    <p className="text-xs text-muted-foreground italic">
                      （此模組會跳轉到外部站點）
                    </p>
                  )}
                </div>
              );
              if (!m.enabled) {
                return <div key={m.module_type}>{card}</div>;
              }
              if (meta.external && meta.externalUrl) {
                return (
                  <a
                    key={m.module_type}
                    href={meta.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {card}
                  </a>
                );
              }
              return (
                <Link
                  key={m.module_type}
                  to={`/companies/${company.id}/${m.module_type}`}
                >
                  {card}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border border-dashed border-border rounded-lg p-6 bg-muted/20">
          <h2 className="text-sm font-medium mb-2">W3-W7 將建置</h2>
          <p className="text-xs text-muted-foreground">
            點擊已開通的模組會進入該模組的工作頁。Phase 1 期間 W3 開始逐個實作。
          </p>
        </section>
      </main>
    </>
  );
}
