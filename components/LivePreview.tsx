"use client";

import { useEffect, useRef, useState } from "react";

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

interface LivePreviewProps {
  html: string;
  viewport: Viewport;
  isGenerating: boolean;
}

export default function LivePreview({ html, viewport, isGenerating }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    console.log("[LivePreview] HTML updated, length:", html?.length || 0);
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        console.log("[LivePreview] Writing to iframe, length:", html.length);
        doc.open();
        doc.write(html);
        doc.close();
        console.log("[LivePreview] Iframe write complete");
      } else {
        console.warn("[LivePreview] No contentDocument available");
      }
    } else {
      console.log("[LivePreview] Skipping render:", { 
        hasIframe: !!iframeRef.current, 
        hasHtml: !!html,
        htmlLength: html?.length || 0
      });
    }
  }, [html, iframeKey]);

  useEffect(() => {
    setIframeKey((k) => k + 1);
  }, [viewport]);

  return (
    <div
      className="flex-1 flex items-start justify-center overflow-auto p-4"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div
        className="relative bg-white rounded-lg overflow-hidden transition-all duration-300"
        style={{
          width: VIEWPORT_WIDTHS[viewport],
          maxWidth: "100%",
          height: viewport === "mobile" ? "812px" : viewport === "tablet" ? "1024px" : "100%",
          minHeight: viewport === "desktop" ? "calc(100vh - 8rem)" : undefined,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Loading overlay */}
        {isGenerating && !html && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Agents are building...</p>
          </div>
        )}

        {/* Streaming indicator */}
        {isGenerating && html && (
          <div
            className="absolute top-0 left-0 right-0 h-0.5 animate-pulse-subtle z-10"
            style={{ background: `linear-gradient(to right, var(--accent), #3b82f6, var(--accent))` }}
          />
        )}

        {/* Empty state */}
        {!html && !isGenerating && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Preview will appear here</p>
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
  );
}
