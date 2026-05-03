import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-8">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          dotdotwiki · v0.1
        </p>
        <h1 className="font-serif text-5xl md:text-6xl leading-tight">
          一條鏈走完
          <br />
          <span className="text-primary">健診 → 能力 → 戰略</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          中小企業主與顧問的 AI 課程中台。
          從影響力密碼到 360 戰略，模組互通互加值。
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            to="/login"
            className="inline-flex h-11 items-center px-6 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition"
          >
            登入
          </Link>
          <a
            href="https://github.com/kuoyo20/dotdotwiki"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center px-6 border border-border rounded-md font-medium hover:bg-muted transition"
          >
            GitHub
          </a>
        </div>
        <p className="text-xs text-muted-foreground pt-12">
          Phase 1 · 規劃中 · MX Beta 學員專用
        </p>
      </div>
    </main>
  );
}
