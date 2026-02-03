/**
 * Stage 2: Design System Generation (Design Architect)
 *
 * Generates a specific, opinionated design system as structured JSON.
 * This is the most important differentiator — every generation gets
 * a unique, tailored design system instead of using a static template.
 *
 * Medium call (~10-20s, ~1500 output tokens)
 */

import type { DesignSystem, IntentResult, GatewayMessage } from './types';
import { GatewayClient } from './gateway';
import { TEMPLATE_THEMES } from './template-themes';

const DESIGN_ARCHITECT_PROMPT = `You are a world-class web design architect. Given website requirements, generate a specific, opinionated design system as JSON.

## Rules — CRITICAL
1. Be WILDLY opinionated. Strong direction > safe defaults.
2. All colors as exact hex values (not "blue" — give "#06b6d4")
3. Font pairings: always pair a DISPLAY font (bold/distinctive) with a BODY font (clean/readable)
4. Hero headlines: clamp(3.5rem, 8vw, 6rem) minimum — go bigger
5. Section padding: generous (clamp(4rem, 8vw, 8rem) vertical)
6. Never use default Tailwind blue/indigo unless explicitly requested
7. Light OR dark — commit fully
8. Every mood has a different visual personality. Don't reuse palettes.

## Google Font Options (pick exactly 2-3)
Display: Space Grotesk, Outfit, Plus Jakarta Sans, Sora, Clash Display, Cabinet Grotesk, General Sans
Serif Display: Playfair Display, Cormorant Garamond, DM Serif Display, Fraunces, Libre Baskerville
Body: Inter, DM Sans, Outfit, Source Sans Pro, Nunito Sans, Work Sans
Mono: JetBrains Mono, Fira Code, Space Mono, IBM Plex Mono

## Mood → Design Direction
- dark_futuristic: Deep navy (#0a1628 range), cyan/purple neon accents, glassmorphism, gradient mesh bg, 1px rgba borders
- clean_minimal: Pure white (#ffffff), one subtle accent color, large whitespace, hairline borders, system-like fonts
- warm_organic: Cream (#FDFCF9 range), sage/terracotta accents, serif display, soft shadows, rounded shapes (1.5rem radius)
- bold_creative: Vibrant gradients, 80px+ headlines, mixed weights, asymmetric grid, no border-radius on some elements
- luxury_editorial: Very tight letter-spacing (-0.04em), gold/champagne on dark, thin borders, elegant serif, minimal color
- neo_brutalist: 0px border-radius, thick 3px borders, bold shadows (4px 4px 0px), mono fonts, primary colors
- playful_rounded: 2rem+ border-radius, pastel palette, bouncy transitions, rounded sans-serif, shadow + border combo
- corporate_solid: Navy/slate palette, clean sans-serif, subtle blue accent, data-friendly, 0.5rem radius
- vintage_warm: Earthy palette (#8B6F47 range), serif + script combo, warm shadows, subtle texture references
- tech_dashboard: Near-black bg (#0f0f13), green/blue data accents, monospace numbers, compact spacing, thin borders

## Output Schema
Return ONLY valid JSON. No explanation, no markdown.
{
  "colors": {
    "background": "#hex",
    "foreground": "#hex",
    "card": "#hex",
    "cardForeground": "#hex",
    "primary": "#hex",
    "primaryGlow": "rgba(...)",
    "secondary": "#hex",
    "accent": "#hex",
    "muted": "#hex",
    "mutedForeground": "#hex",
    "border": "rgba(...)",
    "destructive": "#hex"
  },
  "fonts": {
    "display": "Font Name",
    "body": "Font Name",
    "mono": "Font Name",
    "googleImportUrl": "https://fonts.googleapis.com/css2?family=..."
  },
  "typography": {
    "heroSize": "clamp(...)",
    "heroWeight": "700",
    "heroLetterSpacing": "-0.03em",
    "headingSize": "clamp(...)",
    "bodySize": "1.125rem",
    "bodyLineHeight": "1.75"
  },
  "spacing": {
    "sectionPadding": "clamp(...) clamp(...)",
    "cardPadding": "2rem",
    "gap": "1.5rem"
  },
  "effects": {
    "borderRadius": "1rem",
    "cardShadow": "0 4px 24px rgba(...)",
    "glassBg": "rgba(...)",
    "glassBackdrop": "blur(20px)",
    "gradientPrimary": "linear-gradient(...)",
    "hoverTransition": "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  "animations": {
    "fadeInUp": "fadeInUp 0.6s ease-out",
    "staggerDelay": "0.1s",
    "scrollReveal": true,
    "hoverScale": "1.02",
    "hoverLift": "-4px"
  },
  "layoutPattern": "descriptive name",
  "cssFramework": "tailwind_cdn",
  "iconLibrary": "lucide",
  "imageStrategy": "unsplash_keyword"
}`;

function buildUserMessage(intent: IntentResult, userPrompt: string): string {
  return `## Website Request
"${userPrompt}"

## Analyzed Requirements
- Site Type: ${intent.siteType}
- Industry: ${intent.industry}
- Business: ${intent.businessName}
- Mood: ${intent.mood}
- Sections needed: ${intent.suggestedSections.join(', ')}
- Features: ${intent.requiredFeatures.join(', ')}

Generate a design system that perfectly matches this ${intent.mood.replace(/_/g, ' ')} aesthetic for a ${intent.industry} ${intent.siteType.replace(/_/g, ' ')}.`;
}

export async function generateDesignSystem(
  userPrompt: string,
  intent: IntentResult,
  gateway: GatewayClient
): Promise<DesignSystem> {
  const messages: GatewayMessage[] = [
    { role: 'system', content: DESIGN_ARCHITECT_PROMPT },
    { role: 'user', content: buildUserMessage(intent, userPrompt) },
  ];

  const result = await gateway.callJSON<DesignSystem>(messages, {
    maxTokens: 2000,
    temperature: 0.8, // Higher temp for creative variety
  });

  // Validate critical fields
  if (!result.colors?.background || !result.colors?.primary) {
    throw new Error('Design system missing required color fields');
  }
  if (!result.fonts?.display || !result.fonts?.body) {
    throw new Error('Design system missing required font fields');
  }

  // Ensure defaults for optional fields
  result.cssFramework = result.cssFramework || 'tailwind_cdn';
  result.iconLibrary = result.iconLibrary || 'lucide';
  result.imageStrategy = result.imageStrategy || 'unsplash';
  result.animations = result.animations || {
    fadeInUp: 'fadeInUp 0.6s ease-out',
    staggerDelay: '0.1s',
    scrollReveal: true,
    hoverScale: '1.02',
    hoverLift: '-4px',
  };

  return result;
}

/**
 * For "fast" tier: skip LLM call, use a template design system based on mood.
 * 10 themes covering all mood types in the taxonomy.
 */
export function getTemplateDesignSystem(mood: string): DesignSystem {
  return TEMPLATE_THEMES[mood] || TEMPLATE_THEMES.dark_futuristic;
}
