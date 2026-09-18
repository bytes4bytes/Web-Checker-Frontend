// frontend/src/components/FindingCard.js
import { useId, useState } from "react";
import { SEVERITY } from "../lib/theme";
import { toast } from "../lib/toast";

function formatForDeveloper(f) {
  return [
    `[${(f.severity || "info").toUpperCase()}] ${f.title}`,
    "",
    `What it means: ${f.what || "-"}`,
    `Why it matters: ${f.why || "-"}`,
    `What to do:    ${f.fix || "-"}`,
    f.evidence ? `\nEvidence:\n${f.evidence}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function FindingCard({ finding, id }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const meta = SEVERITY[finding.severity] || SEVERITY.info;

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatForDeveloper(finding));
      toast("Finding copied for your developer", { kind: "success" });
    } catch {
      toast("Could not access clipboard", { kind: "error" });
    }
  }

  return (
    <li
      id={id}
      className={`overflow-hidden rounded-xl border border-l-4 border-gray-200 bg-white transition-shadow hover:shadow-sm ${meta.edge}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.chip}`}
        >
          {meta.label}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-900">{finding.title}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div id={contentId} className="border-t border-gray-100 px-4 pb-4 pt-3">
          <dl className="space-y-3.5 text-sm">
            {finding.what && <Field label="What it means" value={finding.what} />}
            {finding.why && <Field label="Why it matters" value={finding.why} />}
            {finding.fix && <Field label="What to do" value={finding.fix} accent />}
            {finding.evidence && (
              <div>
                <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Evidence
                </dt>
                <dd>
                  <pre className="overflow-x-auto rounded-lg bg-gray-900 px-3 py-2 text-xs leading-relaxed text-gray-100">
                    {finding.evidence}
                  </pre>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={copy}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              Copy for developer
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function Field({ label, value, accent }) {
  return (
    <div>
      <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className={accent ? "font-medium text-gray-900" : "text-gray-700"}>{value}</dd>
    </div>
  );
}