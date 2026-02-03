"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, Tablet, Smartphone, Code, Rocket, Download, Diamond } from "lucide-react";
import { type ModelOption } from "./NavBar";
import ProfileMenu from "./ProfileMenu";
import { useCredits } from "@/lib/use-credits";

type Viewport = "desktop" | "tablet" | "mobile";

interface WorkspaceNavProps {
  projectName: string;
  viewport: Viewport;
  onViewportChange: (vp: Viewport) => void;
  showCode: boolean;
  onToggleCode: () => void;
  model: ModelOption;
  onModelChange: (model: ModelOption) => void;
  onDownload?: () => void;
  onDeploy?: () => void;
  deployUrl?: string;
  isDeploying?: boolean;
  isGenerating?: boolean;
  generationStartTime?: number | null;
  totalDuration?: number;
}

export default function WorkspaceNav({
  projectName,
  viewport,
  onViewportChange,
  showCode,
  onToggleCode,
  onDownload,
  onDeploy,
  deployUrl,
  isDeploying,
  isGenerating,
  generationStartTime,
  totalDuration,
}: WorkspaceNavProps) {
  const { credits, isOwner } = useCredits();

  // Live timer
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isGenerating && generationStartTime) {
      setElapsed(Math.floor((Date.now() - generationStartTime) / 1000));
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - generationStartTime) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isGenerating, generationStartTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const viewports: { id: Viewport; icon: typeof Monitor; label: string }[] = [
    { id: "desktop", icon: Monitor, label: "Desktop" },
    { id: "tablet", icon: Tablet, label: "Tablet" },
    { id: "mobile", icon: Smartphone, label: "Mobile" },
  ];

  return (
    <nav
      className="h-12 backdrop-blur-xl flex items-center justify-between px-2 sm:px-4 gap-1 sm:gap-4"
      style={{
        background: "color-mix(in srgb, var(--bg) 90%, transparent)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Left: Back + Timer/Name */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
        <Link
          href="/"
          className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 text-xs rounded-lg transition-all"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back</span>
        </Link>
        <span className="text-xs hidden sm:inline" style={{ color: "var(--text-faint)" }}>|</span>
        {isGenerating ? (
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#8b5cf6" }}
            />
            <span
              className="text-xs sm:text-sm font-mono font-semibold tabular-nums"
              style={{ color: "var(--text)" }}
            >
              {formatTime(elapsed)}
            </span>
            <span className="text-[10px] sm:text-xs hidden sm:inline" style={{ color: "var(--text-muted)" }}>
              Building...
            </span>
          </div>
        ) : totalDuration ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-[200px]" style={{ color: "var(--text)" }}>
              {projectName}
            </span>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
              style={{
                color: "#10b981",
                background: "rgba(16,185,129,0.1)",
              }}
            >
              {formatTime(Math.round(totalDuration / 1000))}
            </span>
          </div>
        ) : (
          <h1 className="text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-[200px]" style={{ color: "var(--text)" }}>
            {projectName}
          </h1>
        )}
      </div>

      {/* Center: Viewport Switcher — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "var(--bg-secondary)" }}>
        {viewports.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onViewportChange(id)}
            className="p-1.5 rounded-md transition-all"
            style={{
              background: viewport === id ? "var(--bg-hover)" : "transparent",
              color: viewport === id ? "var(--text)" : "var(--text-muted)",
            }}
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      {/* Right: Condensed on mobile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Code toggle — icon only on mobile */}
        <button
          onClick={onToggleCode}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: showCode ? "var(--accent-light)" : "var(--bg-secondary)",
            color: showCode ? "var(--accent-text)" : "var(--text-muted)",
            border: `1px solid ${showCode ? "var(--accent)" : "var(--border)"}`,
          }}
        >
          <Code className="w-3.5 h-3.5 sm:hidden" />
          <span className="hidden sm:flex items-center gap-1.5"><Code className="w-3.5 h-3.5" />Code</span>
        </button>

        {/* Download — hidden on mobile */}
        {onDownload && (
          <button
            onClick={onDownload}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
            title="Download HTML"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Deploy */}
        {deployUrl ? (
          <a
            href={deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live ↗</span>
          </a>
        ) : (
          <button
            onClick={onDeploy}
            disabled={isDeploying || !onDeploy}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <Rocket className={`w-3.5 h-3.5 ${isDeploying ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline">{isDeploying ? "Deploying..." : "Deploy"}</span>
          </button>
        )}

        {/* Credits — compact on mobile */}
        {(() => {
          const raw = isOwner ? 1000 : (credits === Infinity ? 1000 : credits as number);
          const color = raw > 500 ? "#10b981" : raw > 250 ? "#f59e0b" : "#ef4444";
          return (
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 text-[11px] sm:text-xs" style={{ color }}>
              <Diamond className="w-3 h-3" strokeWidth={2.5} />
              <span className="font-semibold tabular-nums">
                {isOwner ? "∞" : credits === Infinity ? "∞" : (credits as number).toLocaleString()}
              </span>
            </div>
          );
        })()}

        {/* Model badge — hidden on mobile */}
        <div
          className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs"
          style={{
            color: "#a78bfa",
            background: "#a78bfa10",
            border: "1px solid #a78bfa20",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#a78bfa" }} />
          <span className="font-medium hidden lg:inline">Sonnet 4.5</span>
        </div>

        <ProfileMenu />
      </div>
    </nav>
  );
}
