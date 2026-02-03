"use client";

import { useState } from "react";
import { ThumbsUp, Pencil, TrendingUp, RotateCcw, Save, X, Image } from "lucide-react";

const FEEDBACK_OPTIONS = [
  { id: "perfect", icon: ThumbsUp, label: "Perfect", accent: "#10b981" },
  { id: "adjust", icon: Pencil, label: "Adjust", accent: "#3b82f6" },
  { id: "improve", icon: TrendingUp, label: "Improve", accent: "#eab308" },
  { id: "redo", icon: RotateCcw, label: "Different Direction", accent: "#f97316" },
  { id: "save", icon: Save, label: "Save Components", accent: "#8b5cf6" },
];

interface FeedbackPanelProps {
  onSubmit: (feedbackType: string, details?: string) => void;
  onDismiss: () => void;
}

export default function FeedbackPanel({ onSubmit, onDismiss }: FeedbackPanelProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [details, setDetails] = useState("");

  const handleOptionClick = (id: string) => {
    if (id === "perfect") {
      onSubmit("perfect");
      return;
    }
    setSelectedOption(id);
  };

  return (
    <div
      className="rounded-xl p-4 animate-fadeIn"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold" style={{ color: "var(--text)" }}>How does it look?</h3>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {!selectedOption ? (
        <div className="grid grid-cols-2 gap-2">
          {FEEDBACK_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  color: option.accent,
                  background: `${option.accent}10`,
                  border: `1px solid ${option.accent}30`,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {selectedOption === "adjust" && "What would you like to adjust?"}
            {selectedOption === "improve" && "What should be improved?"}
            {selectedOption === "redo" && "Describe the new direction:"}
            {selectedOption === "save" && "Which components to save?"}
          </p>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Be specific..."
            rows={3}
            className="w-full rounded-lg text-xs px-3 py-2 resize-none outline-none"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }} title="Attach image">
              <Image className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setSelectedOption(null)}
              className="px-3 py-1.5 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(selectedOption, details)}
              disabled={!details.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: details.trim() ? "var(--text)" : "var(--bg-tertiary)",
                color: details.trim() ? "var(--bg)" : "var(--text-muted)",
                cursor: details.trim() ? "pointer" : "not-allowed",
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
