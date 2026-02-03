/**
 * CTRL+Ship Generation Pipeline — Main Orchestrator
 *
 * 5-stage pipeline:
 *   Stage 1: Intent Classification (~5s)
 *   Stage 2: Design System Generation (~15s)
 *   Stage 3: Content Planning (~15s)
 *   Stage 4: HTML Code Generation (~90s)
 *   Stage 5: Quality Validation (~0.1s automated, ~30s with LLM review)
 *
 * Quality tiers control which stages run:
 *   - fast:     Stage 1 + template design + Stage 4 + Stage 5 (auto only)  ~30-60s
 *   - balanced: Stage 1 + Stage 2 + Stage 4 + Stage 5 (auto only)         ~90-120s
 *   - best:     All 5 stages + LLM review pass                            ~3-4 min
 */

import type {
  PipelineInput,
  PipelineResult,
  PipelineStageResult,
  QualityTier,
  IntentResult,
  DesignSystem,
  ContentPlan,
  QualityReport,
} from './types';
import { GatewayClient, getGateway } from './gateway';
import { classifyIntent } from './stage1-intent';
import { generateDesignSystem, getTemplateDesignSystem } from './stage2-design';
import { generateContentPlan } from './stage3-content';
import { generateCode, generateCodeStream } from './stage4-codegen';
import { validateHTML, autoFixHTML, llmReviewPass } from './stage5-quality';

export interface PipelineCallbacks {
  onStageStart?: (stage: string, description: string) => void;
  onStageComplete?: (stage: string, result: PipelineStageResult) => void;
  onError?: (stage: string, error: Error) => void;
  /** 
   * Called with each text chunk during code generation (stage 4).
   * Enables live preview — `accumulated` is the full HTML so far.
   */
  onCodegenChunk?: (chunk: string, accumulated: string) => void;
}

