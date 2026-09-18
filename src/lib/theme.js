// frontend/src/lib/theme.js
export const SEVERITY = {
  critical: {
    label: "Critical", rank: 0,
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    edge: "border-l-rose-500",
    text: "text-rose-700",
    soft: "bg-rose-50",
    bar: "bg-rose-500",
  },
  high: {
    label: "High", rank: 1,
    dot: "bg-orange-500",
    chip: "bg-orange-50 text-orange-700 border-orange-200",
    edge: "border-l-orange-500",
    text: "text-orange-700",
    soft: "bg-orange-50",
    bar: "bg-orange-500",
  },
  medium: {
    label: "Medium", rank: 2,
    dot: "bg-amber-400",
    chip: "bg-amber-50 text-amber-800 border-amber-200",
    edge: "border-l-amber-400",
    text: "text-amber-800",
    soft: "bg-amber-50",
    bar: "bg-amber-400",
  },
  low: {
    label: "Low", rank: 3,
    dot: "bg-yellow-400",
    chip: "bg-yellow-50 text-yellow-800 border-yellow-200",
    edge: "border-l-yellow-400",
    text: "text-yellow-800",
    soft: "bg-yellow-50",
    bar: "bg-yellow-400",
  },
  info: {
    label: "Info", rank: 4,
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    edge: "border-l-sky-500",
    text: "text-sky-700",
    soft: "bg-sky-50",
    bar: "bg-sky-500",
  },
  pass: {
    label: "Pass", rank: 5,
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    edge: "border-l-emerald-500",
    text: "text-emerald-700",
    soft: "bg-emerald-50",
    bar: "bg-emerald-500",
  },
  // Not in the original CyberCheck theme - SafeScan's scanner distinguishes "we
  // checked and it's fine" (pass) from "we couldn't reliably determine this"
  // (inconclusive, e.g. the site returns the same response for every path).
  // Never conflate the two - an inconclusive result must never look like a pass
  // or a failure, so it gets its own neutral colour, not the closest existing one.
  inconclusive: {
    label: "Inconclusive", rank: 6,
    dot: "bg-slate-400",
    chip: "bg-slate-50 text-slate-600 border-slate-200",
    edge: "border-l-slate-400",
    text: "text-slate-600",
    soft: "bg-slate-50",
    bar: "bg-slate-400",
  },
};

export const SEVERITY_ORDER = ["critical", "high", "medium", "low", "info", "pass", "inconclusive"];

export function scoreBand(score) {
  if (score >= 80) return {
    key: "excellent", label: "Excellent",
    ring: "#059669", ringTrack: "#d1fae5",
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200",
    heroBg: "from-emerald-50 via-white to-teal-50",
    heroBorder: "border-emerald-200",
    blobA: "bg-emerald-200", blobB: "bg-teal-200",
    accentText: "text-emerald-700",
  };
  if (score >= 60) return {
    key: "good", label: "Good",
    ring: "#ca8a04", ringTrack: "#fef3c7",
    chip: "bg-amber-100 text-amber-800 border-amber-200",
    heroBg: "from-amber-50 via-white to-orange-50",
    heroBorder: "border-amber-200",
    blobA: "bg-amber-200", blobB: "bg-orange-200",
    accentText: "text-amber-700",
  };
  if (score >= 40) return {
    key: "fair", label: "Fair",
    ring: "#ea580c", ringTrack: "#ffedd5",
    chip: "bg-orange-100 text-orange-800 border-orange-200",
    heroBg: "from-orange-50 via-white to-red-50",
    heroBorder: "border-orange-200",
    blobA: "bg-orange-200", blobB: "bg-red-200",
    accentText: "text-orange-700",
  };
  return {
    key: "poor", label: "At risk",
    ring: "#dc2626", ringTrack: "#fee2e2",
    chip: "bg-rose-100 text-rose-800 border-rose-200",
    heroBg: "from-rose-50 via-white to-red-50",
    heroBorder: "border-rose-200",
    blobA: "bg-rose-200", blobB: "bg-red-200",
    accentText: "text-rose-700",
  };
}
