/**
 * Stage 4: Full HTML/Code Generation (Code Builder)
 *
 * Generates the complete, deployable HTML page constrained by:
 *   - Design system (colors, fonts, spacing, effects)
 *   - Content plan (exact copy, sections, layout patterns)
 *
 * This is the longest stage (~60-120s, ~16K output tokens).
 */

import type { DesignSystem, ContentPlan, IntentResult, GatewayMessage } from './types';
import { GatewayClient, extractHTML } from './gateway';

function buildCodegenPrompt(
  designSystem: DesignSystem,
  contentPlan: ContentPlan
): string {
  const ds = designSystem;
  const isLight = ds.colors.background === '#ffffff' || ds.colors.background.startsWith('#f');

  return `You are an elite frontend engineer building a production-quality standalone HTML website.
You MUST follow the provided design system and content plan EXACTLY.

═══════════════════════════════════════════════════════════════
DESIGN SYSTEM (follow EXACTLY — do NOT use Tailwind default colors)
═══════════════════════════════════════════════════════════════

COLORS:
  --bg: ${ds.colors.background}
  --fg: ${ds.colors.foreground}
  --card: ${ds.colors.card}
  --card-fg: ${ds.colors.cardForeground}
  --primary: ${ds.colors.primary}
  --primary-glow: ${ds.colors.primaryGlow}
  --secondary: ${ds.colors.secondary}
  --accent: ${ds.colors.accent}
  --muted: ${ds.colors.muted}
  --muted-fg: ${ds.colors.mutedForeground}
  --border: ${ds.colors.border}
  --destructive: ${ds.colors.destructive}

FONTS:
  Display: "${ds.fonts.display}" (for headlines)
  Body: "${ds.fonts.body}" (for text)
  Mono: "${ds.fonts.mono}" (for code/numbers)
  Import: ${ds.fonts.googleImportUrl}

TYPOGRAPHY:
  Hero headline: ${ds.typography.heroSize}, weight ${ds.typography.heroWeight}, letter-spacing ${ds.typography.heroLetterSpacing}
  Section headlines: ${ds.typography.headingSize}
  Body: ${ds.typography.bodySize}, line-height ${ds.typography.bodyLineHeight}

SPACING:
  Section padding: ${ds.spacing.sectionPadding}
  Card padding: ${ds.spacing.cardPadding}
  Gap: ${ds.spacing.gap}

EFFECTS:
  Border radius: ${ds.effects.borderRadius}
  Card shadow: ${ds.effects.cardShadow}
  Glass bg: ${ds.effects.glassBg}
  Glass blur: ${ds.effects.glassBackdrop}
  Primary gradient: ${ds.effects.gradientPrimary}
  Hover transition: ${ds.effects.hoverTransition}

ANIMATIONS:
  Fade-in: ${ds.animations.fadeInUp}
  Stagger: ${ds.animations.staggerDelay}
  Hover scale: ${ds.animations.hoverScale}
  Hover lift: ${ds.animations.hoverLift}

═══════════════════════════════════════════════════════════════
CONTENT PLAN (use this EXACT copy)
═══════════════════════════════════════════════════════════════

${JSON.stringify(contentPlan.sections, null, 2)}

═══════════════════════════════════════════════════════════════
SUBJECT CONTEXT (use for image selection and content tone)
═══════════════════════════════════════════════════════════════

${contentPlan.metadata?.subjectDetails || 'No additional subject details provided.'}

${contentPlan.metadata?.targetAudience ? `TARGET AUDIENCE:\n${contentPlan.metadata.targetAudience}\n` : ''}
${contentPlan.metadata?.primaryAction ? `PRIMARY GOAL: Get visitors to ${contentPlan.metadata.primaryAction}\n` : ''}

${contentPlan.metadata?.imageKeywords && Array.isArray(contentPlan.metadata.imageKeywords)
  ? `RECOMMENDED IMAGE SEEDS (use these as seeds in picsum.photos URLs for thematic variety):\n${(contentPlan.metadata.imageKeywords as string[]).map((k: string, i: number) => `  - Image ${i + 1}: seed="${k.replace(/\s+/g, '-')}" → https://picsum.photos/seed/${k.replace(/\s+/g, '-')}/${i === 0 ? '1200/800' : '800/600'}`).join('\n')}`
  : ''}

═══════════════════════════════════════════════════════════════
GENERATION RULES
═══════════════════════════════════════════════════════════════

## HTML Structure
- Start with <!DOCTYPE html>, end with </html>. Output NOTHING else.
- Semantic HTML5: header, main, section[id], footer, nav
- Every section gets the id from the content plan

## Head
- <meta charset="UTF-8">
- <meta name="viewport" content="width=device-width, initial-scale=1.0">
- Google Fonts <link> exactly as specified
- Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
- All custom CSS in a single <style> block
- Define CSS custom properties from the color palette

## CSS Rules
- Use the custom properties (var(--bg), var(--primary), etc.) for ALL colors
- DO NOT use Tailwind color utilities (no bg-blue-500, no text-gray-300)
- Use Tailwind for layout utilities only (flex, grid, px-6, etc.)
- Add !important on body, h1-h6, p rules to override Tailwind resets
- html { scroll-behavior: smooth }

## Typography
- Hero: font-family var(--font-display), size ${ds.typography.heroSize}
- Headings: font-family var(--font-display), size ${ds.typography.headingSize}
- Body: font-family var(--font-body), size ${ds.typography.bodySize}

## Navigation
- Sticky top, z-50, backdrop-blur
- Logo/brand left, links center or right, CTA button far right
- ${isLight ? 'Light bg with subtle border-bottom' : 'Dark bg with rgba border-bottom'}
- Mobile: hamburger menu that toggles (JS required)

## Hero Section
- 90-100vh minimum height
- Background must have DEPTH: gradient mesh, radial gradient, or image with overlay
- Include one unique visual flourish from the content plan
- CTAs must be prominent: primary (filled) + secondary (outlined/ghost)

## Cards & Features
- Hover states REQUIRED: transform translateY(${ds.animations.hoverLift}) + shadow expansion
- Transition: ${ds.effects.hoverTransition}
- Cards: background var(--card), border 1px solid var(--border), radius ${ds.effects.borderRadius}

## Scroll Animations (CRITICAL — content must be VISIBLE by default)
- Elements start at: opacity 0.85, transform translateY(12px)
- .active class: opacity 1, transform translateY(0)
- IntersectionObserver with threshold 0.15 adds .active
- Content is ALWAYS readable even if JS fails
- Stagger children with incremental delay: ${ds.animations.staggerDelay}

## Images — CRITICAL RULES FOR RELIABLE, SUBJECT-RELEVANT IMAGES
- Use picsum.photos for hero/banner images with unique seeds: https://picsum.photos/seed/{descriptive-seed}/{width}/{height}
  - Seeds should be descriptive words related to the subject: e.g. seed/australian-shepherd/800/600
  - Use DIFFERENT seeds for EACH image so they aren't identical
  - Example seeds: "hero-banner", "feature-1", "about-section", "gallery-photo-1"
- For placeholder/fallback: https://placehold.co/{width}x{height}/{bgHex}/{fgHex}?text={Short+Label}
  - Use design system colors (no # prefix): e.g. placehold.co/800x600/0a1628/8b5cf6?text=Our+Story
- Avatars for testimonials: https://i.pravatar.cc/80?img={1-70}
- EVERY <img> tag MUST have an onerror fallback:
  onerror="this.onerror=null;this.src='https://placehold.co/{width}x{height}/{bgHex}/{fgHex}?text=Image'"
  - This ensures NO broken images even if the network fails
- EVERY <img> tag MUST have loading="lazy" for performance (except hero image which gets loading="eager")
- EVERY image container should have a CSS background-color matching var(--card) so blank space is themed
- All <img> tags MUST have descriptive alt text matching the actual content
- Think about what images would make this site feel PERSONAL to the user's specific request
- NEVER use source.unsplash.com — it is deprecated and returns 404s
- NEVER use made-up Unsplash photo IDs — they return 404s
- NEVER use external CDN URLs that might be blocked or slow on mobile

## Icons
- Lucide icons: <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
- Use <i data-lucide="icon-name"></i> and call lucide.createIcons() at end of body
- Available icons: brain, zap, shield, star, check, arrow-right, menu, x, mail, phone, map-pin, clock, users, bar-chart, code, rocket, sparkles, heart, globe, layers

## Footer
- Multi-column layout (3-4 columns)
- ${isLight ? 'Slightly darker background than main' : 'Slightly darker than card background'}
- Link groups, copyright with current year, optional social icons

## Mobile Responsive
- All text sizes use clamp() — already responsive
- Grid layouts collapse to single column below 768px
- Navigation becomes hamburger menu below 768px
- Images scale with max-width: 100%
- Padding reduces on mobile

## AVOID
- opacity: 0 as default state (content must be visible without JS)
- Repeating the same layout in consecutive sections
- Headlines smaller than 2rem
- Flat cards without hover states
- Generic text like "Welcome to our website"
- Empty placeholder areas

Your response must be ONLY the HTML document. Start with <!DOCTYPE html>.`;
}

