"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Version {
  id: string;
  number: number;
  label: string;
  timestamp: string;
}

interface VersionBarProps {
  versions: Version[];
  currentVersion: number;
  onSelect: (versionNumber: number) => void;
}

export default function VersionBar({ versions, currentVersion, onSelect }: VersionBarProps) {
  if (versions.length <= 1) return null;

  const canPrev = currentVersion > 1;
  const canNext = currentVersion < versions.length;

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2"
      style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}
    >
      <button
        onClick={() => canPrev && onSelect(currentVersion - 1)}
        disabled={!canPrev}
        className="p-1 rounded-md transition-all"
        style={{
          color: canPrev ? "var(--text-muted)" : "var(--text-faint)",
          cursor: canPrev ? "pointer" : "not-allowed",
        }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-1.5">
        {versions.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v.number)}
            className="px-2 py-1 rounded-md text-[10px] font-medium transition-all"
            style={{
              background: v.number === currentVersion ? "var(--bg-hover)" : "transparent",
              color: v.number === currentVersion ? "var(--text)" : "var(--text-muted)",
            }}
            title={`${v.label} — ${v.timestamp}`}
          >
            v{v.number}
          </button>
        ))}
      </div>

      <button
        onClick={() => canNext && onSelect(currentVersion + 1)}
        disabled={!canNext}
        className="p-1 rounded-md transition-all"
        style={{
          color: canNext ? "var(--text-muted)" : "var(--text-faint)",
          cursor: canNext ? "pointer" : "not-allowed",
        }}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      <span className="text-[10px] ml-2" style={{ color: "var(--text-faint)" }}>
        {currentVersion} of {versions.length}
      </span>
    </div>
  );
}
