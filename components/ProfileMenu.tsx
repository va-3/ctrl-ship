"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Settings, LogOut, User, Diamond } from "lucide-react";
import { useCredits } from "@/lib/use-credits";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { credits, isOwner } = useCredits();
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const isDark = mounted && theme === "dark";

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:ring-2 hover:ring-[var(--border)]"
        style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
      >
        <User className="w-4 h-4" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* User Section */}
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Guest</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Sign in to save projects</p>
          </div>

          {/* Credits */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <Diamond className="w-4 h-4" style={{ color: "#10b981" }} strokeWidth={2} />
              <span className="text-sm font-medium" style={{ color: "var(--text)" }}>Credits</span>
            </div>
            <span className="text-sm font-semibold tabular-nums" style={{ color: "#10b981" }}>
              {isOwner ? "∞" : credits === Infinity ? "∞" : (credits as number).toLocaleString()}
            </span>
          </div>

          {/* Theme Toggle */}
          <div className="p-1.5">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDark ? "Light mode" : "Dark mode"}</span>
            </button>

            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>

          {/* Sign In */}
          <div className="p-1.5" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--accent-text)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign in</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