export async function generateCode(
  userPrompt: string,
  intent: IntentResult,
  designSystem: DesignSystem,
  contentPlan: ContentPlan,
  gateway: GatewayClient,
  model?: string
): Promise<string> {
  const systemPrompt = buildCodegenPrompt(designSystem, contentPlan);

  const messages: GatewayMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Generate the complete HTML page for "${intent.businessName}" — a ${intent.industry} ${intent.siteType.replace(/_/g, ' ')}.

ORIGINAL USER REQUEST (use this for image selection and content personalization):
"${userPrompt}"

Follow the design system and content plan exactly. All images must be specifically relevant to the user's request above — not generic stock photos. Output ONLY HTML.`,
    },
  ];

  const raw = await gateway.call(messages, {
    model,
    maxTokens: 16000,
    temperature: 0.6,
  });

  const html = extractHTML(raw);

  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    throw new Error('Code generation did not produce valid HTML');
  }

  return html;
}

/**
 * Streaming code generation — yields HTML chunks as they arrive from the LLM.
 * Used for the live preview feature so users see code appearing in real-time.
 * 
 * The `onChunk` callback fires with each text delta and the full accumulated text.
 * Returns the final extracted HTML when complete.
 */
export async function generateCodeStream(
  userPrompt: string,
  intent: IntentResult,
  designSystem: DesignSystem,
  contentPlan: ContentPlan,
  gateway: GatewayClient,
  onChunk: (chunk: string, accumulated: string) => void,
  model?: string
): Promise<string> {
  const systemPrompt = buildCodegenPrompt(designSystem, contentPlan);

  const messages: GatewayMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Generate the complete HTML page for "${intent.businessName}" — a ${intent.industry} ${intent.siteType.replace(/_/g, ' ')}.

ORIGINAL USER REQUEST (use this for image selection and content personalization):
"${userPrompt}"

Follow the design system and content plan exactly. All images must be specifically relevant to the user's request above — not generic stock photos. Output ONLY HTML.`,
    },
  ];

  const raw = await gateway.callStream(messages, {
    model,
    maxTokens: 16000,
    temperature: 0.6,
    onChunk,
  });

  const html = extractHTML(raw);

  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    throw new Error('Code generation did not produce valid HTML');
  }

  return html;
}

