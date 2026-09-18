// frontend/src/lib/transform.js
//
// Reshapes a GET /api/scans/<id> response (Web-Checker-Backend's own field
// names: summary/why_it_matters/recommendation/technical_fix) into the prop
// shape CyberCheck's components expect (what/why/fix/evidence, grouped into
// categories with per-category scores/counts). Keeps every component below
// (ScoreHero, ScanResults, CategoryCard, FindingCard, PriorityPanel...)
// unmodified - this is the only place that needs to know both shapes.

const CATEGORY_LABELS = {
  https: "TLS / HTTPS",
  headers: "Security Headers",
  files: "Exposed Files",
};

const CATEGORY_ORDER = ["https", "headers", "files"];

const SEVERITY_DEDUCTION = { critical: 40, high: 25, medium: 15, low: 5, pass: 0, info: 0 };

function mapStatus(status) {
  if (status === "passed") return "pass";
  if (status === "failed") return "fail";
  return "warn"; // inconclusive
}

function scoreForFindings(findings) {
  const conclusive = findings.filter((f) => f.severity !== "inconclusive");
  if (!conclusive.length) return 100;
  const deductions = conclusive.reduce((sum, f) => sum + (SEVERITY_DEDUCTION[f.severity] ?? 0), 0);
  return Math.max(0, 100 - deductions);
}

function summarize(counts) {
  if (counts.critical > 0) return "There are critical issues that need attention right away.";
  if (counts.high > 0) return "There are several important issues that a developer should address soon.";
  if (counts.medium > 0 || counts.low > 0) {
    return "Nothing critical was found. Review the items below to tighten things up further.";
  }
  if (counts.inconclusive > 0 && counts.pass === 0) {
    return "Most checks could not be reliably completed for this scan.";
  }
  return "No issues were found across the checks we ran.";
}

function evidenceText(f) {
  const parts = [];
  if (f.technical_fix) parts.push(`Developer instructions: ${f.technical_fix}`);
  if (f.popia_relevance) parts.push(`POPIA relevance: ${f.popia_relevance}`);
  if (f.evidence && typeof f.evidence === "object" && Object.keys(f.evidence).length) {
    parts.push(JSON.stringify(f.evidence));
  }
  return parts.join("\n") || undefined;
}

export function transformScan(scan, { source = "live" } = {}) {
  const rawFindings = scan.result?.findings || [];

  const findings = rawFindings.map((f) => ({
    id: f.id,
    title: f.title,
    severity: f.severity,
    status: mapStatus(f.status),
    what: f.summary,
    why: f.why_it_matters,
    fix: f.recommendation,
    evidence: evidenceText(f),
    categoryId: f.category,
  }));

  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, pass: 0, inconclusive: 0 };
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  }

  const byCategory = new Map();
  for (const f of findings) {
    const catId = f.categoryId || "other";
    if (!byCategory.has(catId)) byCategory.set(catId, []);
    byCategory.get(catId).push(f);
  }

  const categoryIds = [
    ...CATEGORY_ORDER.filter((id) => byCategory.has(id)),
    ...[...byCategory.keys()].filter((id) => !CATEGORY_ORDER.includes(id)),
  ];

  const categories = categoryIds.map((id) => ({
    id,
    label: CATEGORY_LABELS[id] || id,
    score: scoreForFindings(byCategory.get(id)),
    findings: byCategory.get(id),
  }));

  return {
    domain: scan.domain,
    scanned_at: scan.completed_at || scan.created_at,
    scan_id: scan.scan_id,
    score: scan.overall_score ?? 0,
    grade: scan.overall_grade || "?",
    summary: summarize(counts),
    counts,
    categories,
    source,
  };
}
