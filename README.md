# SafeScan SA — Frontend

React + Vite + Tailwind frontend for SafeScan SA. The design system, components, and
interaction patterns are carried over from **CyberCheck** (an earlier Bytes4Bytes project) —
see `src/lib/theme.js` for the exact colors/severity styling. It talks to
[Web-Checker-Backend](https://github.com/bytes4bytes/Web-Checker-Backend), which is a
different backend than CyberCheck's: notably, **this backend requires DNS domain-control
verification before a scan can run** (CyberCheck's does not). See `src/components/VerifyStep.jsx`
and `src/App.jsx` for that added step.

## Local development

```bash
npm install
cp .env.example .env.local   # point VITE_BACKEND_URL at a backend you can reach
npm run dev
```

`VITE_BACKEND_URL` defaults to the production backend if unset. For local end-to-end testing
against a local backend instead (recommended — the production backend's CORS policy only
allows explicitly configured origins, so a from-scratch `localhost` origin will be rejected
unless you also update the backend's `CORS_ALLOWED_ORIGINS`), run
[Web-Checker-Backend](https://github.com/bytes4bytes/Web-Checker-Backend) locally with
`CORS_ALLOWED_ORIGINS=http://localhost:5173` and point `VITE_BACKEND_URL` at it.

## Architecture

- **`src/lib/api.js`** — talks to the Flask backend. Verification is create-then-poll
  (`createVerification` → `checkVerification`), and scans are async
  (`createScan` → `pollScan`, since the backend runs scans on a background worker, not
  synchronously like CyberCheck's).
- **`src/lib/transform.js`** — the only file that knows both shapes: reshapes the backend's
  `GET /api/scans/<id>` response (field names `summary`/`why_it_matters`/`recommendation`/
  `technical_fix`) into the prop shape every component below expects (`what`/`why`/`fix`,
  grouped into `categories` with per-category scores). Every UI component is unmodified
  CyberCheck code operating on this transformed shape.
- **`src/components/VerifyStep.jsx`** — the one genuinely new screen: shows the DNS TXT
  record to add and lets the user trigger a check.
- Report sharing (`?report=<token>` in the URL) and PDF download both hit the backend's real
  endpoints (`POST /api/scans/<id>/shares`, `GET /api/scans/<id>/report.pdf` /
  `GET /api/reports/<token>/pdf`) — not client-side `window.print()` or a bare copied URL like
  CyberCheck's version.

## Known gaps from this merge

- **Feedback/messages feature dropped.** CyberCheck's `Feedback.js` posted to `/api/messages`
  (a Supabase-backed table) — the SafeScan backend has no equivalent endpoint, so it isn't
  wired up. Worth revisiting if user feedback collection is wanted.
- **`WhatWeCheck.jsx`'s category list is honesty-checked against the real backend**: only
  TLS/HTTPS, Security Headers, and Exposed Files are marked "live" — Email Security, DNS &
  Domain, Cookie Security, Infrastructure, and POPIA Readiness are marked "Planned" because
  the backend doesn't implement them yet. Update this the moment a backend PR actually ships
  one of them — never flip a category to "live" ahead of the backend.
- **Score-band label vs. letter grade can look slightly inconsistent.** `scoreBand()` (from
  CyberCheck, unchanged) labels a score by fixed numeric thresholds (e.g. "Good" at 60+),
  independently of the backend's own letter-grade thresholds and hard-cap rules (`A`–`F`,
  with certain critical findings capping the grade regardless of score). A scan can show
  "Good" and grade `C` in the same view. Not a bug, just two independently-designed scales
  sharing one number — worth reconciling later.
