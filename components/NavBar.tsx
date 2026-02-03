"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, BookTemplate } from "lucide-react";
import ProfileMenu from "./ProfileMenu";

// Arrow directions for the Easter egg: right → down → left → up → cycle
const ARROW_ROTATIONS = [0, 90, 180, 270] as const;

const NAV_TABS = [
  { href: "/", label: "Home", mobileLabel: "Home", icon: Home },
  { href: "/monitor", label: "Dashboard", mobileLabel: "Dash", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", mobileLabel: "Explore", icon: BookTemplate },
];

export default function NavBar() {
  const pathname = usePathname();
  const [arrowIndex, setArrowIndex] = useState(0);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="sticky top-0 z-50 h-[48px] sm:h-[52px] backdrop-blur-xl flex items-center px-3 sm:px-5"
      style={{
        background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Left: Logo — flex-1 to balance with right side */}
      <Link href="/" className="flex-1 flex items-center gap-2 group" onClick={(e) => {
        e.preventDefault();
        setArrowIndex((prev) => (prev + 1) % ARROW_ROTATIONS.length);
      }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          fill="none"
          width={22}
          height={22}
          className="sm:w-6 sm:h-6 group-hover:scale-110"
          style={{ transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <rect x="2" y="2" width="28" height="28" rx="7" stroke="url(#navgrad)" strokeWidth="2.5" fill="none"/>
          <path
            d="M12 10 L20 16 L12 22"
            stroke="url(#navgrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{
              transformOrigin: '16px 16px',
              transform: `rotate(${ARROW_ROTATIONS[arrowIndex]}deg)`,
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
          <defs>
            <linearGradient id="navgrad" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#7c3aed"/>
              <stop offset="100%" stopColor="#3b82f6"/>
            </linearGradient>
          </defs>
        </svg>
        <span
          className="font-bold text-[13px] tracking-tight hidden md:inline items-center"
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            color: "var(--text)",
          }}
        >
          CTRL<span style={{ color: "var(--accent)", verticalAlign: "middle" }}>+</span>Ship
        </span>
      </Link>

      {/* Center: Tabs in pill container — shrink-0 keeps it truly centered */}
      <div
        className="shrink-0 flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-full"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-[5px] sm:py-[6px] rounded-full text-[11px] sm:text-[12px] font-medium transition-all duration-200"
              style={{
                color: active ? "var(--text)" : "var(--text-muted)",
                background: active ? "var(--bg)" : "transparent",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Icon className="w-3 h-3 sm:w-[14px] sm:h-[14px]" strokeWidth={active ? 2 : 1.5} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </Link>
          );
        })}
      </div>

      {/* Right: Profile — flex-1 to balance with left side */}
      <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
        <ProfileMenu />
      </div>
    </nav>
  );
}

// Single model — Sonnet only
const MODELS = [
  { id: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5", shortLabel: "Sonnet 4.5", icon: "🟣", color: "#a78bfa" },
];

export { MODELS };
export type ModelOption = (typeof MODELS)[number];
