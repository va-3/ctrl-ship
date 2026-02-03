"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
  ArrowUp,
  ImagePlus,
  ChevronDown,
  Zap,
  Crown,
} from "lucide-react";

const TIERS = [
  { id: "fast", label: "Fast", icon: Zap, desc: "2 agents · ~30s", cost: 100, color: "#22c55e" },
  { id: "best", label: "Best", icon: Crown, desc: "5 agents · ~2min", cost: 250, color: "#f59e0b" },
];

interface PromptInputProps {
  onSubmit: (prompt: string, quality: string) => void;
  initialPrompt?: string;
  placeholder?: string;
  isLoading?: boolean;
}

export default function PromptInput({
  onSubmit,
  initialPrompt = "",
  placeholder = "Describe what you want to create...",
  isLoading = false,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedTier, setSelectedTier] = useState(TIERS[1]); // Default: best
  const [tierOpen, setTierOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim(), selectedTier.id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = prompt.trim().length > 0 && !isLoading;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="relative rounded-2xl transition-all duration-300"
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent text-[15px] px-5 pt-5 pb-2 resize-none outline-none min-h-[56px] leading-relaxed"
          style={{ color: "var(--text)" }}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left: Upload + model badge */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="p-2 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              title="Upload image"
              onClick={() => {
                // Trigger file input from parent via event
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    sessionStorage.setItem("buildImage", reader.result as string);
                    setPrompt((prev) => prev || "Recreate this website from the uploaded image");
                  };
                  reader.readAsDataURL(file);
                };
                input.click();
              }}
            >
              <ImagePlus className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>

            <div className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />

            {/* Model badge (Sonnet only — no dropdown) */}
            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#a78bfa" }} />
              <span className="font-medium"><span className="hidden sm:inline">Sonnet </span>4.5</span>
            </div>
          </div>

          {/* Right: Tier selector + Submit */}
          <div className="flex items-center gap-2">
            {/* Tier Selector */}
            <div className="relative">
              <button
                onClick={() => setTierOpen(!tierOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                style={{ color: "var(--text-muted)" }}
              >
                <selectedTier.icon className="w-3.5 h-3.5" style={{ color: selectedTier.color }} />
                <span className="font-medium hidden sm:inline">{selectedTier.label}</span>
                <span className="text-[10px] font-semibold" style={{ color: selectedTier.color }}>⚡{selectedTier.cost}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${tierOpen ? "rotate-180" : ""}`} />
              </button>

              {tierOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setTierOpen(false)} />
                  <div
                    className="absolute right-0 bottom-full mb-2 w-56 rounded-xl z-20 p-1.5"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-lg)",
                    }}
                  >
                    <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                      Quality
                    </div>
                    {TIERS.map((tier) => {
                      const TierIcon = tier.icon;
                      return (
                        <button
                          key={tier.id}
                          onClick={() => { setSelectedTier(tier); setTierOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left transition-all"
                          style={{
                            color: selectedTier.id === tier.id ? "var(--text)" : "var(--text-muted)",
                            background: selectedTier.id === tier.id ? "var(--bg-hover)" : "transparent",
                          }}
                        >
                          <TierIcon className="w-4 h-4 shrink-0" style={{ color: tier.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">{tier.label}</span>
                              <span className="text-[10px] font-bold" style={{ color: tier.color }}>⚡{tier.cost}</span>
                            </div>
                            <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>{tier.desc}</div>
                          </div>
                          {selectedTier.id === tier.id && (
                            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="p-2.5 rounded-xl transition-all duration-200"
              style={{
                background: canSubmit ? "var(--text)" : "var(--bg-tertiary)",
                color: canSubmit ? "var(--bg)" : "var(--text-muted)",
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
              title="Build (Enter)"
            >
              <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
