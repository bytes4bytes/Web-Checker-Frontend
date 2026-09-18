// frontend/src/components/ReportActions.js
import { useState } from "react";
import { mailtoReport, whatsappShareUrl, buildEmailBody } from "../lib/report";
import { toast } from "../lib/toast";

export default function ReportActions({ result, pdfUrl }) {
  const [busy, setBusy] = useState(false);

  function email() {
    window.location.href = mailtoReport(result);
  }

  function whatsapp() {
    window.open(whatsappShareUrl(result), "_blank", "noopener,noreferrer");
  }

  async function copyAll() {
    setBusy(true);
    try {
      await navigator.clipboard.writeText(buildEmailBody(result));
      toast("Full report copied to clipboard", { kind: "success" });
    } catch {
      toast("Could not access clipboard", { kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        onClick={email}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
      >
        ✉ Email report
      </button>
      <button
        type="button"
        onClick={whatsapp}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 font-medium text-emerald-800 transition hover:border-emerald-700 hover:bg-emerald-100"
      >
        Share on WhatsApp
      </button>
      {pdfUrl && (
        // A real server-rendered PDF (app/reports/pdf.py on the backend) -
        // not a browser print-to-PDF dialog, so it always looks the same
        // regardless of the viewer's browser/OS print settings.
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
        >
          Download PDF
        </a>
      )}
      <button
        type="button"
        onClick={copyAll}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900 disabled:opacity-50"
      >
        {busy ? "Copying…" : "Copy full report"}
      </button>
    </div>
  );
}
