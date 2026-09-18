// frontend/src/components/CategoryCard.js
import CategoryIcon from "./CategoryIcon";
import { SEVERITY, SEVERITY_ORDER } from "../lib/theme";

export default function CategoryCard({ category, onJump }) {
  const { id, label, score, findings } = category;
  const counts = {};
  let worst = "pass";
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] || 0) + 1;
    if (SEVERITY[f.severity]?.rank < SEVERITY[worst]?.rank) worst = f.severity;
  }
  const worstMeta = SEVERITY[worst] || SEVERITY.info;
  const issues = findings.length - (counts.pass || 0);

  return (
    <button type="button" onClick={() => onJump(id)}
      className="group flex w-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900">
      <div className="flex items-start justify-between">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${worstMeta.soft} ${worstMeta.text}`}>
          <CategoryIcon id={id} className="h-5 w-5" />
        </span>
        <span className="text-2xl font-bold tabular-nums text-gray-900">{score}</span>
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {issues === 0 ? "No issues" : `${issues} issue${issues === 1 ? "" : "s"}`}
        </p>
      </div>
      <div className="mt-auto h-1 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${worstMeta.bar} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
      <div className="flex items-center gap-1.5">
        {SEVERITY_ORDER.filter((s) => counts[s] > 0).map((s) => (
          <span key={s} className={`h-1.5 w-1.5 rounded-full ${SEVERITY[s].dot}`} title={`${counts[s]} ${SEVERITY[s].label}`} />
        ))}
      </div>
    </button>
  );
}