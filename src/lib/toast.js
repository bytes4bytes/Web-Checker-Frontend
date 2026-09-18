// frontend/src/lib/toast.js
const listeners = new Set();
let seq = 0;

export function toast(message, opts = {}) {
  const id = ++seq;
  const payload = {
    id,
    message,
    kind: opts.kind || "info",
    duration: opts.duration ?? 2200,
  };
  listeners.forEach((fn) => fn(payload));
  return id;
}

export function subscribeToasts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}