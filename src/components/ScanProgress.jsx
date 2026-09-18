// frontend/src/components/ScanProgress.js
import { useEffect, useState } from "react";

const STEPS = [
  "Resolving DNS records",
  "Checking email security (SPF / DKIM / DMARC)",
  "Inspecting TLS certificate",
  "Analysing HTTP response & headers",
  "Scanning for exposed files",
  "Reviewing cookie flags",
  "Checking POPIA readiness indicators",
  "Writing plain-English findings",
];

export default function ScanProgress({ domain }) {
  const [pct, setPct] = useState(4);

  useEffect(() => {
    const t = setInterval(() => { setPct((p) => (p < 90 ? p + (90 - p) * 0.06 : p)); }, 300);
    return () => clearInterval(t);
  }, []);

  const activeIndex = Math.min(STEPS.length - 1, Math.floor((pct / 90) * STEPS.length));

  return (
    <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/50 cc-fade-in" role="status" aria-live="polite">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">
          Scanning <span className="font-mono text-gray-700">{domain}</span>
        </p>
        <p className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-700">{Math.round(pct)}%</p>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>

      <ul className="space-y-2.5">
        {STEPS.map((label, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={label} className={`flex items-center gap-3 text-sm ${done ? "text-gray-400" : active ? "text-gray-900" : "text-gray-300"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] transition ${done ? "border-gray-300 bg-gray-100 text-gray-500" : active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200"}`}>
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><polyline points="20 6 9 17 4 12" /></svg>
                ) : active ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                ) : null}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-xs text-gray-500">Most scans finish in 10–30 seconds. Some servers are slower to respond.</p>
    </div>
  );
}