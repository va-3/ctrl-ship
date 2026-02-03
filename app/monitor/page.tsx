"use client";

import {
  useSwarmAgents,
  useSwarmJobs,
  useSwarmActivities,
  useSwarmStats,
} from "@/lib/use-swarm";
import {
  Users,
  ClipboardList,
  Zap,
  CheckCircle,
  Activity,
  Circle,
  Loader2,
  Timer,
  Code2,
  Crown,
  BarChart3,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// ── Stats Cards ─────────────────────────────────────────────────────────

function StatsOverview() {
  const stats = useSwarmStats();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cards = [
    {
      label: "Active Agents",
      value: stats.activeAgents,
      subValue: `of ${stats.totalAgents} total`,
      icon: Users,
      accent: "#10b981",
    },
    {
      label: "Build Queue",
      value: stats.queuedJobs + stats.runningJobs,
      subValue: stats.runningJobs > 0 ? `${stats.runningJobs} running` : "idle",
      icon: ClipboardList,
      accent: "#3b82f6",
    },
    {
      label: "Completed",
      value: stats.completedJobs,
      subValue: stats.avgQualityScore > 0 ? `avg quality: ${stats.avgQualityScore}/100` : "no builds yet",
      icon: CheckCircle,
      accent: "#a78bfa",
    },
    {
      label: "System Status",
      value: stats.systemStatus === "operational" ? "Operational" : stats.systemStatus === "degraded" ? "Degraded" : "Error",
      subValue: stats.systemStatus === "operational" ? "all agents ready" : "check logs",
      icon: Activity,
      accent: stats.systemStatus === "operational" ? "#10b981" : "#f59e0b",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`relative rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] ${mounted ? "animate-fadeIn" : "opacity-0"}`}
            style={{
              animationDelay: `${index * 80}ms`,
              background: `linear-gradient(135deg, ${stat.accent}08, ${stat.accent}04)`,
              border: `1px solid ${stat.accent}20`,
            }}
          >
            <div className="mb-3" style={{ color: stat.accent }}>
              <Icon className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
              {stat.value}
            </p>
            <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
              {stat.subValue}
            </p>
            <p className="text-sm font-medium mt-2" style={{ color: "var(--text-secondary)" }}>
              {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Agent Cards ─────────────────────────────────────────────────────────

function AgentGrid() {
  const agents = useSwarmAgents();

  if (agents.length === 0) {
    return (
      <div className="col-span-2 text-center py-10" style={{ color: "var(--text-muted)" }}>
        <p className="text-sm mb-1">No agents initialized</p>
      </div>
    );
  }

  const isOddCount = agents.length % 2 !== 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {agents.map((agent, index) => {
        const statusColor =
          agent.status === "active" ? "#10b981" :
          agent.status === "busy" ? "#3b82f6" :
          agent.status === "error" ? "#ef4444" :
          "#94a3b8";

        // Center the last agent if there's an odd number
        const isLastOdd = isOddCount && index === agents.length - 1;

        return (
          <div
            key={agent.id}
            className={`group rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] ${isLastOdd ? "md:col-span-2 md:max-w-[50%] md:mx-auto" : ""}`}
            style={{
              background: "var(--bg-elevated)",
              border: `1px solid ${agent.status === "active" ? agent.color + "40" : "var(--border)"}`,
              boxShadow: agent.status === "active" ? `0 0 20px ${agent.color}10` : "var(--shadow-sm)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: `${agent.color}15` }}>
                  <Image src={agent.icon} alt={agent.name} width={40} height={40} className="object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                    {agent.name}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {agent.role}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-full"
                style={{
                  background: `${statusColor}15`,
                  border: `1px solid ${statusColor}30`,
                }}
              >
                {agent.status === "active" ? (
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: statusColor }} />
                ) : (
                  <Circle className={`w-2 h-2 fill-current`} style={{ color: statusColor }} />
                )}
                <span className="text-[11px] font-medium capitalize" style={{ color: statusColor }}>
                  {agent.status}
                </span>
              </div>
            </div>

            {/* Current task */}
            {agent.currentTask && (
              <div
                className="mb-3 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: `${agent.color}08`,
                  border: `1px solid ${agent.color}20`,
                  color: agent.color,
                }}
              >
                {agent.currentTask}
              </div>
            )}

            {/* Model badge */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wider"
                style={{
                  background: "#a78bfa20",
                  color: "#a78bfa",
                  border: "1px solid #a78bfa30",
                }}
              >
                Sonnet 4.5
              </span>
            </div>

            {/* Expertise tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {agent.expertise.slice(0, 3).map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-md"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Code2 className="w-2.5 h-2.5 inline mr-0.5 -mt-px" />
                  {skill}
                </span>
              ))}
              {agent.expertise.length > 3 && (
                <span className="px-2 py-0.5 text-[10px] rounded-md" style={{ color: "var(--text-faint)" }}>
                  +{agent.expertise.length - 3}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                <CheckCircle className="w-3 h-3" />
                {agent.completedTasks} tasks
              </div>
              {agent.totalDurationMs > 0 && (
                <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <Timer className="w-3 h-3" />
                  {(agent.totalDurationMs / 1000).toFixed(0)}s total
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Active Jobs ─────────────────────────────────────────────────────────

function ActiveJobs() {
  const jobs = useSwarmJobs();
  const activeJobs = jobs.filter(j => j.status === "running" || j.status === "queued");
  const recentCompleted = jobs.filter(j => j.status === "completed" || j.status === "failed").slice(0, 5);
  const displayJobs = [...activeJobs, ...recentCompleted];

  if (displayJobs.length === 0) {
    return (
      <div className="text-center py-10">
        <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-faint)" }} strokeWidth={1.5} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No builds yet</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
          Start building from the home page to see pipeline activity
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayJobs.map((job) => {
        const tierConfig = {
          fast: { icon: Zap, color: "#22c55e", label: "Fast · ⚡100" },
          best: { icon: Crown, color: "#f59e0b", label: "Best · ⚡250" },
        };
        const tier = tierConfig[job.tier as keyof typeof tierConfig] || tierConfig.best;
        const TierIcon = tier.icon;

        const isActive = job.status === "running";
        const statusColor =
          job.status === "completed" ? "#10b981" :
          job.status === "failed" ? "#ef4444" :
          job.status === "running" ? "#3b82f6" :
          "#94a3b8";

        const doneStages = job.stages.filter(s => s.status === "done").length;
        const totalStages = job.stages.filter(s => s.status !== "skipped").length;
        const progress = totalStages > 0 ? (doneStages / totalStages) * 100 : 0;

        return (
          <div
            key={job.id}
            className="rounded-xl p-4 transition-all duration-300"
            style={{
              background: isActive ? `${statusColor}05` : "var(--bg-elevated)",
              border: `1px solid ${isActive ? statusColor + "30" : "var(--border)"}`,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                  {job.prompt.substring(0, 60)}{job.prompt.length > 60 ? "..." : ""}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <TierIcon className="w-3 h-3" style={{ color: tier.color }} />
                  <span className="text-[10px] font-medium" style={{ color: tier.color }}>{tier.label}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                    {new Date(job.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                {job.qualityScore != null && (
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold rounded-md"
                    style={{
                      background: job.qualityScore >= 80 ? "#10b98120" : job.qualityScore >= 60 ? "#f59e0b20" : "#ef444420",
                      color: job.qualityScore >= 80 ? "#10b981" : job.qualityScore >= 60 ? "#f59e0b" : "#ef4444",
                    }}
                  >
                    {job.qualityScore}/100
                  </span>
                )}
                <span
                  className="px-2 py-0.5 text-[10px] font-medium rounded-md capitalize"
                  style={{
                    background: `${statusColor}15`,
                    color: statusColor,
                  }}
                >
                  {job.status}
                </span>
              </div>
            </div>

            {/* Stage progress bar */}
            {isActive && (
              <div className="mt-3">
                <div className="flex gap-1 mb-1.5">
                  {job.stages.filter(s => s.status !== "skipped").map((stage, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1.5 rounded-full overflow-hidden transition-all duration-500"
                      style={{ background: "var(--bg-tertiary)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: stage.status === "done" ? "100%" : stage.status === "active" ? "50%" : "0%",
                          background: stage.status === "done" ? "#10b981" : stage.status === "active" ? "#3b82f6" : "transparent",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: "#3b82f6" }} />
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {job.currentStage ? `${job.currentStage} stage` : "starting"} · {doneStages}/{totalStages}
                  </span>
                </div>
              </div>
            )}

            {/* Completed stages detail */}
            {job.status === "completed" && (
              <div className="flex items-center gap-3 mt-2">
                {job.stages.filter(s => s.status === "done" && s.durationMs).map((stage, i) => (
                  <span key={i} className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                    {stage.name}: {((stage.durationMs || 0) / 1000).toFixed(1)}s
                  </span>
                ))}
                {job.completedAt && job.startedAt && (
                  <span className="text-[10px] ml-auto font-medium" style={{ color: "var(--text-muted)" }}>
                    Total: {((job.completedAt - job.startedAt) / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Activity Feed ───────────────────────────────────────────────────────

function LiveActivityFeed() {
  const activities = useSwarmActivities(25);

  if (activities.length === 0) {
    return (
      <div className="text-center py-10">
        <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-faint)" }} strokeWidth={1.5} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity yet</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
          Events will appear here in real time
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 max-h-[600px] overflow-y-auto pr-1">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-2.5 p-2 rounded-lg transition-all duration-200 hover:bg-[var(--bg-hover)]"
        >
          <div
            className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
            style={{ background: activity.accent }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {activity.description}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 5000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function MonitorPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]" style={{ background: "var(--bg)" }}>
      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Real-time agent swarm monitoring and build pipeline
          </p>
        </div>

        {/* Stats */}
        <StatsOverview />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: Agents + Jobs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agents */}
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Agent Swarm
              </h2>
              <AgentGrid />
            </div>

            {/* Build Jobs */}
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <BarChart3 className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                Build Pipeline
              </h2>
              <ActiveJobs />
            </div>
          </div>

          {/* Right: Activity Feed */}
          <div className="lg:col-span-1">
            <div
              className="rounded-xl p-5 sticky top-20"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Activity className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                Live Activity
              </h2>
              <LiveActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
