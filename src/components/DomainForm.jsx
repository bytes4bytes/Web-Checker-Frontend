// frontend/src/components/DomainForm.js
import { useRef, useState } from "react";

export default function DomainForm({ onSubmit, busy, recent = [], onPick, onCancel }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  function submit(e) {
    e.preventDefault();
    if (busy) return;
    const v = value.trim();
    if (!v) { inputRef.current?.focus(); return; }
    onSubmit(v);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={submit}
        className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-gray-200/50 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 transition focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
          <span className="text-sm text-gray-400">https://</span>
          <span className="sr-only">Website domain to scan</span>
          <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)}
            placeholder="yourbusiness.co.za" disabled={busy} autoComplete="off" spellCheck={false} inputMode="url"
            className="w-full border-0 bg-transparent py-2.5 text-sm outline-none placeholder:text-gray-400" />
        </label>

        {busy ? (
          <button type="button" onClick={onCancel}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900">
            Cancel
          </button>
        ) : (
          <button type="submit" disabled={!value.trim()}
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2">
            Scan my site
          </button>
        )}
      </form>

      <p className="mt-2 px-1 text-xs text-gray-500">We only run non-invasive, external checks. Nothing is changed on your site.</p>

      {recent.length > 0 && !busy && (
        <div className="mt-4 flex flex-wrap items-center gap-2 px-1">
          <span className="text-xs text-gray-500">Recent:</span>
          {recent.map((d) => (
            <button key={d} type="button" onClick={() => onPick && onPick(d)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 transition hover:border-gray-900 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900">
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}