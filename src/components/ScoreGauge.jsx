// frontend/src/components/ScoreGauge.js
import { useEffect, useRef, useState } from "react";

export default function ScoreGauge({ score = 0, grade = "?", ringColor, ringTrack, size = 180 }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    const from = displayed;
    const to = Math.max(0, Math.min(100, score));
    cancelAnimationFrame(raf.current);
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(from + (to - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const dash = (displayed / 100) * c;
  const label = `Security score ${Math.round(score)} out of 100, grade ${grade}`;

  return (
    <div className="relative inline-block shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringTrack} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-5xl font-bold leading-none tracking-tight tabular-nums" style={{ color: ringColor }}>
            {Math.round(displayed)}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ringColor, opacity: 0.75 }}>
            Grade {grade}
          </div>
        </div>
      </div>
    </div>
  );
}