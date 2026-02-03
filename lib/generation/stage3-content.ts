/**
 * Stage 3: Content & Structure Planning
 *
 * Generates all copy, section ordering, and component specs BEFORE code.
 * This separation is what makes the output dramatically better — the LLM
 * focuses on compelling content without also thinking about CSS/HTML.
 *
 * Medium call (~15-20s, ~2000 output tokens)
 */

import type { ContentPlan, IntentResult, DesignSystem, GatewayMessage } from './types';
import { GatewayClient } from './gateway';

const CONTENT_PLANNER_PROMPT = `You are an expert content strategist and copywriter for landing pages. Given a website's requirements and design system, generate ALL the content and structure for the page.

## Rules
1. Write compelling, specific copy — never use "Lorem ipsum" or generic placeholder text
2. Headlines should be punchy (5-8 words max), benefit-driven
3. Subheadlines expand on the headline with specifics (15-25 words)
4. Feature descriptions are concise (1-2 sentences each)
5. Stats/metrics should feel real and impressive (use realistic numbers)
6. Testimonials should feel authentic — specific praise, real-sounding names
7. CTAs should be action-oriented and specific ("Start Free Trial" not "Learn More")
8. Every section gets a DIFFERENT layout type — never repeat
9. Content flows logically: hook → explain → prove → convert

## Section Ordering (recommended)
1. hero: The hook — massive headline, one-liner, and primary CTA
2. social_proof: Quick credibility — "Trusted by" logo bar or user count
3. features: What it does — 3-6 features in cards/grid
4. showcase: Deep dive — split layout with image + detailed content
5. stats: Proof — 3-4 impressive numbers
6. testimonials: Social proof — 2-3 customer quotes
7. pricing: (if applicable) — 2-3 tiers
8. cta: Final push — strong closing headline + CTA
9. footer: Navigation, links, copyright

## Layout Options (assign different ones to each section)
- hero_centered: Centered headline + subtext + buttons (most common)
- hero_split: Text left, visual right (or reversed)
- bento_grid: Mixed-size cards in a CSS grid
- three_col_cards: Equal cards in a row
- two_col_split: Image/visual on one side, text on the other
- stats_bar: Horizontal row of big numbers
- testimonial_cards: 2-3 quote cards
- pricing_table: Side-by-side pricing tiers
- cta_banner: Full-width with centered text
- multi_col_footer: 3-4 column footer with link groups
- alternating_rows: Content alternates left/right each row
- icon_grid: 2x3 or 3x3 grid with icon + text items

## Output Schema
Return ONLY valid JSON. No markdown, no explanation.
{
  "sections": [
    {
      "id": "hero",
      "type": "hero",
      "layout": "hero_centered",
      "content": {
        "badge": "Optional badge text or null",
        "headline": "The Main Headline",
        "subheadline": "Supporting text that expands on the headline",
        "primaryCta": { "text": "Button Text", "href": "#section" },
        "secondaryCta": { "text": "Alt Button", "href": "#section" }
      },
      "visualElements": ["gradient_mesh_bg", "floating_shapes"]
    }
  ],
  "metadata": {
    "totalSections": 8,
    "estimatedScrollLength": "5-6 viewports",
    "mobileLayout": "single_column_stack",
    "primaryCta": "Start Free Trial",
    "secondaryCta": "Watch Demo"
  }
}`;

function buildUserMessage(
  userPrompt: string,
  intent: IntentResult,
  designSystem: DesignSystem
): string {
  return `## Original Request
"${userPrompt}"

## Requirements
- Business: ${intent.businessName}
- Type: ${intent.siteType.replace(/_/g, ' ')}
- Industry: ${intent.industry}
- Mood: ${intent.mood.replace(/_/g, ' ')}
- Sections needed: ${intent.suggestedSections.join(', ')}
- Content to generate: ${intent.contentHints.needsGenerated.join(', ')}

## Subject Details (CRITICAL — use this to make content feel authentic)
${intent.subjectDetails || 'No additional subject details. Infer from the original request.'}

## Target Audience
${intent.targetAudience || 'General audience interested in ' + intent.industry}

## Primary Action
${intent.primaryAction || 'Contact or learn more'}

## Unique Selling Points
${(intent.uniqueSellingPoints || []).map((p: string) => `- ${p}`).join('\n') || '- To be determined from context'}

${intent.imageKeywords?.length ? `## Image Keywords (reference these in visual element descriptions)\n${intent.imageKeywords.join(', ')}` : ''}

## Design Direction
- Layout pattern: ${designSystem.layoutPattern}
- Color mood: ${designSystem.colors.background.startsWith('#0') || designSystem.colors.background.startsWith('#1') ? 'Dark theme' : 'Light theme'}
- Primary accent: ${designSystem.colors.primary}
- Display font: ${designSystem.fonts.display}

## Content Generation Rules
1. EVERY headline must be specific to "${intent.businessName}" — no generic phrases like "Welcome to our website"
2. Reference specific details from the Subject Details section in body copy
3. Testimonials should mention specific aspects of the subject
4. Stats/metrics should be realistic and relevant to the ${intent.industry} industry
5. CTAs should drive the primary action: ${intent.primaryAction || 'engagement'}
6. The tone should match the mood: ${intent.mood.replace(/_/g, ' ')}

Generate the full content plan. The content should feel like it was written BY an expert who deeply understands this specific subject, not by a generic template engine.`;
}

export async function generateContentPlan(
  userPrompt: string,
  intent: IntentResult,
  designSystem: DesignSystem,
  gateway: GatewayClient
): Promise<ContentPlan> {
  const messages: GatewayMessage[] = [
    { role: 'system', content: CONTENT_PLANNER_PROMPT },
    { role: 'user', content: buildUserMessage(userPrompt, intent, designSystem) },
  ];

  const result = await gateway.callJSON<ContentPlan>(messages, {
    maxTokens: 4000,
    temperature: 0.8,
  });

  // Validate
  if (!result.sections || !Array.isArray(result.sections) || result.sections.length === 0) {
    throw new Error('Content plan has no sections');
  }

  // Ensure metadata
  result.metadata = result.metadata || {
    totalSections: result.sections.length,
    estimatedScrollLength: `${Math.max(3, result.sections.length - 1)} viewports`,
    mobileLayout: 'single_column_stack',
    primaryCta: 'Get Started',
    secondaryCta: 'Learn More',
  };

  return result;
}
