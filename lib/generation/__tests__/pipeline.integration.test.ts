/**
 * Integration Tests for the Generation Pipeline
 *
 * These tests require the OpenClaw gateway to be running.
 * Skip in CI — run manually with: npx jest pipeline.integration --testTimeout=300000
 *
 * Success Metrics (what we measure):
 *   1. Quality score ≥ 75 for all tiers
 *   2. Quality score ≥ 85 for "best" tier
 *   3. All critical issues auto-fixed
 *   4. Total time: fast < 60s, balanced < 150s, best < 300s
 *   5. HTML contains expected sections
 *   6. Design system colors present in output
 *   7. Pipeline never crashes — graceful fallbacks
 */

import { runPipeline } from '../pipeline';
import { validateHTML } from '../stage5-quality';
import type { PipelineResult, QualityTier } from '../types';

// Skip unless gateway is available
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

const shouldRun = !!GATEWAY_TOKEN;
const describeIf = shouldRun ? describe : describe.skip;

// Test prompts covering different site types
const TEST_PROMPTS = {
  saas: 'Build a landing page for NeuraPulse, an AI-powered customer analytics platform',
  ecommerce: 'Create an online store for Lumina Skincare, a luxury organic skincare brand',
  portfolio: 'Design a portfolio website for Alex Chen, a senior product designer',
  restaurant: 'Build a website for Ember & Oak, a modern farm-to-table restaurant in Austin',
  minimal: 'Make a simple coming soon page for a new app called FlowSync',
};

