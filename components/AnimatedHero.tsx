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
 * CyclingWord — uses CSS keyframe animations + dynamic width.
 * 
 * The container width animates to match each word, so the trailing "it."
 * flows naturally next to short words ("Ship it.") and long words
 * ("Personalize it.") instead of staying fixed in one spot.
 */
function CyclingWord({ words, interval }: { words: string[]; interval: number }) {
  const [current, setCurrent] = useState({ word: words[0], key: 0 });
  const [exiting, setExiting] = useState<{ word: string; key: number } | null>(null);
  const usedIndices = useRef<Set<number>>(new Set([0]));
  const currentIndexRef = useRef(0);
  const keyRef = useRef(0);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);

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

  // Measure width whenever current word changes
  useEffect(() => {
    if (measureRef.current) {
      setWidth(measureRef.current.offsetWidth);
    }
  }, [current.word]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIdx = pickNext();
      keyRef.current += 1;

      setExiting({ word: words[currentIndexRef.current], key: keyRef.current - 1 });
      setCurrent({ word: words[nextIdx], key: keyRef.current });
      currentIndexRef.current = nextIdx;
    }, interval);

    return () => clearInterval(timer);
  }, [interval, words, pickNext]);

  return (
    <span
      className="relative inline-flex items-center overflow-hidden"
      style={{
        width: width ? `${width}px` : "auto",
        transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Hidden measurer — rendered offscreen to get true pixel width */}
      <span
        ref={measureRef}
        className="invisible absolute whitespace-nowrap font-semibold"
        aria-hidden="true"
      >
        {current.word}
      </span>

      {/* Invisible spacer for height only (use shortest word) */}
      <span className="invisible font-semibold whitespace-nowrap">W</span>

      {/* Exiting word — slides up and fades out */}
      {exiting && (
        <span
          key={`exit-${exiting.key}`}
          className="absolute inset-0 flex items-center justify-center cycling-exit"
          onAnimationEnd={() => setExiting(null)}
        >
          <span className="font-semibold whitespace-nowrap">{exiting.word}</span>
        </span>
      )}

      {/* Current word — slides up from below */}
      <span
        key={`enter-${current.key}`}
        className="absolute inset-0 flex items-center justify-center cycling-enter"
      >
        <span className="font-semibold whitespace-nowrap">{current.word}</span>
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
