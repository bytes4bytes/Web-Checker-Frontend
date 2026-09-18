// frontend/src/lib/api.js
//
// Talks to the SafeScan SA backend (Web-Checker-Backend), not CyberCheck's -
// that backend has no domain-verification step, which SafeScan requires
// (AC-004: a scan cannot start without proven technical control of the
// domain). See VerifyStep.js for the added step this implies.

const ENV_BACKEND =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
  "https://web-checker-e3bzdqajc7fxgzee.uaenorth-01.azurewebsites.net";

export const API_BASE = String(ENV_BACKEND).replace(/\/+$/, "");

export function normalizeDomain(input) {
  if (!input) return "";
  let d = String(input).trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0].split(":")[0];
  return d.replace(/\.+$/, "");
}

export function isValidDomain(d) {
  if (!d || d.length > 253) return false;
  return /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(d);
}

export class ApiError extends Error {
  constructor(message, { status, retryAfter, kind } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
    this.kind = kind; // "network" | "http" | "protocol" | "timeout"
  }
}

async function readJsonSafely(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    return { ok: false, reason: `non-json (${ct || "unknown"})` };
  }
  try {
    return { ok: true, data: await res.json() };
  } catch (e) {
    return { ok: false, reason: `invalid json: ${e.message}` };
  }
}

async function httpError(res) {
  const parsed = await readJsonSafely(res);
  // The Flask backend's error shape is {"error": "..."}, not CyberCheck's {"detail": "..."}.
  const detail =
    (parsed.ok && parsed.data && parsed.data.error) || `Server returned ${res.status}`;
  return new ApiError(detail, {
    status: res.status,
    retryAfter: Number(res.headers.get("retry-after")) || undefined,
    kind: "http",
  });
}

async function request(path, { method = "GET", body, signal } = {}) {
  if (!API_BASE) {
    throw new ApiError("Backend URL is not configured. Set VITE_BACKEND_URL and rebuild.", {
      kind: "protocol",
    });
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError(`Could not reach the scanner at ${API_BASE}. ${err.message}`, { kind: "network" });
  }
  if (!res.ok) throw await httpError(res);
  const parsed = await readJsonSafely(res);
  if (!parsed.ok) {
    throw new ApiError(`Scanner returned an unexpected response (${parsed.reason}).`, {
      status: res.status,
      kind: "protocol",
    });
  }
  return parsed.data;
}

export function createVerification(domain, { signal } = {}) {
  return request("/api/verification", { method: "POST", body: { domain }, signal });
}

export function checkVerification(verificationId, { signal } = {}) {
  return request(`/api/verification/${verificationId}/check`, { method: "POST", signal });
}

export function createScan(domain, { signal } = {}) {
  return request("/api/scans", { method: "POST", body: { domain }, signal });
}

export function getScan(scanId, { signal } = {}) {
  return request(`/api/scans/${scanId}`, { signal });
}

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled", "expired"]);

// Our scans run asynchronously (a background worker claims and processes the
// job), unlike CyberCheck's synchronous scan-and-respond call - so the
// frontend has to poll for completion instead of getting the result inline.
export async function pollScan(scanId, { signal, intervalMs = 1500, onTick } = {}) {
  for (;;) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const data = await getScan(scanId, { signal });
    onTick?.(data);
    if (TERMINAL_STATUSES.has(data.status)) return data;
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, intervalMs);
      signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(t);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true }
      );
    });
  }
}

export function createShare(scanId, { signal } = {}) {
  return request(`/api/scans/${scanId}/shares`, { method: "POST", signal });
}

export function getSharedReport(token, { signal } = {}) {
  return request(`/api/reports/${token}`, { signal });
}

export function reportPdfUrl(scanId) {
  return `${API_BASE}/api/scans/${scanId}/report.pdf`;
}

export function sharedReportPdfUrl(token) {
  return `${API_BASE}/api/reports/${token}/pdf`;
}
