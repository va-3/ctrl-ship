"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Circle, Zap, Code2, Github } from "lucide-react";
import { useState } from "react";

interface AgentCardProps {
  agent: Doc<"agents">;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = {
    idle: { color: "#94a3b8", label: "Idle" },
    active: { color: "#10b981", label: "Active" },
    blocked: { color: "#ef4444", label: "Blocked" },
    paused: { color: "#f59e0b", label: "Paused" },
    busy: { color: "#3b82f6", label: "Busy" },
    error: { color: "#ef4444", label: "Error" },
  };

  const status = statusConfig[agent.status as keyof typeof statusConfig] || statusConfig.idle;

  return (
    <div
      className="group rounded-xl p-5 transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="text-lg font-semibold transition-colors"
              style={{ color: "var(--text)" }}
            >
              {agent.name}
            </h3>
            {agent.status === "active" && isHovered && (
              <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
            )}
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {agent.role}
          </p>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300"
          style={{
            background: `${status.color}15`,
            border: `1px solid ${status.color}30`,
          }}
        >
          <Circle
            className={`w-2 h-2 fill-current ${agent.status === "active" ? "animate-pulse" : ""}`}
            style={{ color: status.color }}
          />
          <span className="text-xs font-medium" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Expertise tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {agent.expertise.slice(0, isHovered ? undefined : 4).map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1 text-xs font-medium rounded-md inline-flex items-center gap-1 transition-all duration-200"
            style={{
              background: "var(--accent-light)",
              color: "var(--accent-text)",
              border: "1px solid var(--accent-light)",
            }}
          >
            <Code2 className="w-3 h-3" />
            {skill}
          </span>
        ))}
        {!isHovered && agent.expertise.length > 4 && (
          <span
            className="px-3 py-1 text-xs font-medium rounded-md"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            +{agent.expertise.length - 4} more
          </span>
        )}
      </div>

      {/* Expanded details */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isHovered ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          {agent.githubUsername && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <Github className="w-3 h-3" />
              <span>@{agent.githubUsername}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Circle className="w-3 h-3" />
            <span>Session: {agent.sessionKey}</span>
          </div>
        </div>
      </div>

      {/* Last active */}
      {agent.lastHeartbeat && !isHovered && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Last active:{" "}
            {new Date(agent.lastHeartbeat).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </div>
      )}
    </div>
  );
}
