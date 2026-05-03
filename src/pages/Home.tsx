export default function Home() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl mb-2">學員首頁</h1>
      <p className="text-muted-foreground mb-8">
        W2 任務：列出學員的公司 + 模組進度卡片。
      </p>
      <div className="border border-border rounded-lg p-6 bg-muted/30 text-sm text-muted-foreground">
        Placeholder — Phase 1 W2 將建置：
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>「我的公司」（own）+「我服務的客戶」（client）兩區</li>
          <li>「+ 建立第一間公司」CTA</li>
          <li>每間公司下顯示 6 個模組卡片（已開通 / 進行中 / 已完成）</li>
        </ul>
      </div>
    </main>
  );
}
