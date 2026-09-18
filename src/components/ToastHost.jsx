// frontend/src/components/ToastHost.js
import { useEffect, useRef, useState } from "react";
import { subscribeToasts } from "../lib/toast";

const KIND = {
  info: "bg-gray-900 text-white",
  success: "bg-emerald-600 text-white",
  error: "bg-rose-600 text-white",
};

const MAX_VISIBLE = 4;

const ANIM_STYLE_ID = "cc-toast-keyframes";
function ensureKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = ANIM_STYLE_ID;
  style.textContent = `
    @keyframes cc-toast-in {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to   { opacity: 1; transform: none; }
    }
  `;
  document.head.appendChild(style);
}

export default function ToastHost() {
  const [items, setItems] = useState([]);
  const timersRef = useRef(new Map());

  useEffect(() => {
    ensureKeyframes();

    function dismiss(id) {
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
      setItems((prev) => prev.filter((t) => t.id !== id));
    }

    const unsub = subscribeToasts((payload) => {
      setItems((prev) => {
        const next = [...prev, payload];
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });
      const timer = setTimeout(() => dismiss(payload.id), payload.duration);
      timersRef.current.set(payload.id, timer);
    });

    const timers = timersRef.current;
    return () => {
      unsub();
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  if (!items.length) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
          title="Dismiss"
          className={`pointer-events-auto rounded-lg px-3.5 py-2 text-xs font-medium shadow-lg transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
            KIND[t.kind] || KIND.info
          }`}
          style={{ animation: "cc-toast-in 200ms ease-out both" }}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}