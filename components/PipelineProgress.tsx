"use client";

import { CheckCircle, Circle, Loader2, AlertCircle, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";

export interface PipelineStage {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: "pending" | "active" | "done" | "error" | "skipped";
  durationMs?: number;
  detail?: string;
}

interface PipelineProgressProps {
  stages: PipelineStage[];
  compact?: boolean;
  totalDurationMs?: number;
}

const STATUS_ICONS = {
  pending: Circle,
  active: Loader2,
  done: CheckCircle,
  error: AlertCircle,
  skipped: SkipForward,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--text-faint, #6b7280)",
  active: "var(--accent, #8b5cf6)",
  done: "#10b981",
  error: "#ef4444",
  skipped: "var(--text-muted, #9ca3af)",
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function getPipelineStages(tier: string): PipelineStage[] {
  const stages: PipelineStage[] = [
    {
      id: "intent",
      name: "Analyzer",
      emoji: "🎯",
      description: "Analyzing your request...",
      status: "pending",
    },
    {
      id: "design",
      name: "Design Architect",
      emoji: "🎨",
      description: tier === "fast" ? "Applying template design..." : "Generating custom design system...",
      status: "pending",
    },
    {
      id: "content",
      name: "Content Planner",
      emoji: "📝",
      description: "Planning content & structure...",
      status: tier === "best" ? "pending" : "skipped",
    },
    {
      id: "codegen",
      name: "Code Builder",
      emoji: "⚡",
      description: "Building your website...",
      status: "pending",
    },
    {
      id: "quality",
      name: "Quality Check",
      emoji: "✨",
      description: "Running quality validation...",
      status: "pending",
    },
  ];
  return stages;
}

export default function PipelineProgress({ stages, compact = false, totalDurationMs }: PipelineProgressProps) {
  const [elapsed, setElapsed] = useState(0);
  const isRunning = stages.some(s => s.status === "active");

  useEffect(() => {
    if (!isRunning) return;
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => clearInterval(interval);
  }, [isRunning]);

  if (compact) {
    const active = stages.find(s => s.status === "active");
    const done = stages.filter(s => s.status === "done");
    const total = stages.filter(s => s.status !== "skipped");
    const current = active || stages.find(s => s.status === "pending");

    return (
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Stage progress dots */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {stages.filter(s => s.status !== "skipped").map((stage) => (
            <div
              key={stage.id}
              className="relative flex items-center justify-center"
            >
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs transition-all duration-300 ${
                  stage.status === "active" ? "ring-2 ring-offset-1" : ""
                }`}
                style={{
                  background: stage.status === "done"
                    ? "rgba(16, 185, 129, 0.15)"
                    : stage.status === "active"
                    ? "rgba(139, 92, 246, 0.15)"
                    : "var(--bg-secondary, #1e1e2e)",
                  opacity: stage.status === "pending" ? 0.4 : 1,
                  outlineColor: stage.status === "active" ? "var(--accent, #8b5cf6)" : "transparent",
                  outlineWidth: stage.status === "active" ? "2px" : "0",
                  outlineStyle: "solid",
                  outlineOffset: "1px",
                }}
              >
                {stage.emoji}
              </div>
            </div>
          ))}
        </div>

        {/* Status text */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isRunning && (
            <Loader2 className="w-3 h-3 animate-spin shrink-0" style={{ color: "var(--accent, #8b5cf6)" }} />
          )}
          <span className="text-xs truncate" style={{ color: "var(--text-secondary, #a0a0b0)" }}>
            {current ? `${current.name}: ${current.description}` : "Complete"}
          </span>
          <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted, #6b7280)" }}>
            {done.length}/{total.length}
          </span>
        </div>
      </div>
    );
  }

  // Full expanded view
  return (
    <div className="space-y-0.5">
      {stages.map((stage) => {
        const Icon = STATUS_ICONS[stage.status];
        const isActive = stage.status === "active";
        const isDone = stage.status === "done";
        const isSkipped = stage.status === "skipped";

        return (
          <div
            key={stage.id}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
              isActive ? "bg-opacity-5" : ""
            }`}
            style={{
              background: isActive ? "rgba(139, 92, 246, 0.06)" : "transparent",
            }}
          >
            <span className="text-sm w-5 text-center shrink-0">{stage.emoji}</span>
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${isActive ? "animate-spin" : ""}`}
              style={{ color: STATUS_COLORS[stage.status] }}
            />
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span
                className="text-xs font-medium"
                style={{
                  color: isActive
                    ? "var(--text, #f0f0f0)"
                    : isDone
                    ? "var(--text-secondary, #a0a0b0)"
                    : isSkipped
                    ? "var(--text-faint, #555)"
                    : "var(--text-muted, #6b7280)",
                }}
              >
                {stage.name}
              </span>
              {isActive && (
                <span className="text-[10px] truncate" style={{ color: "var(--text-muted, #6b7280)" }}>
                  {stage.description}
                </span>
              )}
              {isDone && stage.detail && (
                <span className="text-[10px] truncate" style={{ color: "var(--text-muted, #6b7280)" }}>
                  {stage.detail}
                </span>
              )}
              {isSkipped && (
                <span className="text-[10px]" style={{ color: "var(--text-faint, #555)" }}>
                  skipped
                </span>
              )}
            </div>
            {isDone && stage.durationMs !== undefined && (
              <span className="text-[10px] tabular-nums shrink-0" style={{ color: "var(--text-muted, #6b7280)" }}>
                {formatDuration(stage.durationMs)}
              </span>
            )}
          </div>
        );
      })}

      {/* Total duration */}
      {totalDurationMs !== undefined && !isRunning && (
        <div
          className="flex items-center justify-end gap-1 px-3 pt-1"
          style={{ borderTop: "1px solid var(--border, rgba(255,255,255,0.06))" }}
        >
          <span className="text-[10px] font-medium" style={{ color: "var(--text-muted, #6b7280)" }}>
            Total: {formatDuration(totalDurationMs)}
          </span>
        </div>
      )}
    </div>
  );
}
