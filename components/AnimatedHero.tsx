"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const LINE1_WORDS = [
  "Ship", "Launch", "Deploy", "Scale", "Build",
  "Publish", "Release", "Deliver", "Push", "Execute",
  "Accelerate", "Automate", "Streamline", "Transform", "Elevate",
  "Architect", "Engineer", "Optimize", "Innovate", "Realize",
];

const LINE2_WORDS = [
  "Design", "Create", "Prototype", "Craft", "Iterate",
  "Imagine", "Compose", "Style", "Polish", "Refine",
  "Visualize", "Customize", "Personalize", "Inspire", "Express",
  "Sketch", "Render", "Illustrate", "Curate", "Perfect",
];

/**
 * CyclingWord — uses CSS keyframe animations to avoid the double-take glitch.
 * 
 * Instead of toggling `isTransitioning` state (which causes a flash when
 * React batches the displayWord update with the transition reset), we use
 * a `key`-based approach: each new word gets a fresh element with a CSS
 * enter animation. The old word gets an exit animation via onAnimationEnd.
 */
function CyclingWord({ words, interval }: { words: string[]; interval: number }) {
  const [current, setCurrent] = useState({ word: words[0], key: 0 });
  const [exiting, setExiting] = useState<{ word: string; key: number } | null>(null);
  const usedIndices = useRef<Set<number>>(new Set([0]));
  const currentIndexRef = useRef(0);
  const keyRef = useRef(0);

  const widestWord = words.reduce((a, b) => (a.length > b.length ? a : b), "");

  const pickNext = useCallback(() => {
    if (usedIndices.current.size >= words.length - 1) {
      usedIndices.current.clear();
      usedIndices.current.add(currentIndexRef.current);
    }
    let next: number;
    do {
      next = Math.floor(Math.random() * words.length);
    } while (next === currentIndexRef.current || usedIndices.current.has(next));
    usedIndices.current.add(next);
    return next;
  }, [words]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIdx = pickNext();
      keyRef.current += 1;

      // Move current to exiting slot
      setExiting({ word: words[currentIndexRef.current], key: keyRef.current - 1 });
      // Set new current
      setCurrent({ word: words[nextIdx], key: keyRef.current });
      currentIndexRef.current = nextIdx;
    }, interval);

    return () => clearInterval(timer);
  }, [interval, words, pickNext]);

  return (
    <span
      className="relative inline-flex items-center overflow-hidden"
      style={{ minWidth: `${widestWord.length * 0.62}em` }}
    >
      {/* Invisible spacer for stable width */}
      <span className="invisible font-semibold">{widestWord}</span>

      {/* Exiting word — slides up and fades out */}
      {exiting && (
        <span
          key={`exit-${exiting.key}`}
          className="absolute inset-0 flex items-center justify-end cycling-exit"
          onAnimationEnd={() => setExiting(null)}
        >
          <span className="font-semibold">{exiting.word}</span>
        </span>
      )}

      {/* Current word — slides up from below */}
      <span
        key={`enter-${current.key}`}
        className="absolute inset-0 flex items-center justify-end cycling-enter"
      >
        <span className="font-semibold">{current.word}</span>
      </span>
    </span>
  );
}

export default function AnimatedHero() {
  return (
    <div className="text-center">
      <h1
        className="text-2xl md:text-3xl font-semibold tracking-tight flex flex-col items-center justify-center gap-0.5"
        style={{ color: "var(--text)" }}
      >
        <span className="inline-flex items-center gap-[0.35em]">
          <CyclingWord words={LINE1_WORDS} interval={2800} />
          <span style={{ color: "var(--text-muted)" }}>it.</span>
        </span>
        <span className="inline-flex items-center gap-[0.35em]">
          <CyclingWord words={LINE2_WORDS} interval={3400} />
          <span style={{ color: "var(--text-muted)" }}>it.</span>
        </span>
      </h1>
      <p
        className="text-sm mt-3 max-w-sm mx-auto leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        Explore freely, iterate fast. Your product, AI-powered.
      </p>

      {/* CSS keyframe animations — no state-driven transitions = no double-take */}
      <style jsx global>{`
        @keyframes cyclingEnter {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes cyclingExit {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        .cycling-enter {
          animation: cyclingEnter 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .cycling-exit {
          animation: cyclingExit 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}
