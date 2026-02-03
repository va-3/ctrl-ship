/**
 * Tests for Stage 5: Quality Validation
 *
 * These tests run WITHOUT LLM calls — they test the automated HTML analysis.
 */

import { validateHTML, autoFixHTML } from '../stage5-quality';
import type { DesignSystem } from '../types';

// ─── Test Data ───────────────────────────────────────────────────────────────

const MINIMAL_VALID_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400&display=swap" rel="stylesheet">
  <style>
    html { scroll-behavior: smooth; }
    :root {
      --bg: #0a1628;
      --primary: #06b6d4;
    }
    .card:hover { transform: translateY(-4px); }
    @keyframes fadeInUp { from { opacity: 0.85; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header><nav>Navigation</nav></header>
  <main>
    <section id="hero"><h1>Hero Section</h1></section>
    <section id="features"><h2>Features</h2></section>
    <section id="about"><h2>About</h2></section>
    <section id="testimonials"><h2>Testimonials</h2></section>
    <section id="cta"><h2>Call to Action</h2></section>
  </main>
  <footer>Footer content</footer>
  <script>
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.15 });
  </script>
</body>
</html>`;

const BROKEN_HTML = `<div>
  <h1>No doctype, no meta, no structure</h1>
  <img src="test.jpg">
</div>`;

const GOOD_HTML_WITH_DESIGN_SYSTEM = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NeuraPulse - AI Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400&display=swap" rel="stylesheet">
  <style>
    html { scroll-behavior: smooth; }
    :root { --bg: #0a1628; --primary: #06b6d4; }
    body { background: var(--bg); color: #f8fafc; font-family: 'Inter', sans-serif; }
    h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); transition: all 0.3s ease; }
    .reveal { transform: translateY(12px); opacity: 0.85; transition: all 0.6s ease; }
    .reveal.active { transform: translateY(0); opacity: 1; }
    @keyframes fadeInUp { from { opacity: 0.85; } to { opacity: 1; } }
    @media (max-width: 768px) { .grid-cols-3 { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header><nav class="sticky top-0 z-50 backdrop-blur">Nav</nav></header>
  <main>
    <section id="hero" style="min-height:95vh"><h1 style="font-size:clamp(3.5rem,8vw,6rem)">AI That Thinks Ahead</h1></section>
    <section id="social-proof"><p>Trusted by 500+ companies</p></section>
    <section id="features">
      <div class="card"><img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80" alt="Feature 1"></div>
      <div class="card"><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80" alt="Feature 2"></div>
    </section>
    <section id="showcase"><h2>How It Works</h2></section>
    <section id="stats"><h2>By The Numbers</h2></section>
    <section id="testimonials"><h2>What Customers Say</h2></section>
    <section id="cta"><h2>Ready to Start?</h2></section>
  </main>
  <footer>© 2026 NeuraPulse</footer>
  <script>
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  </script>
</body>
</html>`;

