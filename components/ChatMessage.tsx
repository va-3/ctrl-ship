"use client";

import { User, CheckCircle, Palette, Type } from "lucide-react";
import type { MessageMetadata } from "./BuildChat";

interface ChatMessageProps {
  role: "user" | "assistant" | "agent";
  agentName?: string;
  agentEmoji?: string;
  content: string;
  timestamp?: string;
  metadata?: MessageMetadata;
}

function isHtmlContent(content: string): boolean {
  return content.trimStart().startsWith("<!DOCTYPE") || content.trimStart().startsWith("<html");
}

function getHtmlSummary(html: string): { lines: number; sizeKb: string } {
  const lines = html.split("\n").length;
  const sizeKb = (html.length / 1024).toFixed(1);
  return { lines, sizeKb };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#10b981";
  if (score >= 70) return "#f59e0b";
  if (score >= 50) return "#f97316";
  return "#ef4444";
}

export default function ChatMessage({
  role,
  content,
  timestamp,
  metadata,
}: ChatMessageProps) {
  const isUser = role === "user";
  const isHtml = !isUser && isHtmlContent(content);
  const isGeneration = metadata?.type === "generation";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
        style={{
          background: isUser ? "var(--accent-light)" : "var(--bg-tertiary)",
          color: isUser ? "var(--accent)" : "var(--text-muted)",
          border: isUser ? "none" : "1px solid var(--border)",
        }}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : "✦"}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? "text-right" : ""}`}>
        {/* Name */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? "justify-end" : ""}`}>
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {isUser ? "You" : "Assistant"}
          </span>
          {timestamp && (
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
              {timestamp}
            </span>
          )}
        </div>

        {/* Message */}
        <div
          className="inline-block text-sm leading-relaxed rounded-2xl px-4 py-2.5 max-w-full"
          style={{
            background: isUser ? "var(--accent-light)" : "var(--bg-secondary)",
            color: isUser ? "var(--text)" : "var(--text-secondary)",
            border: `1px solid ${isUser ? "var(--accent-light)" : "var(--border)"}`,
          }}
        >
          {isHtml && isGeneration ? (
            // Rich generation summary with pipeline details
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#10b981" }} />
                <div>
                  <p className="font-medium" style={{ color: "var(--text)" }}>
                    Build complete!
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {getHtmlSummary(content).sizeKb} KB · {getHtmlSummary(content).lines} lines
                    {metadata?.totalDurationMs ? ` · ${formatDuration(metadata.totalDurationMs)}` : ""}
                    {metadata?.tier ? ` · ${metadata.tier} tier` : ""}
                  </p>
                </div>
                {metadata?.qualityScore !== undefined && (
                  <span
                    className="ml-auto text-xs font-bold tabular-nums"
                    style={{ color: getScoreColor(metadata.qualityScore) }}
                  >
                    {metadata.qualityScore}/100
                  </span>
                )}
              </div>

              {/* Design system info */}
              {metadata?.designSystem && (
                <div
                  className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg"
                  style={{ background: "var(--bg-tertiary, rgba(255,255,255,0.03))" }}
                >
                  {metadata.designSystem.primary && (
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ background: metadata.designSystem.primary }}
                      />
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ background: metadata.designSystem.background }}
                      />
                    </div>
                  )}
                  {metadata.designSystem.displayFont && (
                    <div className="flex items-center gap-1.5">
                      <Type className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {metadata.designSystem.displayFont} + {metadata.designSystem.bodyFont}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Intent info */}
              {metadata?.intentResult && (
                <div className="text-[10px] space-y-0.5" style={{ color: "var(--text-muted)" }}>
                  <span>
                    Detected: <strong>{metadata.intentResult.siteType.replace(/_/g, " ")}</strong>
                    {" · "}
                    {metadata.intentResult.mood.replace(/_/g, " ")}
                    {" · "}
                    {(metadata.intentResult.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              )}

              {/* Pipeline stages summary */}
              {metadata?.stagesSummary && (
                <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                  {metadata.stagesSummary}
                </div>
              )}

              <p className="text-xs">
                Review the preview and let me know if you&apos;d like any changes.
              </p>
            </div>
          ) : isHtml ? (
            // Simple HTML summary (iterations)
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#10b981" }} />
              <div>
                <p className="font-medium" style={{ color: "var(--text)" }}>
                  Changes applied!
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {getHtmlSummary(content).sizeKb} KB · {getHtmlSummary(content).lines} lines
                </p>
                <p className="text-xs mt-1">
                  Review the preview and let me know if you&apos;d like more changes.
                </p>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
