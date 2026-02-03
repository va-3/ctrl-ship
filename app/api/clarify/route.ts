import { NextRequest } from 'next/server';
import { getGateway } from '@/lib/generation/gateway';
import type { GatewayMessage } from '@/lib/generation/types';

export const maxDuration = 30;

const CLARIFY_SYSTEM_PROMPT = `You are an expert web design requirements analyst. A user wants to build a website. Your job is to ask HIGHLY specific, contextual questions that will dramatically improve the final website's quality and personalization.

## How Many Questions to Ask
Analyze the user's prompt depth:
- **Vague prompt** (e.g., "make me a website"): Ask 4 questions covering purpose, style, content, and specifics
- **Moderate prompt** (e.g., "a landing page for my coffee shop"): Ask 3 questions focusing on what's MISSING — style, unique details, key content
- **Detailed prompt** (e.g., lengthy description with colors, features, audience): Ask 2 questions on the few remaining unknowns
- **Very detailed prompt** (includes style, audience, sections, branding): Ask 1-2 micro questions for final polish

The MORE detail the user provides, the FEWER questions you ask. But EVERY question must extract information that will noticeably change the output.

## Question Quality Rules
1. Each option should be a short, clear label (2-8 words max)
2. Include one flexible/open option per question ("Surprise me", "Designer's choice")
3. Questions MUST reference specific details FROM the user's prompt
4. NEVER ask something the user already answered in their prompt
5. Focus on VISUAL and EMOTIONAL decisions that the user cares about
6. Options should represent MEANINGFULLY different design directions

## What Makes a Good Question
- BAD: "What's the purpose of your site?" (too generic)
- GOOD: "Rocky sounds like a fun dog! What vibe should his site have?" (specific, personal)
- BAD: "What sections do you want?" (boring, generic)
- GOOD: "Should Rocky's page highlight his tricks, daily adventures, or adoption story?" (specific to their context)

## Deep Prompt Analysis
Before generating questions, mentally break down the prompt:
1. WHO is this for? (person, business, pet, organization)
2. WHAT is the subject? (exact product, service, personality)
3. WHY does this site exist? (showcase, sell, inform, entertain)
4. WHAT images would make this feel personal? (breed-specific, location-specific, industry-specific)
5. WHAT style matches the subject? (a dog site vs. a law firm need totally different aesthetics)
6. WHAT specific content would make this stand out? (not generic — personal stories, real details)

Use this analysis to ask questions that fill in the gaps.

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "summary": "one-line summary showing you deeply understood their request — reference specific details from their prompt",
  "promptAnalysis": {
    "subject": "what/who the site is about",
    "audience": "who will visit this site",
    "missingInfo": ["list of key things NOT specified in the prompt that would improve the result"],
    "detailLevel": "vague|moderate|detailed|very_detailed"
  },
  "questions": [
    {
      "id": "unique_descriptive_id",
      "question": "conversational question referencing their specific prompt details",
      "options": ["Specific Option A", "Specific Option B", "Specific Option C", "Flexible option"]
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const gateway = getGateway();
    const messages: GatewayMessage[] = [
      { role: 'system', content: CLARIFY_SYSTEM_PROMPT },
      { role: 'user', content: prompt.trim() },
    ];

    const result = await gateway.callJSON<{
      summary: string;
      promptAnalysis?: {
        subject?: string;
        audience?: string;
        missingInfo?: string[];
        detailLevel?: string;
      };
      questions: Array<{ id: string; question: string; options: string[] }>;
    }>(messages, {
      maxTokens: 800,
      temperature: 0.7,
    });

    // Validate
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      return Response.json({ error: 'No questions generated' }, { status: 500 });
    }

    // Cap at 4 questions max
    result.questions = result.questions.slice(0, 4);

    return Response.json(result);
  } catch (error) {
    console.error('[Clarify API] Error:', error);
    return Response.json(
      {
        error: 'Failed to generate questions',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