export async function runPipeline(
  input: PipelineInput,
  callbacks?: PipelineCallbacks
): Promise<PipelineResult> {
  const startTime = Date.now();
  const stages: PipelineStageResult[] = [];
  const gateway = getGateway();
  const model = input.model || 'anthropic/claude-sonnet-4-5';

  let intentResult: IntentResult | undefined;
  let designSystem: DesignSystem | undefined;
  let contentPlan: ContentPlan | undefined;
  let html = '';
  let qualityReport: QualityReport;

  // ── Stage 1: Intent Classification ──────────────────────────────────────
  const stage1 = await runStage('intent', 'Analyzing your request...', async () => {
    return await classifyIntent(input.prompt, gateway);
  }, callbacks);
  stages.push(stage1.meta);

  if (stage1.meta.status === 'success') {
    intentResult = stage1.data as IntentResult;
  } else {
    // Fallback intent
    intentResult = {
      siteType: 'startup_landing',
      industry: 'technology',
      businessName: extractBusinessName(input.prompt),
      mood: 'dark_futuristic',
      suggestedSections: ['hero', 'features', 'testimonials', 'cta', 'footer'],
      requiredFeatures: ['responsive', 'animations'],
      contentHints: {
        hasLogo: false,
        hasCopy: false,
        hasImages: false,
        needsGenerated: ['headline', 'subheadline', 'features', 'cta'],
      },
      confidence: 0.3,
      clarifyingQuestions: null,
    };
  }

  // ── Stage 2 + 3: Design System & Content Planning ──────────────────────
  // For "best" tier: run design + content in PARALLEL (~15s saved)
  if (input.tier === 'fast') {
    // Fast tier: use template, skip LLM call
    const stage2Start = Date.now();
    callbacks?.onStageStart?.('design', 'Applying template design system...');
    designSystem = getTemplateDesignSystem(intentResult.mood);
    const stage2Meta: PipelineStageResult = {
      stage: 'design',
      status: 'success',
      durationMs: Date.now() - stage2Start,
      data: designSystem,
    };
    stages.push(stage2Meta);
    callbacks?.onStageComplete?.('design', stage2Meta);

    // Fast: skip content planning
    const stage3Meta: PipelineStageResult = {
      stage: 'content',
      status: 'skipped',
      durationMs: 0,
    };
    stages.push(stage3Meta);
  } else if (input.tier === 'best') {
    // Best tier: run design + content in parallel for speed
    callbacks?.onStageStart?.('design', 'Generating custom design system...');
    callbacks?.onStageStart?.('content', 'Planning content and structure...');

    const [stage2, stage3] = await Promise.all([
      runStage('design', 'Generating custom design system...', async () => {
        return await generateDesignSystem(input.prompt, intentResult!, gateway);
      }),
      runStage('content', 'Planning content and structure...', async () => {
        // Content stage uses a temporary template design system for context
        // (design result will constrain codegen, content just needs intent)
        return await generateContentPlan(input.prompt, intentResult!, getTemplateDesignSystem(intentResult!.mood), gateway);
      }),
    ]);

    stages.push(stage2.meta);
    callbacks?.onStageComplete?.('design', stage2.meta);

    if (stage2.meta.status === 'success') {
      designSystem = stage2.data as DesignSystem;
    } else {
      designSystem = getTemplateDesignSystem(intentResult.mood);
    }

    stages.push(stage3.meta);
    callbacks?.onStageComplete?.('content', stage3.meta);

    if (stage3.meta.status === 'success') {
      contentPlan = stage3.data as ContentPlan;
    }
  } else {
    // Balanced: generate custom design system, skip content
    const stage2 = await runStage('design', 'Generating custom design system...', async () => {
      return await generateDesignSystem(input.prompt, intentResult!, gateway);
    }, callbacks);
    stages.push(stage2.meta);

    if (stage2.meta.status === 'success') {
      designSystem = stage2.data as DesignSystem;
    } else {
      designSystem = getTemplateDesignSystem(intentResult.mood);
    }

    const stage3Meta: PipelineStageResult = {
      stage: 'content',
      status: 'skipped',
      durationMs: 0,
    };
    stages.push(stage3Meta);
  }

  // ── Stage 4: Code Generation ────────────────────────────────────────────
  // If no content plan (fast/balanced), generate a minimal one from intent
  if (!contentPlan) {
    contentPlan = buildMinimalContentPlan(intentResult);
  }
  
  // Thread intent's rich context into content plan metadata
  // so codegen has full context for generating personalized content and images
  if (intentResult) {
    const meta = contentPlan.metadata as Record<string, unknown>;
    if (intentResult.imageKeywords) meta.imageKeywords = intentResult.imageKeywords;
    if (intentResult.subjectDetails) meta.subjectDetails = intentResult.subjectDetails;
    if (intentResult.targetAudience) meta.targetAudience = intentResult.targetAudience;
    if (intentResult.primaryAction) meta.primaryAction = intentResult.primaryAction;
    if (intentResult.uniqueSellingPoints) meta.uniqueSellingPoints = intentResult.uniqueSellingPoints;
  }

  const stage4 = await runStage('codegen', 'Building your website...', async () => {
    // Use streaming codegen when the chunk callback is provided
    if (callbacks?.onCodegenChunk) {
      return await generateCodeStream(
        input.prompt, intentResult!, designSystem!, contentPlan!, gateway,
        callbacks.onCodegenChunk,
        model
      );
    }
    return await generateCode(input.prompt, intentResult!, designSystem!, contentPlan!, gateway, model);
  }, callbacks);
  stages.push(stage4.meta);

  if (stage4.meta.status === 'success' && stage4.data) {
    html = stage4.data as string;
  } else {
    // Return partial result with error info instead of crashing
    const failReport: QualityReport = {
      passed: false,
      score: 0,
      issues: [{
        severity: 'critical',
        category: 'generation',
        message: `Code generation failed: ${stage4.meta.error || 'Unknown error'}`,
        autoFixable: false,
      }],
      metrics: {
        htmlSize: 0, sectionCount: 0, hasResponsiveDesign: false,
        hasAnimations: false, hasHoverStates: false, hasSmoothScroll: false,
        hasMetaViewport: false, fontCount: 0, imageCount: 0,
      },
    };
    return {
      html: '',
      designSystem,
      contentPlan,
      intentResult,
      qualityReport: failReport,
      stages,
      totalDurationMs: Date.now() - startTime,
      model,
      tier: input.tier,
    };
  }

  // ── Stage 5: Quality Validation ─────────────────────────────────────────
  const stage5Start = Date.now();
  callbacks?.onStageStart?.('quality', 'Running quality checks...');

  // Auto-fix common issues
  html = autoFixHTML(html);

  // Run validation
  qualityReport = validateHTML(html, designSystem);

  // LLM review pass for "best" tier when score is below threshold
  // Threshold at 75 — sites scoring 75-85 are already good, saves ~$0.24 per generation
  if (input.tier === 'best' && qualityReport.score < 75) {
    callbacks?.onStageStart?.('quality', 'Running AI quality review...');
    try {
      const reviewedHtml = await llmReviewPass(html, designSystem!, qualityReport, gateway);
      if (reviewedHtml && reviewedHtml.length > html.length * 0.5) {
        html = reviewedHtml;
        // Re-validate after review
        qualityReport = validateHTML(html, designSystem);
      }
    } catch (err) {
      // LLM review is optional — don't fail the pipeline
      console.error('[Pipeline] LLM review pass failed:', err);
    }
  }

  const stage5Meta: PipelineStageResult = {
    stage: 'quality',
    status: qualityReport.passed ? 'success' : 'error',
    durationMs: Date.now() - stage5Start,
    data: qualityReport,
  };
  stages.push(stage5Meta);
  callbacks?.onStageComplete?.('quality', stage5Meta);

  return {
    html,
    designSystem,
    contentPlan,
    intentResult,
    qualityReport,
    stages,
    totalDurationMs: Date.now() - startTime,
    model,
    tier: input.tier,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function runStage<T>(
  name: string,
  description: string,
  fn: () => Promise<T>,
  callbacks?: PipelineCallbacks
): Promise<{ data: T | null; meta: PipelineStageResult }> {
  const start = Date.now();
  callbacks?.onStageStart?.(name, description);

  try {
    const data = await fn();
    const meta: PipelineStageResult = {
      stage: name,
      status: 'success',
      durationMs: Date.now() - start,
      data,
    };
    callbacks?.onStageComplete?.(name, meta);
    return { data, meta };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks?.onError?.(name, err);
    const meta: PipelineStageResult = {
      stage: name,
      status: 'error',
      durationMs: Date.now() - start,
      error: err.message,
    };
    callbacks?.onStageComplete?.(name, meta);
    return { data: null, meta };
  }
}

function extractBusinessName(prompt: string): string {
  // Try to extract a business name from quotes
  const quoted = prompt.match(/["']([^"']+)["']/);
  if (quoted) return quoted[1];

  // Try to extract "for X" or "called X"
  const forMatch = prompt.match(/(?:for|called|named)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/);
  if (forMatch) return forMatch[1];

  // Try to extract capitalized words (potential brand name)
  const caps = prompt.match(/\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b/);
  if (caps) return caps[1];

  return 'Company';
}

function buildMinimalContentPlan(intent: IntentResult): ContentPlan {
  const sections = intent.suggestedSections.map((section, i) => ({
    id: section,
    type: section,
    layout: getDefaultLayout(section),
    content: {},
    visualElements: [],
  }));

  return {
    sections,
    metadata: {
      totalSections: sections.length,
      estimatedScrollLength: `${sections.length - 1} viewports`,
      mobileLayout: 'single_column_stack',
      primaryCta: 'Get Started',
      secondaryCta: 'Learn More',
    },
  };
}

function getDefaultLayout(sectionType: string): string {
  const layoutMap: Record<string, string> = {
    hero: 'hero_centered',
    features: 'three_col_cards',
    social_proof: 'stats_bar',
    showcase: 'two_col_split',
    stats: 'stats_bar',
    testimonials: 'testimonial_cards',
    pricing: 'pricing_table',
    cta: 'cta_banner',
    footer: 'multi_col_footer',
    about: 'two_col_split',
    services: 'icon_grid',
    contact: 'two_col_split',
    faq: 'alternating_rows',
    team: 'three_col_cards',
    portfolio: 'bento_grid',
    blog: 'three_col_cards',
    how_it_works: 'alternating_rows',
  };
  return layoutMap[sectionType] || 'three_col_cards';
}
