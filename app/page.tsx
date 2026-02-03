"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Globe } from "lucide-react";
import AnimatedHero from "@/components/AnimatedHero";
import PromptInput from "@/components/PromptInput";
import TemplateGrid from "@/components/TemplateGrid";
import { getCreditsStore } from "@/lib/credits-store";

export default function HomePage() {
  const router = useRouter();
  const [importUrl, setImportUrl] = useState("");
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Owner mode
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("owner") === "true") {
        getCreditsStore().setOwner(true);
      }
    } catch {
      /* SSR safety */
    }
  }, []);

  const goToWorkspace = (prompt: string, quality: string) => {
    sessionStorage.setItem("buildPrompt", prompt);
    sessionStorage.setItem("buildQuality", quality);
    sessionStorage.setItem("buildModel", "anthropic/claude-sonnet-4-5");
    router.push("/workspace");
  };

  const handleSubmit = (prompt: string, quality: string) => {
    goToWorkspace(prompt, quality);
  };

  const handleTemplateSelect = (templatePrompt: string) => {
    goToWorkspace(templatePrompt, "best");
  };

  const handleScreenshotUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("buildImage", reader.result as string);
      goToWorkspace(
        "Recreate this website from the screenshot — match the design, layout, colors, and content as closely as possible.",
        "best"
      );
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleImportSubmit = () => {
    if (!importUrl.trim()) return;
    const url = importUrl.trim().startsWith("http") ? importUrl.trim() : `https://${importUrl.trim()}`;
    goToWorkspace(
      `Recreate the website at ${url} — match its design, layout, typography, colors, and content as closely as possible. Make it a single-page HTML site.`,
      "best"
    );
    setShowImport(false);
  };

  return (
    <div className="min-h-[calc(100vh-52px)]" style={{ background: "var(--bg)" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hero + Prompt */}
      <section className="pt-20 pb-6 px-4">
        <AnimatedHero />
        <div className="mt-10">
          <PromptInput onSubmit={handleSubmit} />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <button
            onClick={handleScreenshotUpload}
            className="flex items-center gap-1.5 text-[12px] transition-colors hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <Camera className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Recreate Screenshot</span>
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 text-[12px] transition-colors hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Import from Site</span>
          </button>
        </div>

        {showImport && (
          <div className="mt-4 max-w-md mx-auto flex gap-2">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImportSubmit()}
              placeholder="https://example.com"
              autoFocus
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--bg-input, var(--bg-secondary))",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
            <button
              onClick={handleImportSubmit}
              disabled={!importUrl.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: "var(--text)", color: "var(--bg)" }}
            >
              Import
            </button>
            <button
              onClick={() => setShowImport(false)}
              className="px-3 py-2.5 rounded-xl text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              ✕
            </button>
          </div>
        )}
      </section>

      {/* Templates */}
      <section className="px-4 pt-10 pb-8 max-w-4xl mx-auto">
        <TemplateGrid onSelectTemplate={handleTemplateSelect} compact />
      </section>

      {/* How It Works */}
      <section className="px-4 py-16" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { title: "Describe", desc: "Tell AI what you want. Natural language, screenshots, or templates." },
            { title: "Iterate", desc: "Refine with feedback. Multi-agent reviews catch issues humans miss." },
            { title: "Ship", desc: "Production-ready code deployed live with one click." },
          ].map((step, i) => (
            <div key={i} className="text-center sm:text-left">
              <h3 className="text-[14px] font-semibold mb-1.5" style={{ color: "var(--text)" }}>{step.title}</h3>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-4 py-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>© 2026 CTRL+Ship. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
