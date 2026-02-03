"use client";

import { useEffect, useRef, useState, useMemo } from "react";

type Viewport = "desktop" | "tablet" | "mobile";
type PreviewStage = "intent" | "design" | "content" | "codegen" | "quality";

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

/** Stage-specific animated messages to keep the user engaged */
const STAGE_MESSAGES: Record<string, string[]> = {
  intent: [
    "Reading your request...",
    "Understanding your vision...",
    "Identifying the perfect layout...",
    "Analyzing design requirements...",
    "Mapping content strategy...",
  ],
  design: [
    "Selecting color palette...",
    "Choosing typography...",
    "Designing visual hierarchy...",
    "Crafting the aesthetic...",
    "Fine-tuning spacing & rhythm...",
  ],
  content: [
    "Writing compelling headlines...",
    "Crafting section content...",
    "Building the story flow...",
    "Creating call-to-actions...",
    "Polishing the copy...",
  ],
};

interface PipelinePreviewProps {
  stage: PreviewStage;
  viewport: Viewport;
  businessName?: string;
  siteType?: string;
  mood?: string;
  sections?: string[];
  colors?: {
    primary?: string;
    background?: string;
    foreground?: string;
    accent?: string;
    card?: string;
    border?: string;
  };
  fonts?: {
    display?: string;
    body?: string;
    googleImportUrl?: string;
  };
  sectionTitles?: Record<string, string>;
}