/**
 * For iteration: regenerate HTML with conversation context
 */
export async function iterateCode(
  conversationHistory: Array<{ role: string; content: string }>,
  designSystem: DesignSystem,
  gateway: GatewayClient,
  model?: string
): Promise<string> {
  const iterationPrompt = `You are an elite frontend engineer iterating on an existing website design.

Apply the user's requested changes while maintaining the existing design system:
- Colors: var(--bg) = ${designSystem.colors.background}, var(--primary) = ${designSystem.colors.primary}
- Fonts: ${designSystem.fonts.display} (display), ${designSystem.fonts.body} (body)
- Effects: ${designSystem.effects.borderRadius} radius, ${designSystem.effects.cardShadow} shadows

RULES:
1. Output ONLY the complete updated HTML — no explanations, no markdown fences.
2. Start with <!DOCTYPE html>, end with </html>.
3. Preserve the existing design language while applying changes.
4. Keep all animations, hover states, and responsive behavior.
5. If adding a new section, match the existing design system exactly.`;

  const messages: GatewayMessage[] = [
    { role: 'system', content: iterationPrompt },
    ...(conversationHistory as GatewayMessage[]),
  ];

  const raw = await gateway.call(messages, {
    model,
    maxTokens: 16000,
    temperature: 0.5,
  });

  return extractHTML(raw);
}
