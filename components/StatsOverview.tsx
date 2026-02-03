"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Users, ClipboardList, Zap, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsOverviewProps {
  agents: Doc<"agents">[];
  tasks: Doc<"tasks">[];
}

export default function StatsOverview({ agents, tasks }: StatsOverviewProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalAgents = agents.length;
  const pendingTasks = tasks.filter((t) => t.status === "inbox").length;
  const inProgressTasks = tasks.filter((t) => t.status === "dev" || t.status === "testing").length;

  const stats = [
    { label: "Active Agents", value: activeAgents, subValue: `of ${totalAgents} total`, icon: Users, accent: "#10b981" },
    { label: "Pending Tasks", value: pendingTasks, subValue: "awaiting assignment", icon: ClipboardList, accent: "#f59e0b" },
    { label: "In Progress", value: inProgressTasks, subValue: "active development", icon: Zap, accent: "#3b82f6" },
    { label: "System Status", value: "Operational", subValue: "all systems go", icon: CheckCircle, accent: "#10b981" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`relative rounded-xl p-5 transition-all duration-300 hover:scale-[1.03] group ${mounted ? "animate-fadeIn" : "opacity-0"}`}
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
