"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Check, ChevronRight, MessageCircle } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface ClarifyingQuestionsProps {
  questions: Question[];
  summary: string;
  onComplete: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

export default function ClarifyingQuestions({
  questions,
  summary,
  onComplete,
  onSkip,
}: ClarifyingQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleAnswer = (answer: string) => {
    if (isAnimating) return;

    const newAnswers = { ...answers, [current.id]: answer };
    setAnswers(newAnswers);
    setCustomInput("");

    if (isLast) {
      setTimeout(() => onComplete(newAnswers), 300);
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    handleAnswer(customInput.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomSubmit();
    }
  };

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Previous answers */}
      {Object.keys(answers).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {questions
            .filter((q) => answers[q.id])
            .map((q) => (
              <div
                key={q.id}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
                style={{
                  background: "var(--accent-light, rgba(139,92,246,0.08))",
                  color: "var(--accent, #8b5cf6)",
                }}
              >
                <Check className="w-2.5 h-2.5" />
                <span className="truncate max-w-[120px]">{answers[q.id]}</span>
              </div>
            ))}
        </div>
      )}

      {/* Current question */}
      <div
        className="rounded-xl p-3.5 transition-all duration-200"
        style={{
          background: "var(--bg-secondary, #f5f5f5)",
          border: "1px solid var(--border, rgba(0,0,0,0.08))",
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? "translateY(4px)" : "translateY(0)",
        }}
      >
        {/* Question counter */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-3 h-3" style={{ color: "var(--accent, #8b5cf6)" }} />
            <span className="text-[10px] font-medium" style={{ color: "var(--text-muted, #888)" }}>
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  background:
                    i < currentIndex
                      ? "var(--accent, #8b5cf6)"
                      : i === currentIndex
                      ? "var(--text, #333)"
                      : "var(--border, rgba(0,0,0,0.15))",
                }}
              />
            ))}
          </div>
        </div>

        {/* Question text */}
        <p
          className="text-sm font-medium mb-3 leading-snug"
          style={{ color: "var(--text, #111)" }}
        >
          {current?.question}
        </p>

        {/* Option pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {current?.options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--bg, #fff)",
                color: "var(--text, #111)",
                border: "1px solid var(--border, rgba(0,0,0,0.1))",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              {option}
            </button>
          ))}
        </div>

        {/* "or type something else" input */}
        <div
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
          style={{
            background: "var(--bg, #fff)",
            border: "1px solid var(--border, rgba(0,0,0,0.08))",
          }}
        >
          <input
            ref={inputRef}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="or type something else..."
            className="flex-1 bg-transparent text-xs outline-none min-w-0"
            style={{ color: "var(--text, #111)" }}
          />
          {customInput.trim() && (
            <button
              onClick={handleCustomSubmit}
              className="p-1 rounded-md transition-colors shrink-0"
              style={{ color: "var(--accent, #8b5cf6)" }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="w-full text-center text-[11px] py-1 transition-colors hover:opacity-70"
        style={{ color: "var(--text-faint, #999)" }}
      >
        Skip — start building now →
      </button>
    </div>
  );
}
