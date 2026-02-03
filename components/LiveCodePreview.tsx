"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Code2, Eye, Columns2, Maximize2, Minimize2 } from "lucide-react";

type ViewMode = "split" | "code" | "preview";
type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

interface LiveCodePreviewProps {
  /** The accumulated HTML so far (partial during streaming, complete when done) */
  streamedHtml: string;
  /** Whether code is actively streaming in */
  isStreaming: boolean;
  /** Current character count */
  charCount: number;
  /** Current line count */
  lineCount: number;
  /** Current chunk sequence number */
  chunkSeq: number;
  /** Current viewport mode */
  viewport: Viewport;
  /** Stage info — e.g. "Building your website..." */
  stageLabel?: string;
  /** Design system colors for theming the skeleton/loading state */
  designColors?: {
    primary?: string;
    background?: string;
    accent?: string;
  };
}

/**
 * Lightweight HTML syntax highlighting.
 * We avoid heavy deps (Prism/hljs) for bundle size. This covers 90% of readability.
 */
function highlightHTML(code: string): string {
  return code
    // HTML comments
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-comment">$1</span>')
    // DOCTYPE
    .replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span class="tok-doctype">$1</span>')
    // Tags (opening & closing)
    .replace(/(&lt;\/?)([\w-]+)/g, '<span class="tok-bracket">$1</span><span class="tok-tag">$2</span>')
    // Closing bracket
    .replace(/(\/?&gt;)/g, '<span class="tok-bracket">$1</span>')
    // Attributes: name="value"
    .replace(/([\w-]+)(=)(&quot;[^&]*&quot;)/g,
      '<span class="tok-attr">$1</span><span class="tok-eq">$2</span><span class="tok-string">$3</span>'
    )
    // Attributes: name='value'
    .replace(/([\w-]+)(=)(&#39;[^&]*&#39;)/g,
      '<span class="tok-attr">$1</span><span class="tok-eq">$2</span><span class="tok-string">$3</span>'
    );
}

/**
 * Escape HTML for display in code view, then apply syntax highlighting.
 */
function formatCodeDisplay(raw: string): string {
  // Escape for display
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  return highlightHTML(escaped);
}

/**
 * Clean streaming HTML before rendering in iframe.
 * During streaming, the LLM may output markdown fences or preamble text
 * before the actual HTML. This strips that so the iframe renders cleanly.
 */
function cleanStreamingHtml(raw: string): string {
  let cleaned = raw;

  // Strip markdown code fences (```html ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:html)?\s*\n?/gm, '');
  cleaned = cleaned.replace(/\n?```\s*$/gm, '');

  // If it doesn't start with an HTML tag, find the actual HTML start
  const trimmed = cleaned.trimStart();
  if (trimmed && !trimmed.startsWith('<!') && !trimmed.startsWith('<html') && !trimmed.startsWith('<head') && !trimmed.startsWith('<meta')) {
    const doctypeIdx = cleaned.indexOf('<!DOCTYPE');
    const htmlIdx = cleaned.indexOf('<html');
    const headIdx = cleaned.indexOf('<head');
    const startIdx = Math.min(
      doctypeIdx >= 0 ? doctypeIdx : Infinity,
      htmlIdx >= 0 ? htmlIdx : Infinity,
      headIdx >= 0 ? headIdx : Infinity,
    );
    if (startIdx < Infinity) {
      cleaned = cleaned.substring(startIdx);
    }
  }

  return cleaned;
}

export default function LiveCodePreview({
  streamedHtml,
  isStreaming,
  charCount,
  lineCount,
  chunkSeq,
  viewport,
  stageLabel,
  designColors,
}: LiveCodePreviewProps) {
  // Default to preview on mobile, split on desktop
  const [viewMode, setViewMode] = useState<ViewMode>(
    typeof window !== "undefined" && window.innerWidth < 640 ? "preview" : "split"
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const lastIframeUpdateRef = useRef(0);
  const lastHtmlLengthRef = useRef(0);

  // Auto-scroll code panel to bottom during streaming
  useEffect(() => {
    if (isStreaming && codeRef.current) {
      const el = codeRef.current;
      // Only auto-scroll if user hasn't scrolled up significantly
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (isNearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [streamedHtml, isStreaming]);

  // Update iframe preview — throttled to every 1.5s during streaming, immediate when done
  useEffect(() => {
    if (!iframeRef.current || !streamedHtml) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastIframeUpdateRef.current;
    const htmlGrew = streamedHtml.length > lastHtmlLengthRef.current;

    // During streaming: update every 1.5s if HTML has grown
    // After streaming: update immediately on final HTML
    if (isStreaming && htmlGrew && timeSinceLastUpdate < 1500) return;

    lastIframeUpdateRef.current = now;
    lastHtmlLengthRef.current = streamedHtml.length;

    // Clean the HTML before rendering — strips markdown fences and preamble
    const cleanHtml = cleanStreamingHtml(streamedHtml);

    const doc = iframeRef.current.contentDocument;
    if (doc && cleanHtml.trim()) {
      doc.open();
      doc.write(cleanHtml);
      doc.close();
    }
  }, [streamedHtml, isStreaming]);

  // Reset iframe key when viewport changes
  useEffect(() => {
    setIframeKey(k => k + 1);
    lastIframeUpdateRef.current = 0; // Force re-render
  }, [viewport]);

  // Compute formatted code with highlighting (memoized for perf)
  const formattedCode = useMemo(() => {
    if (!streamedHtml) return '';
    return formatCodeDisplay(streamedHtml);
  }, [streamedHtml]);

  // Progress bar — estimate completion based on expected ~50K chars for a full site
  const estimatedTotal = 55000;
  const progressPercent = Math.min((charCount / estimatedTotal) * 100, 98);

  const primaryColor = designColors?.primary || '#8b5cf6';

  return (
    <div className={`flex flex-col h-full ${isExpanded ? 'fixed inset-0 z-50' : ''}`} style={{ background: '#0d0d0d' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-2 sm:px-3 py-1.5 shrink-0 gap-1"
        style={{ 
          background: '#161618',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Left: view mode toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
              viewMode === "code" ? "text-white" : "text-gray-500 hover:text-gray-300"
            }`}
            style={viewMode === "code" ? { background: 'rgba(255,255,255,0.08)' } : {}}
          >
            <Code2 className="w-3 h-3" />
            <span className="hidden sm:inline">Code</span>
          </button>
          {/* Split — hidden on mobile (too narrow) */}
          <button
            onClick={() => setViewMode("split")}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === "split" ? "text-white" : "text-gray-500 hover:text-gray-300"
            }`}
            style={viewMode === "split" ? { background: 'rgba(255,255,255,0.08)' } : {}}
          >
            <Columns2 className="w-3 h-3" />
            Split
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
              viewMode === "preview" ? "text-white" : "text-gray-500 hover:text-gray-300"
            }`}
            style={viewMode === "preview" ? { background: 'rgba(255,255,255,0.08)' } : {}}
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>

        {/* Center: streaming stats — simplified on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {isStreaming && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ 
                      background: primaryColor,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-500 hidden sm:inline truncate">
                {stageLabel || 'Generating...'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] tabular-nums text-gray-500">
            <span>{lineCount.toLocaleString()}<span className="hidden sm:inline"> lines</span><span className="sm:hidden">L</span></span>
            <span className="hidden sm:inline">{charCount.toLocaleString()} chars</span>
          </div>
        </div>

        {/* Right: expand toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors shrink-0"
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Streaming progress bar */}
      {isStreaming && (
        <div className="relative h-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div
            className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)`,
            }}
          />
          {/* Shimmer effect */}
          <div
            className="absolute inset-y-0 animate-shimmer"
            style={{
              width: '30%',
              background: `linear-gradient(90deg, transparent, ${primaryColor}33, transparent)`,
              left: `${progressPercent - 15}%`,
            }}
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Code panel */}
        {(viewMode === "code" || viewMode === "split") && (
          <div
            ref={codeRef}
            className={`overflow-auto ${viewMode === "split" ? "w-1/2" : "flex-1"}`}
            style={{
              background: '#0d0d0d',
              borderRight: viewMode === "split" ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            {/* Line numbers + code */}
            <div className="flex min-h-full">
              {/* Line numbers gutter */}
              <div 
                className="sticky left-0 shrink-0 text-right pr-3 pl-3 pt-3 pb-3 select-none"
                style={{ 
                  background: '#0d0d0d',
                  color: 'rgba(255,255,255,0.15)',
                  fontSize: '11px',
                  lineHeight: '1.6',
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                  minWidth: '3rem',
                }}
              >
                {streamedHtml.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code content */}
              <div className="flex-1 p-3 overflow-x-auto">
                <pre
                  className="whitespace-pre"
                  style={{
                    fontSize: '11px',
                    lineHeight: '1.6',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
                    color: '#d4d4d4',
                  }}
                >
                  <code dangerouslySetInnerHTML={{ __html: formattedCode }} />
                  {isStreaming && (
                    <span 
                      className="inline-block w-[2px] h-[14px] ml-px animate-pulse"
                      style={{ background: primaryColor, verticalAlign: 'text-bottom' }}
                    />
                  )}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Preview panel */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={`flex items-start justify-center overflow-auto ${
              viewMode === "split" ? "w-1/2" : "flex-1"
            }`}
            style={{ background: '#1a1a1e' }}
          >
            <div
              className="relative bg-white overflow-hidden transition-all duration-300"
              style={{
                width: viewport === "desktop" ? "100%" : VIEWPORT_WIDTHS[viewport],
                maxWidth: "100%",
                height: "100%",
                minHeight: "100%",
              }}
            >
              {/* Preview loading skeleton */}
              {!streamedHtml && isStreaming && (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: designColors?.background || '#0f0f0f' }}
                >
                  <div className="w-16 h-16 rounded-2xl animate-pulse" style={{ background: `${primaryColor}22` }} />
                  <div className="flex flex-col gap-2 items-center">
                    <div className="w-48 h-3 rounded animate-pulse" style={{ background: `${primaryColor}15` }} />
                    <div className="w-32 h-2 rounded animate-pulse" style={{ background: `${primaryColor}10` }} />
                  </div>
                </div>
              )}

              {/* Live preview indicator */}
              {isStreaming && streamedHtml && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
                  <span className="text-[10px] text-white/70">Live</span>
                </div>
              )}

              <iframe
                key={iframeKey}
                ref={iframeRef}
                className="w-full h-full border-0"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>

      {/* Inline styles for syntax highlighting + animations */}
      <style jsx global>{`
        .tok-tag { color: #569cd6; }
        .tok-attr { color: #9cdcfe; }
        .tok-string { color: #ce9178; }
        .tok-bracket { color: #808080; }
        .tok-comment { color: #6a9955; font-style: italic; }
        .tok-doctype { color: #569cd6; }
        .tok-eq { color: #d4d4d4; }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
