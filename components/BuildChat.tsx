"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ArrowUp, Hammer, Lightbulb } from "lucide-react";
import ChatMessage from "./ChatMessage";

type Mode = "build" | "plan";

export interface MessageMetadata {
  type?: "generation";
  tier?: string;
  qualityScore?: number;
  totalDurationMs?: number;
  stagesSummary?: string;
  intentResult?: {
    siteType: string;
    mood: string;
    confidence: number;
    businessName: string;
  };
  designSystem?: {
    primary: string;
    background: string;
    displayFont: string;
    bodyFont: string;
  };
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "agent";
  agentName?: string;
  agentEmoji?: string;
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

interface BuildChatProps {
  messages: Message[];
  onSend: (message: string, mode: Mode) => void;
  isGenerating: boolean;
}

export default function BuildChat({ messages, onSend, isGenerating }: BuildChatProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("build");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSend(input.trim(), mode);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
          Chat
        </span>
        {/* Build/Plan Toggle */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "var(--bg-secondary)" }}>
          <button
            onClick={() => setMode("build")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
            style={{
              background: mode === "build" ? "var(--bg-hover)" : "transparent",
              color: mode === "build" ? "var(--text)" : "var(--text-muted)",
            }}
          >
            <Hammer className="w-3 h-3" />
            Build
          </button>
          <button
            onClick={() => setMode("plan")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
            style={{
              background: mode === "plan" ? "var(--accent-light)" : "transparent",
              color: mode === "plan" ? "var(--accent-text)" : "var(--text-muted)",
            }}
          >
            <Lightbulb className="w-3 h-3" />
            Plan
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Start a conversation
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              {mode === "build" ? "Describe changes to implement" : "Brainstorm ideas"}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            agentName={msg.agentName}
            agentEmoji={msg.agentEmoji}
            content={msg.content}
            timestamp={msg.timestamp}
            metadata={msg.metadata}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === "build" ? "What do you want to build?" : "Ask to brainstorm..."}
            rows={1}
            disabled={isGenerating}
            className="w-full bg-transparent text-xs px-3 pt-3 pb-1.5 resize-none outline-none min-h-[36px]"
            style={{ color: "var(--text)" }}
          />
          <div className="flex items-center justify-end px-2 pb-2">
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="p-1.5 rounded-lg transition-all"
              style={{
                background: input.trim() && !isGenerating ? "var(--text)" : "var(--bg-tertiary)",
                color: input.trim() && !isGenerating ? "var(--bg)" : "var(--text-muted)",
                cursor: input.trim() && !isGenerating ? "pointer" : "not-allowed",
              }}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
