// frontend/src/components/PriorityPanel.js
import { SEVERITY } from "../lib/theme";

const RANK = { critical: 0, high: 1, medium: 2 };

export default function PriorityPanel({ categories, onJump }) {
  const flat = categories
    .flatMap((c) => c.findings.filter((f) => RANK[f.severity] !== undefined).map((f) => ({ ...f, categoryId: c.id, categoryLabel: c.label })))
    .sort((a, b) => RANK[a.severity] - RANK[b.severity])
    .slice(0, 5);

  if (!flat.length) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-200 opacity-40 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">No urgent actions</h3>
            <p className="mt-1 text-sm text-emerald-800">
              Nothing critical or high-severity was found. Review the medium-severity items below to tighten things up further.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Fix these first</h3>
        <p className="text-xs text-gray-500">Start at the top</p>
      </header>
      <ol className="space-y-2.5">
        {flat.map((f, i) => {
          const meta = SEVERITY[f.severity];
          return (
            <li key={f.id}>
              <button type="button" onClick={() => onJump(f.categoryId, f.id)}
                className={`group flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${meta.edge} border-l-4`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-900 text-sm font-bold text-white">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.chip}`}>
                      <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="truncate text-[11px] text-gray-500">{f.categoryLabel}</span>
                  </span>
                  <span className="mt-1 block text-sm font-medium text-gray-900 group-hover:underline">{f.title}</span>
                </span>
                <span className="text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-700" aria-hidden="true">→</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}