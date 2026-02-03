"use client";

import type { QualityReport } from "@/lib/generation/types";

interface QualityBadgeProps {
  report: QualityReport;
  compact?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#10b981";
  if (score >= 70) return "#f59e0b";
  if (score >= 50) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Needs Work";
}

export default function QualityBadge({ report, compact = false }: QualityBadgeProps) {
  const color = getScoreColor(report.score);
  const label = getScoreLabel(report.score);

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
        style={{
          background: `${color}15`,
          color: color,
          border: `1px solid ${color}30`,
        }}
      >
        <span className="tabular-nums">{report.score}</span>
        <span>/100</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{
        background: "var(--bg-secondary, #111)",
        border: "1px solid var(--border, rgba(255,255,255,0.06))",
      }}
    >
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: "var(--text, #f0f0f0)" }}>
            Quality Score
          </span>
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              background: `${color}15`,
              color: color,
            }}
          >
            {label}
          </span>
        </div>
        <span className="text-lg font-bold tabular-nums" style={{ color }}>
          {report.score}
        </span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary, #222)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${report.score}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
          }}
        />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[
          { label: "Sections", value: report.metrics.sectionCount, good: report.metrics.sectionCount >= 5 },
          { label: "Responsive", value: report.metrics.hasResponsiveDesign ? "✓" : "✗", good: report.metrics.hasResponsiveDesign },
          { label: "Animations", value: report.metrics.hasAnimations ? "✓" : "✗", good: report.metrics.hasAnimations },
          { label: "Hover States", value: report.metrics.hasHoverStates ? "✓" : "✗", good: report.metrics.hasHoverStates },
          { label: "Images", value: report.metrics.imageCount, good: report.metrics.imageCount > 0 },
          { label: "Size", value: `${(report.metrics.htmlSize / 1024).toFixed(0)}KB`, good: report.metrics.htmlSize > 5000 },
        ].map(({ label, value, good }) => (
          <div key={label} className="text-center">
            <div
              className="text-xs font-medium tabular-nums"
              style={{ color: good ? "#10b981" : "var(--text-muted, #6b7280)" }}
            >
              {value}
            </div>
            <div className="text-[9px]" style={{ color: "var(--text-faint, #555)" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Issues */}
      {report.issues.length > 0 && (
        <div className="space-y-1 pt-1" style={{ borderTop: "1px solid var(--border, rgba(255,255,255,0.06))" }}>
          <span className="text-[10px] font-medium" style={{ color: "var(--text-muted, #6b7280)" }}>
            Issues ({report.issues.length})
          </span>
          {report.issues.slice(0, 4).map((issue, i) => {
            const icon = issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟡" : "🔵";
            return (
              <div key={i} className="flex items-start gap-1.5 text-[10px]" style={{ color: "var(--text-muted, #6b7280)" }}>
                <span className="shrink-0">{icon}</span>
                <span className="truncate">{issue.message}</span>
              </div>
            );
          })}
          {report.issues.length > 4 && (
            <span className="text-[10px]" style={{ color: "var(--text-faint, #555)" }}>
              +{report.issues.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
