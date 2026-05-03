import { Link } from "react-router-dom";
import TopNav from "@/components/TopNav";
import { useCompanies, type Company } from "@/hooks/useCompanies";
import { useUserContext } from "@/hooks/useUserContext";

function CompanyCard({ c }: { c: Company }) {
  return (
    <Link
      to={`/companies/${c.id}`}
      className="block p-5 border border-border rounded-lg hover:border-primary transition space-y-2"
    >
      <p className="font-medium">{c.name}</p>
      <p className="text-xs text-muted-foreground">
        {c.industry ?? "—"}
        {c.size_band && ` · ${c.size_band}`}
      </p>
    </Link>
  );
}

function EmptyState({ type }: { type: "own" | "client" }) {
  return (
    <Link
      to={`/companies/new?type=${type}`}
      className="block p-6 border border-dashed border-border rounded-lg text-center hover:border-primary hover:bg-muted/20 transition"
    >
      <p className="text-sm font-medium">
        + 建立第一間{type === "own" ? "公司" : "客戶"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {type === "own"
          ? "你自己經營的事業"
          : "如果你是顧問，這是你服務的客戶"}
      </p>
    </Link>
  );
}

export default function Home() {
  const { activeWorkspace, activeRole, loading: ctxLoading } = useUserContext();
  const { data: companies, isLoading } = useCompanies();

  const own = companies?.filter((c) => c.company_type === "own") ?? [];
  const client = companies?.filter((c) => c.company_type === "client") ?? [];

  return (
    <>
      <TopNav />
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl">首頁</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ctxLoading
                ? "載入中…"
                : `${activeWorkspace?.name ?? ""} · ${
                    activeRole === "admin"
                      ? "管理員"
                      : activeRole === "coach"
                        ? "顧問"
                        : "學員"
                  }`}
            </p>
          </div>
          <Link
            to="/companies/new"
            className="h-10 px-4 inline-flex items-center bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition"
          >
            + 新增公司
          </Link>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            我的公司
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">載入中…</p>
          ) : own.length === 0 ? (
            <EmptyState type="own" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {own.map((c) => (
                <CompanyCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            我服務的客戶
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">載入中…</p>
          ) : client.length === 0 ? (
            <EmptyState type="client" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {client.map((c) => (
                <CompanyCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
