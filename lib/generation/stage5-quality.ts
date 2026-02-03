/**
 * Stage 5: Quality Validation & Polish
 *
 * Automated HTML analysis — no LLM needed for most checks.
 * Optional LLM review pass for "best" tier.
 *
 * Fast (~100ms for automated, ~30s for LLM review)
 */

import type { QualityReport, QualityIssue, DesignSystem, GatewayMessage } from './types';
import { GatewayClient, extractHTML } from './gateway';

/**
 * Run automated quality checks on generated HTML
 */
export function validateHTML(html: string, designSystem?: DesignSystem): QualityReport {
  const issues: QualityIssue[] = [];

  // ── Structure checks ──────────────────────────────────────────────────────
  if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
    issues.push({
      severity: 'critical',
      category: 'structure',
      message: 'Missing <!DOCTYPE html> declaration',
      autoFixable: true,
    });
  }

  if (!html.includes('<meta') || !html.includes('viewport')) {
    issues.push({
      severity: 'critical',
      category: 'responsive',
      message: 'Missing <meta name="viewport"> tag',
      autoFixable: true,
    });
  }

  if (!html.includes('<meta') || !html.includes('charset')) {
    issues.push({
      severity: 'warning',
      category: 'structure',
      message: 'Missing charset meta tag',
      autoFixable: true,
    });
  }

  if (!html.includes('<title>') && !html.includes('<title ')) {
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: 'Missing <title> tag',
      autoFixable: true,
    });
  }

  // ── Responsive checks ─────────────────────────────────────────────────────
  const hasMediaQueries = html.includes('@media');
  const hasClamp = html.includes('clamp(');
  const hasTailwind = html.includes('tailwindcss') || html.includes('cdn.tailwindcss');

  if (!hasMediaQueries && !hasTailwind) {
    issues.push({
      severity: 'warning',
      category: 'responsive',
      message: 'No media queries or Tailwind detected — may not be responsive',
      autoFixable: false,
    });
  }

  // ── Typography checks ─────────────────────────────────────────────────────
  const fontImportMatch = html.match(/fonts\.googleapis\.com/g);
  const fontCount = fontImportMatch ? 1 : 0; // Count link tags, not individual fonts

  if (!html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com')) {
    issues.push({
      severity: 'info',
      category: 'typography',
      message: 'No Google Fonts imported — using system fonts only',
      autoFixable: false,
    });
  }

  if (designSystem?.fonts?.display && !html.includes(designSystem.fonts.display)) {
    issues.push({
      severity: 'warning',
      category: 'typography',
      message: `Design system display font "${designSystem.fonts.display}" not found in HTML`,
      autoFixable: false,
    });
  }

  // ── Color checks ──────────────────────────────────────────────────────────
  if (designSystem?.colors?.primary) {
    const primaryColor = designSystem.colors.primary.toLowerCase();
    if (!html.toLowerCase().includes(primaryColor) && !html.includes('var(--primary)')) {
      issues.push({
        severity: 'warning',
        category: 'design_system',
        message: `Primary color ${primaryColor} not found in HTML`,
        autoFixable: false,
      });
    }
  }

  // Check for Tailwind default colors being used instead of design system
  const tailwindDefaults = ['bg-blue-', 'bg-indigo-', 'text-blue-', 'text-indigo-', 'bg-gray-'];
  const usesTailwindDefaults = tailwindDefaults.some((cls) => html.includes(cls));
  if (usesTailwindDefaults && designSystem) {
    issues.push({
      severity: 'warning',
      category: 'design_system',
      message: 'Using Tailwind default color classes instead of design system custom properties',
      autoFixable: false,
    });
  }

  // ── Image checks ──────────────────────────────────────────────────────────
  const imgRegex = /<img[^>]*>/gi;
  const imgs = html.match(imgRegex) || [];
  const imageCount = imgs.length;

  let missingAlt = 0;
  for (const img of imgs) {
    if (!img.includes('alt=') && !img.includes('alt =')) {
      missingAlt++;
    }
  }
  if (missingAlt > 0) {
    issues.push({
      severity: 'warning',
      category: 'accessibility',
      message: `${missingAlt} image(s) missing alt text`,
      autoFixable: false,
    });
  }

  // Check for placeholder images
  if (html.includes('placehold.co') || html.includes('placeholder.com') || html.includes('via.placeholder')) {
    issues.push({
      severity: 'info',
      category: 'content',
      message: 'Placeholder image service detected — replace with real images',
      autoFixable: false,
    });
  }

  // ── Animation checks ──────────────────────────────────────────────────────
  const hasKeyframes = html.includes('@keyframes');
  const hasIntersectionObserver = html.includes('IntersectionObserver');
  const hasTransitions = html.includes('transition');
  const hasAnimations = hasKeyframes || hasIntersectionObserver || hasTransitions;

  if (!hasAnimations) {
    issues.push({
      severity: 'info',
      category: 'polish',
      message: 'No animations or transitions detected',
      autoFixable: false,
    });
  }

  // Check for dangerous opacity:0 default (hides content without JS)
  const opacityZeroDefault = html.match(/(?<!\.active[^{]*){[^}]*opacity\s*:\s*0\s*[;}]/g);
  if (opacityZeroDefault && opacityZeroDefault.length > 2) {
    issues.push({
      severity: 'warning',
      category: 'accessibility',
      message: 'Multiple elements default to opacity:0 — content may be hidden without JavaScript',
      autoFixable: false,
    });
  }

  // ── Interaction checks ────────────────────────────────────────────────────
  const hasHover = html.includes(':hover') || html.includes('hover:');
  if (!hasHover) {
    issues.push({
      severity: 'warning',
      category: 'interactivity',
      message: 'No hover states detected on any element',
      autoFixable: false,
    });
  }

  // ── Smooth scroll ─────────────────────────────────────────────────────────
  const hasSmoothScroll = html.includes('scroll-behavior') && html.includes('smooth');

  if (!hasSmoothScroll) {
    issues.push({
      severity: 'info',
      category: 'ux',
      message: 'Missing smooth scroll behavior',
      autoFixable: true,
    });
  }

  // ── Section count ─────────────────────────────────────────────────────────
  const sectionMatches = html.match(/<section/gi);
  const sectionCount = sectionMatches ? sectionMatches.length : 0;

  if (sectionCount < 3) {
    issues.push({
      severity: 'warning',
      category: 'content',
      message: `Only ${sectionCount} sections found — expected at least 5 for a complete landing page`,
      autoFixable: false,
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  const hasNav = html.includes('<nav') || html.includes('<header');
  if (!hasNav) {
    issues.push({
      severity: 'warning',
      category: 'structure',
      message: 'No navigation/header element found',
      autoFixable: false,
    });
  }

  const hasFooter = html.includes('<footer');
  if (!hasFooter) {
    issues.push({
      severity: 'info',
      category: 'structure',
      message: 'No footer element found',
      autoFixable: false,
    });
  }

  // ── Icon library ──────────────────────────────────────────────────────────
  if (html.includes('data-lucide') && !html.includes('lucide')) {
    issues.push({
      severity: 'warning',
      category: 'dependencies',
      message: 'Lucide icon attributes found but library not loaded',
      autoFixable: true,
    });
  }

  // ── Scoring ───────────────────────────────────────────────────────────────
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;
  const score = Math.max(0, 100 - criticalCount * 25 - warningCount * 8 - infoCount * 2);

  return {
    passed: criticalCount === 0 && warningCount <= 2,
    score,
    issues,
    metrics: {
      htmlSize: html.length,
      sectionCount,
      hasResponsiveDesign: hasMediaQueries || hasTailwind || hasClamp,
      hasAnimations,
      hasHoverStates: hasHover,
      hasSmoothScroll,
      hasMetaViewport: html.includes('viewport'),
      fontCount,
      imageCount,
    },
  };
}

/**
 * Auto-fix common issues in the HTML
 */
export function autoFixHTML(html: string): string {
  let fixed = html;

  // Fix missing DOCTYPE
  if (!fixed.includes('<!DOCTYPE html>') && !fixed.includes('<!doctype html>')) {
    fixed = '<!DOCTYPE html>\n' + fixed;
  }

  // Fix missing viewport meta
  if (!fixed.includes('viewport')) {
    fixed = fixed.replace(
      '<head>',
      '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
    );
  }

  // Fix missing charset
  if (!fixed.includes('charset')) {
    fixed = fixed.replace('<head>', '<head>\n  <meta charset="UTF-8">');
  }

  // Fix missing smooth scroll
  if (!fixed.includes('scroll-behavior')) {
    if (fixed.includes('<style>')) {
      fixed = fixed.replace('<style>', '<style>\n  html { scroll-behavior: smooth; }');
    } else {
      fixed = fixed.replace(
        '</head>',
        '  <style>html { scroll-behavior: smooth; }</style>\n</head>'
      );
    }
  }

  return fixed;
}

/**
 * LLM-powered quality review pass (for "best" tier only)
 */
export async function llmReviewPass(
  html: string,
  designSystem: DesignSystem,
  qualityReport: QualityReport,
  gateway: GatewayClient
): Promise<string> {
  const issuesList = qualityReport.issues
    .filter((i) => i.severity !== 'info')
    .map((i) => `- [${i.severity}] ${i.category}: ${i.message}`)
    .join('\n');

  const prompt = `Review and fix this HTML page. The automated quality check found these issues:

${issuesList || 'No major issues found.'}

Quality score: ${qualityReport.score}/100

Design system reference:
- Primary color: ${designSystem.colors.primary}
- Background: ${designSystem.colors.background}
- Display font: ${designSystem.fonts.display}
- Body font: ${designSystem.fonts.body}

RULES:
1. Fix ALL listed issues
2. Ensure ALL colors use the design system (no Tailwind defaults)
3. Ensure ALL interactive elements have hover states
4. Ensure hero headline is large (${designSystem.typography.heroSize})
5. Ensure content is visible without JS (no opacity:0 defaults)
6. Output the COMPLETE fixed HTML — no explanation, no markdown
7. If the page is already good (score > 90 and no critical/warning issues), output it unchanged

Start with <!DOCTYPE html>.`;

  const messages: GatewayMessage[] = [
    { role: 'system', content: prompt },
    { role: 'user', content: html },
  ];

  const raw = await gateway.call(messages, {
    maxTokens: 16000,
    temperature: 0.3,
  });

  return extractHTML(raw);
}
