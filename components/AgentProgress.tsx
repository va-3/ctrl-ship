"use client";

import { CheckCircle, Circle, Loader2, AlertCircle } from "lucide-react";

export interface AgentStep {
  agent: string;
  emoji: string;
  task: string;
  status: "pending" | "active" | "done" | "error";
}

interface AgentProgressProps {
  steps: AgentStep[];
  compact?: boolean;
}

const STATUS_ICONS = {
  pending: Circle,
  active: Loader2,
  done: CheckCircle,
  error: AlertCircle,
};

export default function AgentProgress({ steps, compact = false }: AgentProgressProps) {
  if (compact) {
    // Compact: single-line summary
    const active = steps.filter((s) => s.status === "active");
    const done = steps.filter((s) => s.status === "done");
    const current = active[0] || steps.find((s) => s.status === "pending");

    return (
      <div className="flex items-center gap-3">
        {/* Agent emoji avatars */}
        <div className="flex items-center -space-x-1">
          {steps.map((step, i) => (
            <span
              key={i}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              style={{
                background: step.status === "done" ? "var(--bg-tertiary)" : step.status === "active" ? "var(--accent-light)" : "var(--bg-secondary)",
                border: "2px solid var(--bg)",
                opacity: step.status === "pending" ? 0.4 : 1,
              }}
            >
              {step.emoji}
            </span>
          ))}
        </div>

        {/* Status text */}
        <div className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--accent)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {current ? `${current.agent}: ${current.task}` : "Finishing up..."}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {done.length}/{steps.length}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {steps.map((step, i) => {
        const Icon = STATUS_ICONS[step.status];
        return (
          <div key={i} className="flex items-center gap-2.5">
            <span className="text-sm w-5 text-center shrink-0">{step.emoji}</span>
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${step.status === "active" ? "animate-spin" : ""}`}
              style={{
                color:
                  step.status === "active" ? "var(--accent)" :
                  step.status === "done" ? "#10b981" :
                  step.status === "error" ? "#ef4444" :
                  "var(--text-faint)",
              }}
            />
            <div className="flex-1 min-w-0">
              <span
                className="text-xs"
                style={{
                  color: step.status === "active" ? "var(--text)" : step.status === "done" ? "var(--text-muted)" : "var(--text-faint)",
                }}
              >
                <span className="font-medium">{step.agent}:</span>{" "}
                <span className="truncate">{step.task}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
