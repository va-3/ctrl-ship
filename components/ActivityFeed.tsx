import { Doc } from "@/convex/_generated/dataModel";
import {
  FileText, UserPlus, CheckCircle2, Bot, Pause, GitBranch,
  Sparkles, Rocket, FlaskConical, XCircle, Activity
} from "lucide-react";

interface ActivityFeedProps {
  activities: Doc<"activities">[];
}

const typeConfig: Record<string, { icon: typeof Activity; accent: string }> = {
  task_created: { icon: FileText, accent: "#3b82f6" },
  task_assigned: { icon: UserPlus, accent: "#8b5cf6" },
  pr_opened: { icon: GitBranch, accent: "#06b6d4" },
  pr_reviewed: { icon: Activity, accent: "#f59e0b" },
  pr_merged: { icon: Sparkles, accent: "#10b981" },
  tests_passed: { icon: FlaskConical, accent: "#10b981" },
  tests_failed: { icon: XCircle, accent: "#ef4444" },
  deployed: { icon: Rocket, accent: "#8b5cf6" },
  bug_found: { icon: XCircle, accent: "#f97316" },
  agent_spawned: { icon: Bot, accent: "#10b981" },
  agent_paused: { icon: Pause, accent: "#94a3b8" },
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-faint)" }} strokeWidth={1.5} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
      {activities.map((activity) => {
        const config = typeConfig[activity.type] || { icon: Activity, accent: "#94a3b8" };
        const Icon = config.icon;

        return (
          <div
            key={activity._id}
            className="group flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200"
          >
            <div
              className="p-1.5 rounded-lg flex-shrink-0"
              style={{ background: `${config.accent}10` }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: config.accent }} strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {activity.description}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {new Date(activity.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
