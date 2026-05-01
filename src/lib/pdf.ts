import html2pdf from 'html2pdf.js'

// html2pdf.js's bundled .d.ts is overload-ambiguous; TS picks the
// `(element, options) => Promise<void>` overload over the no-arg
// chainable form. Coerce through a worker type so the chain stays typed.
interface Html2PdfWorker {
  from(src: HTMLElement): Html2PdfWorker
  set(opts: Record<string, unknown>): Html2PdfWorker
  save(filename?: string): Promise<void>
}
const startWorker = html2pdf as unknown as () => Html2PdfWorker

export async function exportStrategyBookPDF(elementId: string, studentName: string) {
  const el = document.getElementById(elementId)
  if (!el) throw new Error(`Element #${elementId} not found`)

  const today = new Date().toISOString().slice(0, 10)
  const filename = `銷售策略書-${studentName || '學員'}-${today}.pdf`

  await startWorker()
    .from(el)
    .set({
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    })
    .save()
}
