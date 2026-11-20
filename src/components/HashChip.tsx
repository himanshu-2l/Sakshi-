"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface HashChipProps {
  label?: string;
  value: string;
  chars?: number;
}

export function HashChip({ label, value, chars = 12 }: HashChipProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={value}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#ECEFE9] hover:bg-[#DFE5DC] text-[#0E1B14] text-xs font-mono-tabular transition-colors"
    >
      {label && <span className="text-[#586E61] font-sans font-medium">{label}:</span>}
      <span>{value.slice(0, chars)}…</span>
      {copied ? (
        <Check className="w-3 h-3 text-[#0B7A53]" />
      ) : (
        <Copy className="w-3 h-3 text-[#586E61]" />
      )}
    </button>
  );
}
