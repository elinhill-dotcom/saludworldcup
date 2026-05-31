"use client";

type Props = {
  password: string;
  onMessage: (msg: string, isError?: boolean) => void;
};

export function AdminExport({ password, onMessage }: Props) {
  async function downloadCsv() {
    onMessage("");
    try {
      const res = await fetch("/api/admin/export?format=csv", {
        headers: { "x-admin-password": password },
      });
      if (!res.ok) {
        const data = await res.json();
        onMessage(data.error ?? "Export failed", true);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `world-cup-picks-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      onMessage("Excel file downloaded (CSV format).");
    } catch {
      onMessage("Export failed", true);
    }
  }

  function openPdfView() {
    onMessage("");
    const url = `/api/admin/export?format=pdf`;
    fetch(url, { headers: { "x-admin-password": password } })
      .then((res) => {
        if (!res.ok) throw new Error("Export failed");
        return res.text();
      })
      .then((html) => {
        const win = window.open("", "_blank");
        if (!win) {
          onMessage("Allow pop-ups to open the PDF view.", true);
          return;
        }
        win.document.write(html);
        win.document.close();
        onMessage("Print view opened — use Print / Save as PDF in the browser.");
      })
      .catch(() => onMessage("Export failed", true));
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
      <h3 className="font-semibold">Download all picks</h3>
      <p className="text-sm text-[var(--muted)]">
        Export every player&apos;s group scores and knockout picks.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={downloadCsv}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
        >
          Download Excel (.csv)
        </button>
        <button
          type="button"
          onClick={openPdfView}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Open PDF / print view
        </button>
      </div>
    </section>
  );
}