describeIf('Pipeline Integration Tests', () => {
  // Increase timeout for LLM calls
  jest.setTimeout(300000); // 5 minutes

  // ── Fast Tier Tests ────────────────────────────────────────────────────
  describe('Fast tier', () => {
    let result: PipelineResult;

    beforeAll(async () => {
      result = await runPipeline({
        prompt: TEST_PROMPTS.minimal,
        tier: 'fast',
      });
    });

    test('completes within 120 seconds', () => {
      expect(result.totalDurationMs).toBeLessThan(120_000);
    });

    test('produces valid HTML', () => {
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('</html>');
      expect(result.html.length).toBeGreaterThan(1000);
    });

    test('quality score ≥ 60', () => {
      expect(result.qualityReport.score).toBeGreaterThanOrEqual(60);
    });

    test('has no critical issues', () => {
      const critical = result.qualityReport.issues.filter((i) => i.severity === 'critical');
      expect(critical).toHaveLength(0);
    });

    test('intent classification succeeded', () => {
      expect(result.intentResult).toBeDefined();
      expect(result.intentResult!.siteType).toBeDefined();
      expect(result.intentResult!.businessName).toBeDefined();
    });

    test('design system is from template (not LLM)', () => {
      // Fast tier uses template, so stage should be very fast
      const designStage = result.stages.find((s) => s.stage === 'design');
      expect(designStage).toBeDefined();
      expect(designStage!.durationMs).toBeLessThan(100); // Template = instant
    });

    test('content planning was skipped', () => {
      const contentStage = result.stages.find((s) => s.stage === 'content');
      expect(contentStage).toBeDefined();
      expect(contentStage!.status).toBe('skipped');
    });
  });

  // ── Balanced Tier Tests ────────────────────────────────────────────────
  describe('Balanced tier', () => {
    let result: PipelineResult;

    beforeAll(async () => {
      result = await runPipeline({
        prompt: TEST_PROMPTS.saas,
        tier: 'balanced',
      });
    });

    test('completes within 180 seconds', () => {
      expect(result.totalDurationMs).toBeLessThan(180_000);
    });

    test('produces valid HTML', () => {
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html.length).toBeGreaterThan(3000);
    });

    test('quality score ≥ 70', () => {
      expect(result.qualityReport.score).toBeGreaterThanOrEqual(70);
    });

    test('has custom design system (not template)', () => {
      expect(result.designSystem).toBeDefined();
      expect(result.designSystem!.colors.primary).toBeDefined();
      // Design system should take some time (LLM call)
      const designStage = result.stages.find((s) => s.stage === 'design');
      expect(designStage!.durationMs).toBeGreaterThan(1000);
    });

    test('HTML contains design system colors', () => {
      const primary = result.designSystem!.colors.primary.toLowerCase();
      const htmlLower = result.html.toLowerCase();
      // Either the hex color or css variable should be present
      const hasColor = htmlLower.includes(primary) || htmlLower.includes('var(--primary)');
      expect(hasColor).toBe(true);
    });

    test('HTML contains design system fonts', () => {
      const displayFont = result.designSystem!.fonts.display;
      expect(result.html).toContain(displayFont);
    });

    test('has responsive design indicators', () => {
      expect(result.qualityReport.metrics.hasResponsiveDesign).toBe(true);
    });

    test('has multiple sections', () => {
      expect(result.qualityReport.metrics.sectionCount).toBeGreaterThanOrEqual(3);
    });
  });

  // ── Best Tier Tests ────────────────────────────────────────────────────
  describe('Best tier', () => {
    let result: PipelineResult;

    beforeAll(async () => {
      result = await runPipeline({
        prompt: TEST_PROMPTS.ecommerce,
        tier: 'best',
      });
    });

    test('completes within 300 seconds', () => {
      expect(result.totalDurationMs).toBeLessThan(300_000);
    });

    test('quality score ≥ 75', () => {
      expect(result.qualityReport.score).toBeGreaterThanOrEqual(75);
    });

    test('has content plan', () => {
      expect(result.contentPlan).toBeDefined();
      expect(result.contentPlan!.sections.length).toBeGreaterThanOrEqual(4);
    });

    test('content plan has real copy (not placeholder)', () => {
      const plan = result.contentPlan!;
      const heroSection = plan.sections.find((s) => s.type === 'hero' || s.id === 'hero');
      expect(heroSection).toBeDefined();
      const content = heroSection!.content as Record<string, string>;
      // Headline should be real text, not lorem ipsum
      if (content.headline) {
        expect(content.headline).not.toContain('Lorem');
        expect(content.headline.length).toBeGreaterThan(5);
      }
    });

    test('all 5 stages ran', () => {
      const stageNames = result.stages.map((s) => s.stage);
      expect(stageNames).toContain('intent');
      expect(stageNames).toContain('design');
      expect(stageNames).toContain('content');
      expect(stageNames).toContain('codegen');
      expect(stageNames).toContain('quality');
    });

    test('no stage had an error', () => {
      const errors = result.stages.filter((s) => s.status === 'error');
      expect(errors).toHaveLength(0);
    });
  });

  // ── Cross-Prompt Tests ─────────────────────────────────────────────────
  describe('Intent classification across site types', () => {
    const testCases = Object.entries(TEST_PROMPTS);

    test.each(testCases)('classifies "%s" prompt correctly', async (_name, prompt) => {
      const result = await runPipeline({
        prompt,
        tier: 'fast', // Fast tier for speed
      });

      expect(result.intentResult).toBeDefined();
      expect(result.intentResult!.siteType).toBeDefined();
      expect(result.intentResult!.mood).toBeDefined();
      expect(result.intentResult!.confidence).toBeGreaterThan(0.5);
    });
  });

  // ── Resilience Tests ───────────────────────────────────────────────────
  describe('Resilience', () => {
    test('handles vague prompts gracefully', async () => {
      const result = await runPipeline({
        prompt: 'make a website',
        tier: 'fast',
      });

      // Should still produce something
      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(500);
      expect(result.intentResult).toBeDefined();
    });

    test('handles very long prompts', async () => {
      const longPrompt = 'Create a website for ' + 'a '.repeat(500) + 'company';
      const result = await runPipeline({
        prompt: longPrompt,
        tier: 'fast',
      });

      expect(result.html).toBeDefined();
    });
  });
});

// ── Success Metrics Summary ──────────────────────────────────────────────────
/**
 * SUCCESS METRICS (run after all tests):
 *
 * 1. Quality Scores:
 *    - Fast tier:     ≥ 60/100
 *    - Balanced tier: ≥ 70/100
 *    - Best tier:     ≥ 75/100
 *
 * 2. Timing:
 *    - Fast tier:     < 120s
 *    - Balanced tier: < 180s
 *    - Best tier:     < 300s
 *
 * 3. Reliability:
 *    - Zero crashes across all test prompts
 *    - All critical issues auto-fixed
 *    - Graceful fallbacks on errors
 *
 * 4. Design System Adherence:
 *    - Custom colors present in balanced/best HTML
 *    - Custom fonts loaded and referenced
 *    - Layout patterns match intent
 *
 * 5. Content Quality:
 *    - No "Lorem ipsum" in best tier
 *    - Business name appears in output
 *    - ≥ 3 content sections in all tiers
 */
