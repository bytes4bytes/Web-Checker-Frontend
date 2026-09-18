// frontend/src/components/VerifyStep.js
import { useState } from "react";
import { toast } from "../lib/toast";

export default function VerifyStep({ domain, dnsRecord, checking, onCheck, onBack, onCancel }) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(dnsRecord.value);
      setCopied(true);
      toast("DNS value copied", { kind: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not access clipboard", { kind: "error" });
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/50 cc-fade-in">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Step 1 of 2 — Verify ownership
      </div>
      <h2 className="text-lg font-semibold text-gray-900">
        Prove you control <span className="font-mono">{domain}</span>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        DNS verification confirms that you have demonstrated technical control over this
        domain's DNS configuration. It's an authorisation and abuse-prevention mechanism, not
        a legal determination of ownership.
      </p>

      <div className="mt-5 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Record type</span>
          <span className="font-mono text-gray-900">{dnsRecord.type}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Host</span>
          <span className="font-mono text-gray-900">{dnsRecord.host}</span>
        </div>
        <div className="flex items-start justify-between gap-3 text-sm">
          <span className="shrink-0 text-gray-500">Value</span>
          <span className="break-all text-right font-mono text-gray-900">{dnsRecord.value}</span>
        </div>
        <button
          type="button"
          onClick={copyValue}
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
        >
          {copied ? "Copied" : "Copy value"}
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        DNS changes can take a few minutes to propagate. If the check doesn't find your record
        right away, wait a little and try again.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCheck}
          disabled={checking}
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? "Checking…" : "I've added the record — Check now"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={checking}
          className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
