import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { useUserContext } from "@/hooks/useUserContext";
import { signOut } from "@/lib/auth";

export default function TopNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { activeWorkspace, isCoach } = useUserContext();

  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link to="/home" className="font-serif text-lg hover:opacity-80 transition">
          360bizthinker
        </Link>

        {activeWorkspace && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {activeWorkspace.name}
          </span>
        )}

        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/home"
            className={
              location.pathname === "/home"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground transition"
            }
          >
            首頁
          </Link>
          {isCoach && (
            <Link
              to="/admin"
              className={
                location.pathname.startsWith("/admin")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground transition"
              }
            >
              顧問後台
            </Link>
          )}
          <span className="text-muted-foreground hidden md:inline">{user?.email}</span>
          <button
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-foreground transition"
          >
            登出
          </button>
        </nav>
      </div>
    </header>
  );
}
