// frontend/src/components/ScoreHero.js
import { useState } from "react";
import ScoreGauge from "./ScoreGauge";
import { SEVERITY, SEVERITY_ORDER, scoreBand } from "../lib/theme";
import { toast } from "../lib/toast";

export default function ScoreHero({
  domain,
  score,
  grade,
  summary,
  counts,
  scannedAt,
  scanId,
  source,
  previous,
  onRescan,
  onShare,
}) {
  const band = scoreBand(score);
  const delta = previous ? score - previous.score : 0;
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    try {
      // onShare mints a real, expiring share link via the backend (or, if
      // we're already viewing someone else's shared report, just returns the
      // current URL) - not just a copy of the current address bar.
      const url = await onShare();
      await navigator.clipboard.writeText(url);
      toast("Share link copied", { kind: "success" });
    } catch (err) {
      if (err?.name === "NotAllowedError" || err?.message?.includes("clipboard")) {
        window.prompt("Copy this link:", err.url || "");
      } else {
        toast(err?.message || "Could not create a share link", { kind: "error" });
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border ${band.heroBorder} bg-gradient-to-br ${band.heroBg} p-6 sm:p-8`}
    >
      <div
        className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full ${band.blobA} opacity-40 blur-3xl`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full ${band.blobB} opacity-30 blur-3xl`}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
        <ScoreGauge
          score={score}
          grade={grade}
          ringColor={band.ring}
          ringTrack={band.ringTrack}
          size={170}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${band.chip}`}
            >
              {band.label}
            </span>

            {previous && delta !== 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  delta > 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
                title={`Previous score: ${previous.score}`}
              >
                {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} since last scan
              </span>
            )}

            {source === "shared" && (
              <span
                className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-700"
                title="You're viewing a report shared by someone else."
              >
                Shared report
              </span>
            )}
          </div>

          <h2 className="mt-3 truncate font-mono text-lg font-semibold text-gray-900 sm:text-xl">
            {domain}
          </h2>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <span>Scanned {new Date(scannedAt).toLocaleString()}</span>
            {scanId && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">ID {scanId}</span>
              </>
            )}
            <span
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700"
              title="Passive checks only. No logins, no exploitation, no port scanning."
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Non-invasive
            </span>
          </p>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-700">{summary}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {SEVERITY_ORDER.filter((s) => counts[s] > 0).map((s) => {
              const meta = SEVERITY[s];
              return (
                <span
                  key={s}
                  className={`inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-xs font-medium ${meta.chip}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  <span className="tabular-nums">{counts[s]}</span>
                  <span className="opacity-75">{meta.label}</span>
                </span>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {onRescan && (
              <button
                type="button"
                onClick={onRescan}
                className="rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              >
                Re-scan
              </button>
            )}
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:opacity-50"
            >
              {sharing ? "Creating link…" : "Copy share link"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