function formatSectionTitle(id: string): string {
  return id
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Layout templates per site type */
function getLayoutSections(siteType?: string): string[] {
  const layouts: Record<string, string[]> = {
    saas_landing: ["hero", "features", "how-it-works", "pricing", "testimonials", "cta", "footer"],
    ecommerce: ["hero", "categories", "featured-products", "deals", "testimonials", "newsletter", "footer"],
    portfolio: ["hero", "projects", "about", "skills", "testimonials", "contact", "footer"],
    restaurant: ["hero", "menu-highlights", "about", "gallery", "reviews", "reservations", "footer"],
    healthcare: ["hero", "services", "about-us", "team", "testimonials", "booking", "footer"],
    real_estate: ["hero", "featured-listings", "services", "about", "testimonials", "contact", "footer"],
    agency_studio: ["hero", "services", "portfolio", "process", "team", "cta", "footer"],
    startup_landing: ["hero", "features", "how-it-works", "social-proof", "cta", "footer"],
    personal_resume: ["hero", "experience", "skills", "projects", "education", "contact", "footer"],
  };
  return layouts[siteType || "startup_landing"] || layouts.startup_landing;
}

function generatePreviewHtml(props: PipelinePreviewProps): string {
  const {
    stage,
    businessName = "Your Website",
    siteType,
    mood,
    sections: customSections,
    colors,
    fonts,
    sectionTitles,
  } = props;

  const hasDesign = stage !== "intent";
  const hasContent = stage === "content" || stage === "codegen" || stage === "quality";

  // Colors — progressively applied
  const bg = hasDesign && colors?.background ? colors.background : "#0a0a0f";
  const fg = hasDesign && colors?.foreground ? colors.foreground : "#e8e8ed";
  const primary = hasDesign && colors?.primary ? colors.primary : "#8b5cf6";
  const accent = hasDesign && colors?.accent ? colors.accent : primary;
  const cardBg = hasDesign && colors?.card ? colors.card : `${primary}08`;
  const borderColor = hasDesign && colors?.border ? colors.border : `${primary}15`;

  // Fonts — applied after design stage
  const displayFont = hasDesign && fonts?.display ? fonts.display : "system-ui";
  const bodyFont = hasDesign && fonts?.body ? fonts.body : "system-ui";
  const fontUrl = hasDesign && fonts?.googleImportUrl ? fonts.googleImportUrl : "";
  const fontImport = fontUrl
    ? `<link href="${fontUrl}" rel="stylesheet">`
    : hasDesign && fonts?.display
    ? `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonts.display)}:wght@400;600;700&family=${encodeURIComponent(fonts.body || fonts.display)}:wght@400;500&display=swap" rel="stylesheet">`
    : "";

  // Sections — from content plan or inferred from site type
  const sections = customSections && customSections.length > 0
    ? customSections
    : getLayoutSections(siteType);

  const showName = businessName !== "Your Website" && hasDesign;
  const stageLabel =
    stage === "intent"
      ? "Analyzing your request..."
      : stage === "design"
      ? "Applying design system..."
      : stage === "content"
      ? "Planning content structure..."
      : "Preparing...";

  // Determine if mood is light
  const isLight = mood?.includes("clean") || mood?.includes("warm") || bg.startsWith("#f") || bg.startsWith("#e") || bg === "#ffffff";
  const skeletonColor = isLight ? `${primary}15` : `${primary}12`;
  const skeletonHighlight = isLight ? `${primary}25` : `${primary}20`;

  // Generate sections HTML
  const sectionsHtml = sections
    .map((sectionId, i) => {
      const title = sectionTitles?.[sectionId] || (hasContent ? formatSectionTitle(sectionId) : "");
      const isHero = sectionId === "hero" || i === 0;
      const isFooter = sectionId === "footer" || i === sections.length - 1;

      if (isHero) {
        return `
      <section class="hero" style="min-height:85vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;padding:40px 24px;position:relative;overflow:hidden;">
        <!-- Background gradient orbs (animated) -->
        <div style="position:absolute;top:10%;left:50%;transform:translateX(-50%);width:600px;height:600px;border-radius:50%;background:radial-gradient(circle, ${primary}18 0%, transparent 70%);pointer-events:none;animation:pulseGlow 4s ease-in-out infinite;"></div>
        <div style="position:absolute;top:30%;left:30%;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle, ${accent}10 0%, transparent 70%);pointer-events:none;animation:orbit 12s linear infinite;"></div>
        <div style="position:absolute;bottom:20%;right:25%;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle, ${primary}0d 0%, transparent 70%);pointer-events:none;animation:orbit 18s linear infinite reverse;"></div>
        
        ${showName ? `
          <h1 style="font-family:'${displayFont}',system-ui;font-size:clamp(36px,6vw,64px);font-weight:700;color:${fg};text-align:center;position:relative;letter-spacing:-0.02em;line-height:1.1;overflow:hidden;white-space:nowrap;border-right:3px solid ${primary};animation:typeIn 1.2s steps(${businessName.length}, end) forwards, pulseGlow 1s step-end infinite;">
            ${businessName}
          </h1>
        ` : `
          <div class="skel" style="width:min(400px,70%);height:48px;border-radius:10px;animation:colorPulse 2s ease-in-out infinite;"></div>
        `}
        
        ${hasContent && title ? `
          <p style="font-family:'${bodyFont}',system-ui;font-size:clamp(16px,2vw,20px);color:${fg}88;text-align:center;max-width:500px;line-height:1.6;position:relative;animation:fadeUp 0.8s ease-out 0.5s both;">
            ${title || `Welcome to ${businessName}`}
          </p>
        ` : `
          <div class="skel" style="width:min(300px,50%);height:18px;border-radius:6px;animation-delay:0.15s;"></div>
          <div class="skel" style="width:min(220px,35%);height:14px;border-radius:5px;animation-delay:0.25s;"></div>
        `}
        
        <div style="display:flex;gap:12px;margin-top:20px;position:relative;animation:fadeUp 0.8s ease-out 0.8s both;">
          <div class="skel" style="width:140px;height:48px;border-radius:24px;${hasDesign ? `background:${primary}30;animation:colorPulse 2.5s ease-in-out infinite;` : ""}animation-delay:0.35s;"></div>
          <div class="skel" style="width:140px;height:48px;border-radius:24px;border:1px solid ${borderColor};background:transparent !important;animation-delay:0.45s;"></div>
        </div>
      </section>`;
      }

      if (isFooter) {
        return `
      <footer style="padding:60px 24px 30px;border-top:1px solid ${borderColor};margin-top:40px;">
        <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:30px;">
          ${[1, 2, 3, 4]
            .map(
              (j) => `
            <div>
              <div class="skel" style="width:80px;height:12px;border-radius:4px;margin-bottom:16px;animation-delay:${j * 0.1}s;${hasDesign ? `background:${primary}18;` : ""}"></div>
              ${[1, 2, 3]
                .map(
                  (k) => `<div class="skel" style="width:${60 + k * 15}px;height:10px;border-radius:3px;margin-bottom:10px;animation-delay:${j * 0.1 + k * 0.05}s;"></div>`
                )
                .join("")}
            </div>`
            )
            .join("")}
        </div>
        ${showName ? `
          <p style="text-align:center;margin-top:40px;font-size:12px;color:${fg}44;font-family:'${bodyFont}',system-ui;">
            © ${new Date().getFullYear()} ${businessName}
          </p>
        ` : ""}
      </footer>`;
      }

      // Regular content section — cards grid
      const cardCount = sectionId.includes("pricing") ? 3 : sectionId.includes("team") ? 4 : 3;
      return `
      <section style="padding:80px 24px;max-width:1100px;margin:0 auto;">
        ${hasContent && title ? `
          <h2 style="font-family:'${displayFont}',system-ui;font-size:clamp(24px,3vw,36px);font-weight:600;color:${fg};text-align:center;margin-bottom:12px;letter-spacing:-0.01em;">
            ${title}
          </h2>
          <div class="skel" style="width:min(350px,60%);height:12px;border-radius:4px;margin:0 auto 48px;animation-delay:${i * 0.1}s;"></div>
        ` : `
          <div class="skel" style="width:min(200px,40%);height:24px;border-radius:6px;margin:0 auto 12px;animation-delay:${i * 0.1}s;${hasDesign ? `background:${skeletonHighlight};` : ""}"></div>
          <div class="skel" style="width:min(300px,55%);height:12px;border-radius:4px;margin:0 auto 48px;animation-delay:${i * 0.1 + 0.05}s;"></div>
        `}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;">
          ${Array.from({ length: cardCount })
            .map(
              (_, j) => `
            <div style="background:${cardBg};border:1px solid ${borderColor};border-radius:14px;padding:28px;transition:transform 0.3s,box-shadow 0.3s;">
              <div class="skel" style="width:44px;height:44px;border-radius:12px;margin-bottom:18px;animation-delay:${(i * 3 + j) * 0.08}s;${hasDesign ? `background:${primary}18;` : ""}"></div>
              <div class="skel" style="width:75%;height:16px;border-radius:4px;margin-bottom:12px;animation-delay:${(i * 3 + j) * 0.08 + 0.1}s;"></div>
              <div class="skel" style="width:100%;height:10px;border-radius:3px;margin-bottom:8px;animation-delay:${(i * 3 + j) * 0.08 + 0.15}s;"></div>
              <div class="skel" style="width:85%;height:10px;border-radius:3px;margin-bottom:8px;animation-delay:${(i * 3 + j) * 0.08 + 0.2}s;"></div>
              <div class="skel" style="width:55%;height:10px;border-radius:3px;animation-delay:${(i * 3 + j) * 0.08 + 0.25}s;"></div>
            </div>`
            )
            .join("")}
        </div>
      </section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${fontImport}
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      background: ${bg};
      color: ${fg};
      font-family: '${bodyFont}', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      transition: background-color 1s ease, color 0.8s ease;
    }

    @keyframes shimmer {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.5; }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.8; }
    }
    @keyframes slideShimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    @keyframes typeIn {
      from { width: 0; }
      to { width: 100%; }
    }
    @keyframes colorPulse {
      0%, 100% { box-shadow: 0 0 0 0 ${primary}00; }
      50% { box-shadow: 0 0 20px 4px ${primary}33; }
    }
    @keyframes orbit {
      from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
      to { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
    }

    .skel {
      background: ${skeletonColor};
      animation: shimmer 2.2s ease-in-out infinite;
      position: relative;
      overflow: hidden;
    }
    .skel::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, ${primary}15, transparent);
      animation: slideShimmer 2s ease-in-out infinite;
    }

    nav {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 28px;
      background: ${bg}dd;
      backdrop-filter: blur(16px);
      border-bottom: 1px solid ${borderColor};
      animation: fadeUp 0.5s ease-out both;
    }

    section, footer {
      animation: fadeUp 0.7s ease-out both;
    }
    section:nth-of-type(1) { animation-delay: 0.1s; }
    section:nth-of-type(2) { animation-delay: 0.25s; }
    section:nth-of-type(3) { animation-delay: 0.4s; }
    section:nth-of-type(4) { animation-delay: 0.55s; }
    section:nth-of-type(5) { animation-delay: 0.7s; }
    footer { animation-delay: 0.85s; }

    /* Stage indicator */
    .stage-indicator {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: ${bg}ee;
      border: 1px solid ${borderColor};
      border-radius: 20px;
      backdrop-filter: blur(12px);
      z-index: 100;
      animation: fadeUp 0.4s ease-out;
    }
    .stage-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${primary};
      animation: pulseGlow 1.5s ease-in-out infinite;
    }
    .stage-label {
      font-size: 12px;
      color: ${fg}88;
      font-family: '${bodyFont}', system-ui;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
  </style>
</head>
<body>
  <!-- Navigation skeleton -->
  <nav>
    <div style="display:flex;align-items:center;gap:10px;">
      <div class="skel" style="width:30px;height:30px;border-radius:9px;${hasDesign ? `background:${primary}25;` : ""}"></div>
      ${showName
        ? `<span style="font-family:'${displayFont}',system-ui;font-weight:600;font-size:15px;color:${fg};opacity:0.9;">${businessName}</span>`
        : `<div class="skel" style="width:100px;height:14px;border-radius:4px;"></div>`
      }
    </div>
    <div style="display:flex;gap:24px;align-items:center;">
      ${[1, 2, 3]
        .map(
          (n) => `<div class="skel" style="width:${50 + n * 8}px;height:10px;border-radius:3px;animation-delay:${n * 0.08}s;"></div>`
        )
        .join("")}
    </div>
    <div class="skel" style="width:100px;height:36px;border-radius:18px;${hasDesign ? `background:${primary}20;` : ""}"></div>
  </nav>

  ${sectionsHtml}

  <!-- Stage indicator with rotating messages -->
  <div class="stage-indicator">
    <div class="stage-dot"></div>
    <span class="stage-label" id="stage-msg">${stageLabel}</span>
  </div>
  
  <script>
    (function() {
      var msgs = ${JSON.stringify(STAGE_MESSAGES[stage] || [stageLabel])};
      var el = document.getElementById('stage-msg');
      var idx = 0;
      if (el && msgs.length > 1) {
        setInterval(function() {
          idx = (idx + 1) % msgs.length;
          el.style.opacity = '0';
          el.style.transform = 'translateY(4px)';
          setTimeout(function() {
            el.textContent = msgs[idx];
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, 200);
        }, 3000);
      }
    })();
  </script>
</body>
</html>`;
}

export default function PipelinePreview(props: PipelinePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const lastHtmlRef = useRef("");

  const html = useMemo(() => generatePreviewHtml(props), [
    props.stage,
    props.businessName,
    props.siteType,
    props.mood,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(props.sections),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(props.colors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(props.fonts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(props.sectionTitles),
  ]);

  useEffect(() => {
    if (iframeRef.current && html && html !== lastHtmlRef.current) {
      lastHtmlRef.current = html;
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html, iframeKey]);

  useEffect(() => {
    setIframeKey((k) => k + 1);
    lastHtmlRef.current = "";
  }, [props.viewport]);

  return (
    <div
      className="flex-1 flex items-start justify-center overflow-auto"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div
        className="relative bg-white overflow-hidden transition-all duration-300"
        style={{
          width: props.viewport === "desktop" ? "100%" : VIEWPORT_WIDTHS[props.viewport],
          maxWidth: "100%",
          height: "100%",
          minHeight: "100%",
        }}
      >
        {/* Live building indicator */}
        <div
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: props.colors?.primary || "#8b5cf6" }}
          />
          <span className="text-[10px] text-white/70">Building</span>
        </div>

        <iframe
          key={iframeKey}
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Pipeline Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
