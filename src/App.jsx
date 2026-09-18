// frontend/src/App.js
import { useCallback, useEffect, useRef, useState } from "react";
import DomainForm from "./components/DomainForm";
import ErrorBoundary from "./components/ErrorBoundary";
import ScanProgress from "./components/ScanProgress";
import ScanResults from "./components/ScanResults";
import ToastHost from "./components/ToastHost";
import VerifyStep from "./components/VerifyStep";
import WhatWeCheck from "./components/WhatWeCheck";
import {
  ApiError,
  checkVerification,
  createScan,
  createShare,
  createVerification,
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
  // idle -> verifying -> checking -> scanning -> done
  const [phase, setPhase] = useState("idle");
  const [verification, setVerification] = useState(null);
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

  const beginScan = useCallback(
    async (domain, controller) => {
      lastScannedRef.current = domain;
      setPhase("scanning");
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
        setShareToken(null);
        setPhase("done");
        remember(domain);
      } catch (err) {
        if (err.name === "AbortError") return;
        // A domain whose verification lapsed (or was never done) hits this
        // 403 - fold straight back into the verify flow instead of just
        // showing an error, so "Re-scan" on a stale domain still works.
        if (err instanceof ApiError && err.status === 403) {
          setPhase("idle");
          startVerification(domain);
          return;
        }
        setError(err instanceof ApiError ? apiErrorMessage(err) : "Could not reach the scanner. Please check your connection and try again.");
        setPhase("idle");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [remember]
  );

  const startVerification = useCallback(async (rawDomain) => {
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
    setPhase("verifying");
    updateUrl({ domain });

    try {
      const v = await createVerification(domain, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setVerification(v);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err instanceof ApiError ? apiErrorMessage(err) : "Could not reach the scanner. Please check your connection and try again.");
      setPhase("idle");
    }
  }, []);

  const handleCheckVerification = useCallback(async () => {
    if (!verification) return;
    setPhase("checking");
    setError("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const updated = await checkVerification(verification.verification_id, { signal: controller.signal });
      if (controller.signal.aborted) return;

      if (updated.status === "verified") {
        await beginScan(updated.domain, controller);
      } else if (updated.status === "expired") {
        setError("This verification request expired. Start again with your domain.");
        setVerification(null);
        setPhase("idle");
      } else {
        setError(
          updated.last_check_result === "TEMPORARY_DNS_ERROR"
            ? "DNS lookup failed temporarily. Try again in a moment."
            : "We couldn't find that DNS record yet. Add it, wait a little for DNS to propagate, then try again."
        );
        // POST /api/verification/<id>/check's response has no dns_record
        // field (only the initial create response does) - merge onto the
        // existing verification instead of replacing it, or the DNS record
        // shown in VerifyStep disappears from under it.
        setVerification((prev) => ({ ...prev, ...updated }));
        setPhase("verifying");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err instanceof ApiError ? apiErrorMessage(err) : "Could not reach the scanner. Please check your connection and try again.");
      setPhase("verifying");
    }
  }, [verification, beginScan]);

  const rescan = useCallback(
    (domain) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setError("");
      setResult(null);
      setShareToken(null);
      beginScan(domain, controller);
    },
    [beginScan]
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
      startVerification(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setVerification(null);
    setError("");
  }, []);

  function reset() {
    cancel();
    setResult(null);
    setShareToken(null);
    updateUrl({});
  }

  const busy = phase === "scanning";
  const showForm = phase === "idle" || busy;

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
                provider. You'll verify technical control of your domain first.
              </p>
            </section>
          )}

          {showForm && (
            <DomainForm
              onSubmit={startVerification}
              busy={busy}
              recent={recent}
              onPick={(d) => rescan(normalizeDomain(d))}
              onCancel={cancel}
            />
          )}

          {error && (
            <p role="alert" className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {(phase === "verifying" || phase === "checking") && verification && (
            <VerifyStep
              domain={verification.domain}
              dnsRecord={verification.dns_record}
              checking={phase === "checking"}
              onCheck={handleCheckVerification}
              onBack={cancel}
              onCancel={cancel}
            />
          )}

          {phase === "scanning" && lastScannedRef.current && <ScanProgress domain={lastScannedRef.current} />}

          {phase === "done" && result && (
            <ScanResults
              result={result}
              onRescan={shareToken ? null : () => rescan(result.domain)}
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
