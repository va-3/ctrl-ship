"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Sparkles, Bug, RefreshCw, FileText, FlaskConical, AlertCircle, ChevronDown, Clock, User } from "lucide-react";
import { useState } from "react";

interface TaskListProps {
  tasks: Doc<"tasks">[];
}

const typeConfig: Record<string, { icon: typeof Sparkles; accent: string }> = {
  feature: { icon: Sparkles, accent: "#3b82f6" },
  bug: { icon: Bug, accent: "#ef4444" },
  refactor: { icon: RefreshCw, accent: "#8b5cf6" },
  docs: { icon: FileText, accent: "#10b981" },
  test: { icon: FlaskConical, accent: "#06b6d4" },
};

const priorityDots: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#94a3b8",
};

export default function TaskList({ tasks }: TaskListProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-faint)" }} strokeWidth={1.5} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No tasks in queue</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const cfg = typeConfig[task.type] || typeConfig.feature;
        const dotColor = priorityDots[task.priority] || priorityDots.medium;
        const Icon = cfg.icon;
        const isExpanded = expandedTask === task._id;

        return (
          <div
            key={task._id}
            className="group p-4 rounded-xl transition-all duration-300 cursor-pointer"
            style={{
              background: `${cfg.accent}06`,
              border: `1px solid ${cfg.accent}20`,
            }}
            onClick={() => setExpandedTask(isExpanded ? null : task._id)}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: `${cfg.accent}12`, border: `1px solid ${cfg.accent}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: cfg.accent }} strokeWidth={2} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h4 className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      style={{ color: "var(--text-muted)" }}
                    />
                  </div>
                </div>

                <p
                  className={`text-xs leading-relaxed mb-2.5 ${isExpanded ? "" : "line-clamp-2"}`}
                  style={{ color: "var(--text-muted)" }}
                >
                  {task.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  <span
                    className="px-2 py-0.5 text-[10px] font-medium rounded-md"
                    style={{ background: `${cfg.accent}15`, color: cfg.accent }}
                  >
                    {task.type}
                  </span>
                  <span
                    className="px-2 py-0.5 text-[10px] font-medium rounded-md"
                    style={{ color: dotColor, background: "var(--bg-tertiary)" }}
                  >
                    {task.priority}
                  </span>
                  {task.estimatedHours && (
                    <span
                      className="px-2 py-0.5 text-[10px] font-medium rounded-md"
                      style={{ color: "var(--text-muted)", background: "var(--bg-tertiary)" }}
                    >
                      ~{task.estimatedHours}h
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded */}
            <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-48 opacity-100 mt-3" : "max-h-0 opacity-0"}`}>
              <div className="pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <User className="w-3.5 h-3.5" />
                  Created by: <span style={{ color: "var(--accent-text)" }} className="font-medium">{task.createdBy}</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <FileText className="w-3.5 h-3.5" />
                  Project: <span className="font-medium" style={{ color: "#3b82f6" }}>{task.project}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
