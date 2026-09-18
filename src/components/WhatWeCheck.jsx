// frontend/src/components/WhatWeCheck.js
import { useState } from "react";

// "live" here means the backend (Web-Checker-Backend) actually implements it
// today - not aspirational copy. Only TLS/Headers/Exposed-Files are real
// right now; the rest are the agreed next-build roadmap. Never flip one to
// "live" here without the backend PR that actually ships it - this list is
// a promise to the visitor, not a wishlist.
const CHECKS = [
  {
    group: "TLS / HTTPS",
    status: "live",
    items: [
      "Certificate validity and trust chain",
      "Certificate expiry and hostname match",
      "HTTP to HTTPS redirect",
    ],
  },
  {
    group: "Security Headers",
    status: "live",
    items: [
      "Strict-Transport-Security (HSTS)",
      "X-Content-Type-Options",
      "X-Frame-Options (clickjacking)",
      "Referrer-Policy",
      "Content-Security-Policy",
    ],
  },
  {
    group: "Exposed Files",
    status: "live",
    items: [
      ".env secrets files",
      "Common backup/database dump patterns",
      "Baseline comparison to reduce false positives",
    ],
  },
  {
    group: "Email Security",
    status: "planned",
    items: [
      "SPF record presence and strength",
      "DMARC policy (p=none vs quarantine/reject)",
      "Composite spoofability — can someone impersonate your email?",
    ],
  },
  {
    group: "DNS & Domain",
    status: "planned",
    items: ["CAA (who may issue certificates for you)", "DNSSEC (DS at the parent zone)"],
  },
  {
    group: "Cookie Security",
    status: "planned",
    items: ["Secure flag", "HttpOnly flag", "SameSite attribute"],
  },
  {
    group: "Infrastructure",
    status: "planned",
    items: ["Hosting geo-location (POPIA data residency)", "WAF / CDN detection"],
  },
  {
    group: "POPIA Readiness",
    status: "planned",
    items: [
      "Privacy policy linked from homepage",
      "Cookie consent signal detected",
      "Contact forms served over HTTPS",
    ],
  },
];

const NOT_DONE = [
  "No logins, passwords, or credentials are ever tested.",
  "No exploitation attempts of any kind.",
  "No port scanning beyond a single TLS handshake on 443.",
  "No SQL injection, XSS, or other active vulnerability probing.",
];

export default function WhatWeCheck() {
  const [open, setOpen] = useState(false);
  const liveCount = CHECKS.filter((g) => g.status === "live").reduce((n, g) => n + g.items.length, 0);

  return (
    <section className="mt-14 rounded-2xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-gray-900">What SafeScan SA checks</span>
          <span className="mt-0.5 block text-xs text-gray-500">
            {liveCount} checks live today across {CHECKS.filter((g) => g.status === "live").length}{" "}
            categories — all passive and non-invasive. More categories in progress below.
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {CHECKS.map((g) => (
              <div key={g.group}>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700">{g.group}</h4>
                  {g.status === "planned" && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                      Planned
                    </span>
                  )}
                </div>
                <ul className="mt-1.5 space-y-1">
                  {g.items.map((item) => (
                    <li key={item} className="flex gap-2 text-xs text-gray-600">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-rose-800">
              What we deliberately do not do
            </h4>
            <ul className="mt-1.5 space-y-1">
              {NOT_DONE.map((item) => (
                <li key={item} className="flex gap-2 text-xs text-rose-900">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-rose-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
