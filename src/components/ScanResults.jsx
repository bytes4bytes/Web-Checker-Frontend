// frontend/src/components/ScanResults.js
import { useEffect, useMemo, useState } from "react";
import CategoryGrid from "./CategoryGrid";
import FindingCard from "./FindingCard";
import PriorityPanel from "./PriorityPanel";
import ReportActions from "./ReportActions";
import ScoreHero from "./ScoreHero";
import { SEVERITY, SEVERITY_ORDER } from "../lib/theme";

const LAST_KEY = (domain) => `cybercheck:last:${domain}`;

function readLastScan(domain) {
  try {
    const raw = localStorage.getItem(LAST_KEY(domain));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLastScan(domain, snapshot) {
  try {
    localStorage.setItem(LAST_KEY(domain), JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export default function ScanResults({ result, onRescan, onShare, onBack, pdfUrl }) {
  const {
    domain,
    scanned_at,
    scan_id,
    score,
    grade,
    summary,
    counts,
    categories,
    source,
  } = result;

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [previous, setPrevious] = useState(null);

  useEffect(() => {
    const prev = readLastScan(domain);
    if (prev && prev.scanned_at !== scanned_at) setPrevious(prev);
    writeLastScan(domain, { score, scanned_at });
  }, [domain, score, scanned_at]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        findings: c.findings.filter((f) => {
          if (filter !== "all" && f.severity !== filter) return false;
          if (!q) return true;
          return (
            f.title.toLowerCase().includes(q) ||
            (f.what || "").toLowerCase().includes(q) ||
            (f.why || "").toLowerCase().includes(q) ||
            (f.fix || "").toLowerCase().includes(q)
          );
        }),
      }))
      .filter((c) => c.findings.length > 0);
  }, [categories, filter, query]);

  function jumpTo(categoryId, findingId) {
    setFilter("all");
    setQuery("");
    requestAnimationFrame(() => {
      const el = findingId && document.getElementById(findingId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.querySelector("button")?.focus({ preventScroll: true });
      } else {
        document
          .getElementById(`cat-${categoryId}`)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  return (
    <div className="mx-auto mt-8 max-w-4xl space-y-8 cc-fade-in">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to home
        </button>
      )}

      <ScoreHero
        domain={domain}
        score={score}
        grade={grade}
        summary={summary}
        counts={counts}
        scannedAt={scanned_at}
        scanId={scan_id}
        source={source}
        previous={previous}
        onRescan={onRescan}
        onShare={onShare}
      />

      <div className="flex flex-wrap items-center gap-2">
        <ReportActions result={result} pdfUrl={pdfUrl} />
      </div>

      <PriorityPanel categories={categories} onJump={jumpTo} />

      <CategoryGrid categories={categories} onJump={(id) => jumpTo(id)} />

      <section>
        <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-900">All findings</h3>
          <div className="flex flex-wrap items-center gap-2">
            {SEVERITY_ORDER.filter((s) => counts[s] > 0).map((s) => {
              const meta = SEVERITY[s];
              const active = filter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(active ? "all" : s)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                    active
                      ? "border-gray-900 bg-gray-900 text-white"
                      : `${meta.chip} hover:border-gray-900`
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? "bg-white" : meta.dot
                    }`}
                  />
                  <span className="tabular-nums">{counts[s]}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </header>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 focus-within:border-gray-900">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 text-gray-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search findings…"
            className="w-full border-0 bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
          />
          {(filter !== "all" || query) && (
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
              className="text-xs font-medium text-gray-500 hover:text-gray-900"
            >
              Clear
            </button>
          )}
        </div>

        {filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-600">No findings match your filters.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                id={`cat-${cat.id}`}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">{cat.label}</h4>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-700">
                    {cat.score}/100
                  </span>
                </div>
                <ul className="space-y-2">
                  {cat.findings.map((f) => (
                    <FindingCard key={f.id} id={f.id} finding={f} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="px-1 text-xs leading-relaxed text-gray-500">
        These are security-readiness indicators, not a penetration test or a security
        guarantee. Always confirm findings with your developer or hosting provider before
        making changes.
      </p>
    </div>
  );
}