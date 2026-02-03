import { NextRequest } from 'next/server';
import { runPipeline } from '@/lib/generation/pipeline';
import type { QualityTier } from '@/lib/generation/types';

// Allow up to 5 minutes for pipeline execution (Vercel Pro: 300s max)
export const maxDuration = 300;

const SUPPORTED_MODELS = [
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-opus-4-5',
];

/**
 * POST /api/generate-site/stream
 *
 * SSE-streaming version of the pipeline endpoint.
 * Sends real-time updates as each pipeline stage starts/completes.
 *
 * Events:
 *   stage:start  — { stage, description }
 *   stage:done   — { stage, status, durationMs, data? }
 *   stage:error  — { stage, error }
 *   result       — full PipelineResult
 *   error        — { error, details }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, tier: rawTier, quality, model: requestedModel } = body;
    const tier = rawTier || quality || 'balanced';

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'prompt is required and must be a non-empty string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validTiers: QualityTier[] = ['fast', 'balanced', 'best'];
    const selectedTier: QualityTier = validTiers.includes(tier as QualityTier)
      ? (tier as QualityTier)
      : 'balanced';

    const model = SUPPORTED_MODELS.includes(requestedModel)
      ? requestedModel
      : 'anthropic/claude-sonnet-4-5';

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: unknown) {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        }

        // Throttle chunk sending — we don't need to send every single delta.
        // Send at most every 300ms to avoid overwhelming the client SSE buffer.
        let lastChunkSendTime = 0;
        let pendingChunk: string | null = null;
        let chunkCount = 0;

        function flushChunk(accumulated: string) {
          chunkCount++;
          send('stage:chunk', {
            html: accumulated,
            chars: accumulated.length,
            lines: accumulated.split('\n').length,
            seq: chunkCount,
          });
          pendingChunk = null;
          lastChunkSendTime = Date.now();
        }

        try {
          const result = await runPipeline(
            { prompt: prompt.trim(), tier: selectedTier, model },
            {
              onCodegenChunk: (_chunk, accumulated) => {
                const now = Date.now();
                if (now - lastChunkSendTime >= 300) {
                  // Enough time passed — send immediately
                  flushChunk(accumulated);
                } else {
                  // Buffer for next interval
                  pendingChunk = accumulated;
                }
              },
              onStageStart: (stage, description) => {
                send('stage:start', { stage, description });
              },
              onStageComplete: (stage, meta) => {
                // Flush any remaining buffered chunk when codegen completes
                if (meta.stage === 'codegen' && pendingChunk) {
                  flushChunk(pendingChunk);
                }
                // Send stage data but strip the raw HTML/design system to keep events small
                const eventData: Record<string, unknown> = {
                  stage: meta.stage,
                  status: meta.status,
                  durationMs: meta.durationMs,
                };
                
                // Include useful summary data
                if (meta.stage === 'intent' && meta.data && meta.status === 'success') {
                  const intent = meta.data as Record<string, unknown>;
                  eventData.summary = {
                    siteType: intent.siteType,
                    mood: intent.mood,
                    businessName: intent.businessName,
                    confidence: intent.confidence,
                  };
                } else if (meta.stage === 'design' && meta.data && meta.status === 'success') {
                  const ds = meta.data as Record<string, unknown>;
                  const colors = ds.colors as Record<string, string> | undefined;
                  const fonts = ds.fonts as Record<string, string> | undefined;
                  eventData.summary = {
                    primary: colors?.primary,
                    background: colors?.background,
                    displayFont: fonts?.display,
                    bodyFont: fonts?.body,
                    layoutPattern: ds.layoutPattern,
                  };
                } else if (meta.stage === 'content' && meta.data && meta.status === 'success') {
                  const cp = meta.data as Record<string, unknown>;
                  const sections = cp.sections as Array<Record<string, unknown>> | undefined;
                  eventData.summary = {
                    sectionCount: sections?.length || 0,
                    sections: sections?.map(s => s.id) || [],
                  };
                } else if (meta.stage === 'quality' && meta.data && meta.status === 'success') {
                  eventData.summary = meta.data;
                }

                if (meta.error) {
                  eventData.error = meta.error;
                }
                
                send('stage:done', eventData);
              },
              onError: (stage, error) => {
                send('stage:error', { stage, error: error.message });
              },
            }
          );

          // Send the full result
          send('result', result);
        } catch (error) {
          send('error', {
            error: 'Pipeline failed',
            details: error instanceof Error ? error.message : String(error),
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Generation pipeline failed',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
