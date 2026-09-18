// frontend/src/App.js
import { useCallback, useEffect, useRef, useState } from "react";
import DomainForm from "./components/DomainForm";
import ErrorBoundary from "./components/ErrorBoundary";
import ScanProgress from "./components/ScanProgress";
import ScanResults from "./components/ScanResults";
import ToastHost from "./components/ToastHost";
import WhatWeCheck from "./components/WhatWeCheck";
import {
  ApiError,
  createScan,
  createShare,
  getSharedReport,
  isValidDomain,
  normalizeDomain,
  pollScan,
  reportPdfUrl,
  sharedReportPdfUrl,
} from "./lib/api";
import { transformScan } from "./lib/transform";
import "./App.css";

const RECENT_KEY = "safescan:recent";
const RECENT_MAX = 5;

function readRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function apiErrorMessage(err) {
  if (err.status === 429) {
    return err.retryAfter
      ? `Too many requests. Try again in ${err.retryAfter}s.`
      : "Too many requests. Please slow down.";
  }
  if (err.status === 400) return err.message || "That domain wasn't accepted by the scanner.";
  if (err.status === 409) return err.message || "That scan isn't ready yet.";
  if (err.status === 504) return "The scan timed out. The target may be slow or unreachable.";
  if (err.status >= 500) return "The scanner had a problem. Please try again in a moment.";
  return err.message || "Something went wrong. Please try again.";
}

export default function App() {
  // idle -> scanning -> done
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [shareToken, setShareToken] = useState(null); // set only when viewing someone else's shared report
  const [error, setError] = useState("");
  const [recent, setRecent] = useState([]);

  const abortRef = useRef(null);
  const lastScannedRef = useRef(null);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const remember = useCallback((domain) => {
    setRecent((prev) => {
      const next = [domain, ...prev.filter((d) => d !== domain)].slice(0, RECENT_MAX);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  function updateUrl(params) {
    try {
      const url = new URL(window.location.href);
      url.search = "";
      for (const [k, v] of Object.entries(params)) {
        if (v) url.searchParams.set(k, v);
      }
      window.history.replaceState({}, "", url);
    } catch {
      /* ignore */
    }
  }

  // No domain-verification step: SafeScan's backend queues a scan for any valid public
  // domain with no proof of control (a deliberate product decision - see the backend's
  // README/docs/security.md for the trade-off). app/verification/ still exists on the
  // backend and works end to end; this frontend just doesn't call it.
  const runScan = useCallback(
    async (rawDomain) => {
      const domain = normalizeDomain(rawDomain);
      if (!isValidDomain(domain)) {
        setError("That doesn't look like a valid domain. Try something like example.co.za");
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setError("");
      setResult(null);
      setShareToken(null);
      lastScannedRef.current = domain;
      setPhase("scanning");
      updateUrl({ domain });

      try {
        const scan = await createScan(domain, { signal: controller.signal });
        const final = await pollScan(scan.scan_id, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (final.status !== "completed") {
          setError("The scan did not complete successfully. Please try again.");
          setPhase("idle");
          return;
        }
        setResult(transformScan(final));
        setPhase("done");
        remember(domain);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(
          err instanceof ApiError
            ? apiErrorMessage(err)
            : "Could not reach the scanner. Please check your connection and try again."
        );
        setPhase("idle");
      }
    },
    [remember]
  );

  const loadSharedReport = useCallback(async (token) => {
    setPhase("scanning"); // reuses the loading visual; label is generic enough
    lastScannedRef.current = "this shared report";
    try {
      const data = await getSharedReport(token);
      setResult(transformScan({ ...data, scan_id: null }, { source: "shared" }));
      setShareToken(token);
      setPhase("done");
    } catch {
      setError("This shared report link is invalid or has expired.");
      setPhase("idle");
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (shareToken) return window.location.href;
    if (!result?.scan_id) throw new Error("Nothing to share yet.");
    const share = await createShare(result.scan_id);
    const url = new URL(`${window.location.origin}${window.location.pathname}`);
    url.searchParams.set("report", share.token);
    return url.toString();
  }, [shareToken, result]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportToken = params.get("report");
    const d = params.get("domain");
    if (reportToken) {
      loadSharedReport(reportToken);
    } else if (d && d !== lastScannedRef.current) {
      runScan(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setError("");
  }, []);

  function reset() {
    cancel();
    setResult(null);
    setShareToken(null);
    updateUrl({});
  }

  const busy = phase === "scanning";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f7f5] via-[#f7f7f5] to-white text-gray-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-gray-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 text-sm font-bold text-white shadow-sm">
              SS
            </span>
            <span>
              <span className="block text-sm font-semibold leading-tight">SafeScan SA</span>
              <span className="block text-xs text-gray-500">Know your website. Protect your business.</span>
            </span>
          </button>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-5 py-8">
        <ErrorBoundary>
          {phase !== "done" && (
            <section className="mb-8 text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                Is your website secure?
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
                Run a free, non-invasive external scan. Get prioritised findings written in
                plain English — plus the exact questions to ask your developer or hosting
                provider.
              </p>
            </section>
          )}

          {phase !== "done" && (
            <DomainForm onSubmit={runScan} busy={busy} recent={recent} onPick={runScan} onCancel={cancel} />
          )}

          {error && (
            <p role="alert" className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {phase === "scanning" && lastScannedRef.current && <ScanProgress domain={lastScannedRef.current} />}

          {phase === "done" && result && (
            <ScanResults
              result={result}
              onRescan={shareToken ? null : () => runScan(result.domain)}
              onShare={handleShare}
              pdfUrl={shareToken ? sharedReportPdfUrl(shareToken) : reportPdfUrl(result.scan_id)}
            />
          )}

          {phase === "idle" && (
            <section className="mt-14 grid gap-3 sm:grid-cols-3">
              {[
                {
                  t: "Non-invasive",
                  d: "External checks only. We never log in, exploit, or change anything.",
                  accent: "from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700",
                },
                {
                  t: "Plain English",
                  d: "Every finding explains what it means, why it matters, and what to fix first.",
                  accent: "from-sky-50 to-indigo-50 border-sky-200 text-sky-700",
                },
                {
                  t: "POPIA-aware",
                  d: "Security-readiness indicators — not legal advice or certification.",
                  accent: "from-amber-50 to-orange-50 border-amber-200 text-amber-700",
                },
              ].map((c) => (
                <div key={c.t} className={`rounded-2xl border bg-gradient-to-br ${c.accent} p-4`}>
                  <p className="text-sm font-semibold">{c.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-700">{c.d}</p>
                </div>
              ))}
            </section>
          )}

          {phase === "idle" && <WhatWeCheck />}
        </ErrorBoundary>
      </main>

      <footer className="mt-8 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-6 text-xs leading-relaxed text-gray-500">
          <p>
            SafeScan SA provides security-readiness indicators only. It is not a penetration
            test, a security guarantee, or legal POPIA certification. Built by Bytes4Bytes.
          </p>
        </div>
      </footer>

      <ToastHost />
    </div>
  );
}