const MOCK_DESIGN_SYSTEM: DesignSystem = {
  colors: {
    background: '#0a1628',
    foreground: '#f8fafc',
    card: '#111d35',
    cardForeground: '#f8fafc',
    primary: '#06b6d4',
    primaryGlow: 'rgba(6, 182, 212, 0.15)',
    secondary: '#8b5cf6',
    accent: '#22d3ee',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    border: 'rgba(255,255,255,0.08)',
    destructive: '#ef4444',
  },
  fonts: {
    display: 'Space Grotesk',
    body: 'Inter',
    mono: 'JetBrains Mono',
    googleImportUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400&display=swap',
  },
  typography: {
    heroSize: 'clamp(3.5rem, 8vw, 6rem)',
    heroWeight: '700',
    heroLetterSpacing: '-0.03em',
    headingSize: 'clamp(2rem, 4vw, 3.5rem)',
    bodySize: '1.125rem',
    bodyLineHeight: '1.75',
  },
  spacing: {
    sectionPadding: 'clamp(4rem, 8vw, 8rem) clamp(1rem, 5vw, 4rem)',
    cardPadding: '2rem',
    gap: '1.5rem',
  },
  effects: {
    borderRadius: '1rem',
    cardShadow: '0 4px 24px rgba(0,0,0,0.3)',
    glassBg: 'rgba(17, 29, 53, 0.7)',
    glassBackdrop: 'blur(20px)',
    gradientPrimary: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
    hoverTransition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  animations: {
    fadeInUp: 'fadeInUp 0.6s ease-out',
    staggerDelay: '0.1s',
    scrollReveal: true,
    hoverScale: '1.02',
    hoverLift: '-4px',
  },
  layoutPattern: 'dark_bento_cards',
  cssFramework: 'tailwind_cdn',
  iconLibrary: 'lucide',
  imageStrategy: 'unsplash',
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Stage 5: Quality Validation', () => {
  describe('validateHTML', () => {
    test('scores a well-structured page highly', () => {
      const report = validateHTML(MINIMAL_VALID_HTML);
      expect(report.score).toBeGreaterThanOrEqual(80);
      expect(report.passed).toBe(true);
      expect(report.metrics.hasMetaViewport).toBe(true);
      expect(report.metrics.hasSmoothScroll).toBe(true);
      expect(report.metrics.hasAnimations).toBe(true);
      expect(report.metrics.hasHoverStates).toBe(true);
      expect(report.metrics.sectionCount).toBeGreaterThanOrEqual(5);
    });

    test('flags critical issues in broken HTML', () => {
      const report = validateHTML(BROKEN_HTML);
      expect(report.score).toBeLessThan(60);
      expect(report.passed).toBe(false);

      const criticalIssues = report.issues.filter((i) => i.severity === 'critical');
      expect(criticalIssues.length).toBeGreaterThan(0);

      // Should flag missing DOCTYPE
      expect(report.issues.some((i) => i.message.includes('DOCTYPE'))).toBe(true);
      // Should flag missing viewport
      expect(report.issues.some((i) => i.message.includes('viewport'))).toBe(true);
    });

    test('detects missing alt text on images', () => {
      const htmlWithBadImages = MINIMAL_VALID_HTML.replace(
        '</main>',
        '<img src="test.jpg"><img src="test2.jpg"></main>'
      );
      const report = validateHTML(htmlWithBadImages);
      expect(report.issues.some((i) => i.message.includes('alt text'))).toBe(true);
    });

    test('detects Tailwind default colors when design system is provided', () => {
      const htmlWithDefaults = MINIMAL_VALID_HTML.replace(
        '</main>',
        '<div class="bg-blue-500 text-indigo-300">Bad colors</div></main>'
      );
      const report = validateHTML(htmlWithDefaults, MOCK_DESIGN_SYSTEM);
      expect(report.issues.some((i) => i.message.includes('Tailwind default color'))).toBe(true);
    });

    test('validates design system font usage', () => {
      const report = validateHTML(GOOD_HTML_WITH_DESIGN_SYSTEM, MOCK_DESIGN_SYSTEM);
      // Should NOT flag missing fonts since Space Grotesk is in the HTML
      expect(
        report.issues.some(
          (i) => i.category === 'typography' && i.message.includes('Space Grotesk')
        )
      ).toBe(false);
    });

    test('counts sections correctly', () => {
      const report = validateHTML(GOOD_HTML_WITH_DESIGN_SYSTEM);
      expect(report.metrics.sectionCount).toBe(7);
    });

    test('detects placeholder images', () => {
      const htmlWithPlaceholders = MINIMAL_VALID_HTML.replace(
        '</main>',
        '<img src="https://placehold.co/400x300" alt="test"></main>'
      );
      const report = validateHTML(htmlWithPlaceholders);
      expect(report.issues.some((i) => i.message.includes('Placeholder image'))).toBe(true);
    });

    test('reports correct metrics', () => {
      const report = validateHTML(GOOD_HTML_WITH_DESIGN_SYSTEM, MOCK_DESIGN_SYSTEM);
      expect(report.metrics.htmlSize).toBeGreaterThan(0);
      expect(report.metrics.hasResponsiveDesign).toBe(true);
      expect(report.metrics.hasAnimations).toBe(true);
      expect(report.metrics.imageCount).toBe(2);
    });
  });

  describe('autoFixHTML', () => {
    test('adds missing DOCTYPE', () => {
      const fixed = autoFixHTML('<html><head></head><body>hi</body></html>');
      expect(fixed).toContain('<!DOCTYPE html>');
    });

    test('adds missing viewport meta', () => {
      const fixed = autoFixHTML('<!DOCTYPE html><html><head></head><body>hi</body></html>');
      expect(fixed).toContain('viewport');
    });

    test('adds missing charset', () => {
      const fixed = autoFixHTML('<!DOCTYPE html><html><head></head><body>hi</body></html>');
      expect(fixed).toContain('charset');
    });

    test('adds missing smooth scroll', () => {
      const fixed = autoFixHTML('<!DOCTYPE html><html><head><style></style></head><body>hi</body></html>');
      expect(fixed).toContain('scroll-behavior');
    });

    test('does not duplicate existing fixes', () => {
      const alreadyGood = MINIMAL_VALID_HTML;
      const fixed = autoFixHTML(alreadyGood);
      // Should only have one viewport meta
      const viewportCount = (fixed.match(/viewport/g) || []).length;
      expect(viewportCount).toBe(1);
    });
  });
});
