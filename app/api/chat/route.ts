import { NextRequest, NextResponse } from "next/server";
import { GatewayClient, extractHTML } from "@/lib/generation/gateway";

// Allow up to 5 minutes for generation
export const maxDuration = 300;

/**
 * Chat API — Website generation for CTRL+Ship workspace
 *
 * TWO-STEP PROCESS:
 *   Step 1: Generate a specific design system (~300 tokens)
 *   Step 2: Generate HTML using that design system (~10-15K tokens)
 *
 * Direct Anthropic API calls via GatewayClient.
 */

const DEFAULT_MODEL = "anthropic/claude-sonnet-4-5";

const DESIGN_ARCHITECT_PROMPT = `You are an elite design system architect. Given a website request, create a SPECIFIC, OPINIONATED design system specification in 200-300 words covering:

1. PALETTE: 5-7 exact hex colors: --bg, --surface, --text, --accent, --accent-2, --muted. Include rgba variants.
2. TYPOGRAPHY: Two Google Fonts with weights. Display font for headlines. Body font for text. Hero: clamp(4rem,10vw,9rem). Sections: clamp(2.5rem,5vw,4.5rem). Body: 18px.
3. HERO (90-100vh): Background treatment, headline placement, CTA style, one visual flourish.
4. SECTION LAYOUTS (6+ sections): Each section uses a DIFFERENT layout pattern. Describe each specifically.
5. CSS TECHNIQUES: 4 specific techniques with implementation details.
6. CARD STYLE: border-radius, layered shadows, hover transform, background.
7. MOOD: One sentence.

RULES:
- Be wildly opinionated. Strong direction > safe default.
- Light OR dark — commit fully.
- No section should repeat another's layout.
- Output ONLY the design system text.`;

const buildHtmlPrompt = (designSystem: string) => `You are an elite frontend engineer building stunning, production-quality standalone HTML websites.

DESIGN SYSTEM (follow EXACTLY):
---
${designSystem}
---

OUTPUT: <!DOCTYPE html> to </html>. No markdown, no explanations.
CSS in <style>, JS in <script> at body end.
Load Google Fonts via <link>. Load Tailwind: <script src="https://cdn.tailwindcss.com"></script>

STRUCTURE: Nav (sticky, blur) → Hero (90-100vh, massive headline) → Social proof bar → Features (3-6 cards with hover) → Showcase (different layout) → Stats (large numbers) → Testimonials (quotes + avatars) → CTA → Footer (multi-col).

ANIMATIONS: Elements start VISIBLE (opacity:1). Scroll animations enhance only:
.reveal { transform:translateY(12px); opacity:0.85; transition:all 0.6s ease; }
.reveal.active { transform:translateY(0); opacity:1; }
IntersectionObserver adds .active. Cards: hover translateY(-4px) + shadow grow.

IMAGES: Unsplash (https://images.unsplash.com/photo-ID?w=800&q=80) or picsum (https://picsum.photos/seed/KEYWORD/W/H). Avatars: i.pravatar.cc/48?img=N. NEVER placehold.co.

AVOID: opacity:0 defaults, repeated layouts, Tailwind default colors, headlines <2.5rem, flat cards, generic text.

Output ONLY HTML.`;

const PLAN_PROMPT = `You are Jarvis, Tech Lead of a web development swarm in PLAN mode.
Brainstorm ideas, discuss architecture, suggest approaches. Be concise, use bullet points.
Do NOT generate code — only discuss strategy.`;

const ITERATION_PROMPT = `You are an elite frontend engineer iterating on an existing website.
Apply the user's changes while maintaining the existing design system.
RULES:
1. Output ONLY the complete updated HTML — no explanations, no markdown.
2. Start with <!DOCTYPE html>, end with </html>.
3. Preserve existing design language, animations, hover states, responsive behavior.
4. New sections must match the existing design system.`;

function getClient(): GatewayClient {
  return new GatewayClient({
    token: process.env.ANTHROPIC_API_KEY || '',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, mode = "build" } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const client = getClient();

    // ── Plan mode ──
    if (mode === "plan") {
      const content = await client.call(
        [{ role: "system", content: PLAN_PROMPT }, ...messages],
        { maxTokens: 4096, temperature: 0.7 }
      );
      return NextResponse.json({ content, html: "", model: DEFAULT_MODEL });
    }

    // ── Build mode ──
    const userMessages = messages.filter((m: { role: string }) => m.role === "user");
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || "";

    const hasHistory = messages.some(
      (m: { role: string; content: string }) =>
        m.role === "assistant" && m.content.includes("<!DOCTYPE")
    );

    let designSystem = "";
    let htmlContent = "";

    if (!hasHistory) {
      // First generation: design system → HTML
      console.log(`[Chat API] Step 1: Design system for "${latestUserMessage.substring(0, 60)}..."`);

      designSystem = await client.call(
        [
          { role: "system", content: DESIGN_ARCHITECT_PROMPT },
          { role: "user", content: latestUserMessage },
        ],
        { maxTokens: 1500, temperature: 0.8 }
      );

      console.log(`[Chat API] Step 2: Generating HTML`);

      htmlContent = await client.call(
        [
          { role: "system", content: buildHtmlPrompt(designSystem) },
          { role: "user", content: latestUserMessage },
        ],
        { maxTokens: 16384, temperature: 0.6 }
      );
    } else {
      // Iteration: pass full conversation
      console.log(`[Chat API] Iteration mode`);

      htmlContent = await client.call(
        [{ role: "system", content: ITERATION_PROMPT }, ...messages],
        { maxTokens: 16384, temperature: 0.5 }
      );
    }

    const html = extractHTML(htmlContent);

    console.log(`[Chat API] Done. html=${html.length} chars`);

    return NextResponse.json({
      content: htmlContent,
      html,
      designSystem: designSystem || undefined,
      model: DEFAULT_MODEL,
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
