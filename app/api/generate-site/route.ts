import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/generation/pipeline';
import type { QualityTier } from '@/lib/generation/types';

// Allow up to 5 minutes for pipeline execution
export const maxDuration = 300;

const SUPPORTED_MODELS = [
  'anthropic/claude-sonnet-4-5',
];

/**
 * POST /api/generate-site
 *
 * New 5-stage pipeline endpoint for website generation.
 *
 * Body:
 *   prompt: string      — what to build
 *   tier: string         — "fast" | "balanced" | "best" (default: "balanced")
 *   model?: string       — model override
 *
 * Response:
 *   html: string         — generated HTML
 *   designSystem: object — design system used
 *   contentPlan: object  — content plan (best tier only)
 *   intentResult: object — classified intent
 *   qualityReport: object— quality validation results
 *   stages: array        — timing/status of each pipeline stage
 *   totalDurationMs: int — total pipeline time
 *   model: string        — model used
 *   tier: string         — tier used
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, tier: rawTier, quality, model: requestedModel } = body;
    const tier = rawTier || quality || 'balanced'; // Accept both "tier" and "quality"

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'prompt is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Validate tier
    const validTiers: QualityTier[] = ['fast', 'balanced', 'best'];
    const selectedTier: QualityTier = validTiers.includes(tier as QualityTier)
      ? (tier as QualityTier)
      : 'balanced';

    // Validate model
    const model = SUPPORTED_MODELS.includes(requestedModel)
      ? requestedModel
      : 'anthropic/claude-sonnet-4-5';

    console.log(
      `[generate-site] Starting pipeline: tier=${selectedTier} model=${model} prompt="${prompt.substring(0, 80)}..."`
    );

    const result = await runPipeline({
      prompt: prompt.trim(),
      tier: selectedTier,
      model,
    });

    console.log(
      `[generate-site] Pipeline complete: ` +
        `tier=${result.tier} ` +
        `duration=${result.totalDurationMs}ms ` +
        `html=${result.html.length} chars ` +
        `quality=${result.qualityReport.score}/100 ` +
        `stages=${result.stages.map((s) => `${s.stage}:${s.status}(${s.durationMs}ms)`).join(', ')}`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[generate-site] Pipeline error:', error);
    return NextResponse.json(
      {
        error: 'Generation pipeline failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
