export default function Login() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6 border border-border rounded-lg p-8">
        <h1 className="font-serif text-3xl">登入</h1>
        <p className="text-muted-foreground text-sm">
          W1 任務：Magic link + Google OAuth — 尚未實作。
        </p>
        <div className="text-xs text-muted-foreground border-t border-border pt-4">
          Placeholder — Phase 1 W1 將建置：
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>顧問端：Google OAuth（限 admin email）</li>
            <li>學員端：Email magic link / invite code</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
