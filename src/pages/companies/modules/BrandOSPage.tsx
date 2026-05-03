import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TopNav from "@/components/TopNav";
import { useCompany } from "@/hooks/useCompanies";
import { supabase } from "@/lib/supabase";
import { MODULES } from "@/lib/modules";

interface BrandOSPayload {
  external_url?: string;
  brand_id?: string;
  brand_name?: string;
  synced_pyramid?: {
    vision?: string;
    mission?: string;
    positioning?: string;
    core_values?: unknown[];
    personality_traits?: unknown[];
  };
  synced_soul?: {
    archetype?: string;
    gender_persona?: string;
    tone_of_voice?: unknown;
  };
  synced_empathy?: {
    maps?: unknown[];
  };
  last_synced_at?: string;
}

function useBrandOSData(companyId?: string) {
  return useQuery({
    queryKey: ["brand_os", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<BrandOSPayload | null> => {
      const { data } = await supabase
        .from("module_data")
        .select("payload")
        .eq("company_id", companyId!)
        .eq("module_type", "brand_os")
        .maybeSingle();
      return (data?.payload as BrandOSPayload | null) ?? null;
    },
  });
}

export default function BrandOSPage() {
  const { id } = useParams<{ id: string }>();
  const { data: company, isLoading: cLoading } = useCompany(id);
  const { data: payload, isLoading: pLoading } = useBrandOSData(id);
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const sync = useMutation({
    mutationFn: async () => {
      setError(null);
      const { data, error: fnErr } = await supabase.functions.invoke(
        "sync-brand-os",
        { body: { company_id: id } },
      );
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.message ?? data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand_os", id] });
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
    },
  });

  if (cLoading || pLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">載入中…</p>
      </main>
    );
  }
  if (!company) return <Navigate to="/home" replace />;

  const hasPyramid = !!payload?.synced_pyramid;
  const hasSoul = !!payload?.synced_soul;
  const hasEmpathy = !!payload?.synced_empathy;
  const hasAnything = hasPyramid || hasSoul || hasEmpathy;

  const meta = MODULES.brand_os;
  const editUrl = payload?.brand_id
    ? `${meta.externalUrl}/brands/${payload.brand_id}`
    : `${meta.externalUrl}/login`;

  return (
    <>
      <TopNav />
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div>
          <Link
            to={`/companies/${company.id}`}
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            ← {company.name}
          </Link>
          <div className="flex items-baseline gap-3 mt-2">
            <h1 className="font-serif text-3xl">品牌大師</h1>
            <span className="text-xs px-2 py-0.5 border border-border rounded">
              外部模組
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            金字塔 + Soul + 同理心地圖
          </p>
        </div>

        <section className="border border-border rounded-lg p-5 space-y-4 bg-muted/20">
          <div>
            <h2 className="text-sm font-medium">為什麼是「外部模組」</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-prose leading-relaxed">
              品牌大師（Brand OS）原本是 KOI 課程在用的獨立站，現役學員仍在用，動不得。
              360bizthinker 採用「同步」整合：你在 Brand OS 完成的金字塔 / Soul /
              同理心地圖會匯回這裡，讓 360 戰略模組能拿到當作 context。
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={editUrl}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-4 inline-flex items-center bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition"
            >
              ↗ 前往 Brand OS{hasAnything ? "（編輯）" : "（建立品牌）"}
            </a>
            <button
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
              className="h-10 px-4 inline-flex items-center border border-border rounded-md text-sm font-medium hover:bg-muted transition disabled:opacity-60"
            >
              {sync.isPending
                ? "同步中…"
                : hasAnything
                  ? "重新同步"
                  : "從 Brand OS 同步"}
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-3 whitespace-pre-line">
              {error}
            </div>
          )}

          {payload?.last_synced_at && (
            <p className="text-xs text-muted-foreground">
              最後同步：
              {new Date(payload.last_synced_at).toLocaleString("zh-TW")}
            </p>
          )}
        </section>

        {hasAnything ? (
          <div className="space-y-6">
            {hasPyramid && (
              <section className="border border-border rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    品牌金字塔
                  </h2>
                  <span className="text-xs text-green-700 dark:text-green-400">
                    已同步
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  {payload?.synced_pyramid?.vision && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">願景</p>
                      <p>{payload.synced_pyramid.vision}</p>
                    </div>
                  )}
                  {payload?.synced_pyramid?.mission && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">使命</p>
                      <p>{payload.synced_pyramid.mission}</p>
                    </div>
                  )}
                  {payload?.synced_pyramid?.positioning && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">定位</p>
                      <p>{payload.synced_pyramid.positioning}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {hasSoul && (
              <section className="border border-border rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    品牌 Soul
                  </h2>
                  <span className="text-xs text-green-700 dark:text-green-400">
                    已同步
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  {payload?.synced_soul?.archetype && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Master 原型
                      </p>
                      <p>{payload.synced_soul.archetype}</p>
                    </div>
                  )}
                  {payload?.synced_soul?.gender_persona && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        性格傾向
                      </p>
                      <p>{payload.synced_soul.gender_persona}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {hasEmpathy && (
              <section className="border border-border rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    同理心地圖
                  </h2>
                  <span className="text-xs text-green-700 dark:text-green-400">
                    已同步
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  已產出 4 個消費族群分析。完整內容請到 Brand OS 查看。
                </p>
              </section>
            )}
          </div>
        ) : (
          <section className="border border-dashed border-border rounded-lg p-6 space-y-3">
            <h2 className="text-sm font-medium">尚未同步 — 操作步驟</h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
              <li>點上方「前往 Brand OS」開新分頁</li>
              <li>
                用<strong> 跟 360bizthinker 同一個 email </strong>登入或註冊
                （首次需要課程邀請碼，請洽 kuoyo）
              </li>
              <li>
                建立一個品牌，名稱跟你這間公司「
                <strong>{company.name}</strong>」一樣（系統用名字 +
                email 配對）
              </li>
              <li>完成金字塔（必填）+ Soul + 同理心地圖（選填）</li>
              <li>回來這頁，點「從 Brand OS 同步」</li>
              <li>同步成功後，戰略模組會自動讀到這些資料當 context</li>
            </ol>
          </section>
        )}
      </main>
    </>
  );
}
