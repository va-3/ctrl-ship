/**
 * Template design systems for the "fast" tier.
 * 10 mood-based themes covering the full taxonomy.
 */

import type { DesignSystem } from './types';

const SHARED_DEFAULTS = {
  cssFramework: 'tailwind_cdn' as const,
  iconLibrary: 'lucide' as const,
  imageStrategy: 'unsplash' as const,
};

function ds(partial: Omit<DesignSystem, 'cssFramework' | 'iconLibrary' | 'imageStrategy'>): DesignSystem {
  return { ...partial, ...SHARED_DEFAULTS };
}

export const TEMPLATE_THEMES: Record<string, DesignSystem> = {
  dark_futuristic: ds({
    colors: {
      background: '#0a1628', foreground: '#f8fafc', card: '#111d35', cardForeground: '#f8fafc',
      primary: '#06b6d4', primaryGlow: 'rgba(6, 182, 212, 0.15)', secondary: '#8b5cf6',
      accent: '#22d3ee', muted: '#1e293b', mutedForeground: '#94a3b8',
      border: 'rgba(255,255,255,0.08)', destructive: '#ef4444',
    },
    fonts: {
      display: 'Space Grotesk', body: 'Inter', mono: 'JetBrains Mono',
      googleImportUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap',
    },
    typography: { heroSize: 'clamp(3.5rem, 8vw, 6rem)', heroWeight: '700', heroLetterSpacing: '-0.03em', headingSize: 'clamp(2rem, 4vw, 3.5rem)', bodySize: '1.125rem', bodyLineHeight: '1.75' },
    spacing: { sectionPadding: 'clamp(4rem, 8vw, 8rem) clamp(1rem, 5vw, 4rem)', cardPadding: '2rem', gap: '1.5rem' },
    effects: { borderRadius: '1rem', cardShadow: '0 4px 24px rgba(0,0,0,0.3)', glassBg: 'rgba(17, 29, 53, 0.7)', glassBackdrop: 'blur(20px)', gradientPrimary: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', hoverTransition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
    animations: { fadeInUp: 'fadeInUp 0.6s ease-out', staggerDelay: '0.1s', scrollReveal: true, hoverScale: '1.02', hoverLift: '-4px' },
    layoutPattern: 'dark_bento_cards',
  }),

  clean_minimal: ds({
    colors: {
      background: '#ffffff', foreground: '#0f172a', card: '#f8fafc', cardForeground: '#0f172a',
      primary: '#0f172a', primaryGlow: 'rgba(15, 23, 42, 0.05)', secondary: '#6366f1',
      accent: '#3b82f6', muted: '#f1f5f9', mutedForeground: '#64748b',
      border: 'rgba(0,0,0,0.06)', destructive: '#ef4444',
    },
    fonts: {
      display: 'Plus Jakarta Sans', body: 'Inter', mono: 'JetBrains Mono',
      googleImportUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap',
    },
    typography: { heroSize: 'clamp(3rem, 7vw, 5rem)', heroWeight: '800', heroLetterSpacing: '-0.04em', headingSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', bodySize: '1.0625rem', bodyLineHeight: '1.7' },
    spacing: { sectionPadding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 6rem)', cardPadding: '1.75rem', gap: '1.25rem' },
    effects: { borderRadius: '0.75rem', cardShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.04)', glassBg: 'rgba(255,255,255,0.8)', glassBackdrop: 'blur(12px)', gradientPrimary: 'linear-gradient(135deg, #0f172a, #334155)', hoverTransition: 'all 0.2s ease' },
    animations: { fadeInUp: 'fadeInUp 0.5s ease-out', staggerDelay: '0.08s', scrollReveal: true, hoverScale: '1.01', hoverLift: '-2px' },
    layoutPattern: 'minimal_card_grid',
  }),

  warm_organic: ds({
    colors: {
      background: '#FDFCF9', foreground: '#2D2418', card: '#F7F3ED', cardForeground: '#2D2418',
      primary: '#8B6F47', primaryGlow: 'rgba(139, 111, 71, 0.1)', secondary: '#7C9A6E',
      accent: '#C17F5A', muted: '#EDE8E0', mutedForeground: '#8B7D6B',
      border: 'rgba(139, 111, 71, 0.12)', destructive: '#C0392B',
    },
    fonts: {
      display: 'Playfair Display', body: 'DM Sans', mono: 'IBM Plex Mono',
      googleImportUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap',
    },
    typography: { heroSize: 'clamp(3rem, 7vw, 5.5rem)', heroWeight: '600', heroLetterSpacing: '-0.02em', headingSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', bodySize: '1.0625rem', bodyLineHeight: '1.8' },
    spacing: { sectionPadding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)', cardPadding: '2rem', gap: '1.5rem' },
    effects: { borderRadius: '1.5rem', cardShadow: '0 2px 12px rgba(139, 111, 71, 0.08)', glassBg: 'rgba(253, 252, 249, 0.85)', glassBackdrop: 'blur(12px)', gradientPrimary: 'linear-gradient(135deg, #8B6F47, #C17F5A)', hoverTransition: 'all 0.3s ease' },
    animations: { fadeInUp: 'fadeInUp 0.7s ease-out', staggerDelay: '0.12s', scrollReveal: true, hoverScale: '1.01', hoverLift: '-3px' },
    layoutPattern: 'organic_flowing',
  }),

  bold_creative: ds({
    colors: {
      background: '#0f0f0f', foreground: '#ffffff', card: '#1a1a1a', cardForeground: '#ffffff',
      primary: '#FF6B35', primaryGlow: 'rgba(255, 107, 53, 0.2)', secondary: '#F7C948',
      accent: '#FF3366', muted: '#262626', mutedForeground: '#a3a3a3',
      border: 'rgba(255, 255, 255, 0.1)', destructive: '#ef4444',
    },
    fonts: {
      display: 'Sora', body: 'DM Sans', mono: 'Space Mono',
      googleImportUrl: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&family=Space+Mono:wght@400&display=swap',
    },
    typography: { heroSize: 'clamp(4rem, 10vw, 8rem)', heroWeight: '800', heroLetterSpacing: '-0.04em', headingSize: 'clamp(2rem, 5vw, 4rem)', bodySize: '1.125rem', bodyLineHeight: '1.7' },
    spacing: { sectionPadding: 'clamp(5rem, 10vw, 9rem) clamp(1rem, 5vw, 4rem)', cardPadding: '2.5rem', gap: '2rem' },
    effects: { borderRadius: '0.5rem', cardShadow: '0 8px 32px rgba(0,0,0,0.4)', glassBg: 'rgba(26, 26, 26, 0.8)', glassBackdrop: 'blur(16px)', gradientPrimary: 'linear-gradient(135deg, #FF6B35, #FF3366, #F7C948)', hoverTransition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
    animations: { fadeInUp: 'fadeInUp 0.5s ease-out', staggerDelay: '0.08s', scrollReveal: true, hoverScale: '1.03', hoverLift: '-6px' },
    layoutPattern: 'bold_asymmetric',
  }),

  luxury_editorial: ds({
    colors: {
      background: '#0C0B09', foreground: '#F5F0E8', card: '#161411', cardForeground: '#F5F0E8',
      primary: '#C9A96E', primaryGlow: 'rgba(201, 169, 110, 0.1)', secondary: '#8B7355',
      accent: '#D4AF37', muted: '#1F1C18', mutedForeground: '#8C8070',
      border: 'rgba(201, 169, 110, 0.12)', destructive: '#B91C1C',
    },
    fonts: {
      display: 'Cormorant Garamond', body: 'Inter', mono: 'JetBrains Mono',
      googleImportUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap',
    },
    typography: { heroSize: 'clamp(3.5rem, 8vw, 7rem)', heroWeight: '400', heroLetterSpacing: '-0.04em', headingSize: 'clamp(2rem, 4vw, 3.5rem)', bodySize: '1rem', bodyLineHeight: '1.8' },
    spacing: { sectionPadding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 6vw, 6rem)', cardPadding: '2.5rem', gap: '1.5rem' },
    effects: { borderRadius: '0.25rem', cardShadow: '0 2px 16px rgba(0,0,0,0.4)', glassBg: 'rgba(12, 11, 9, 0.85)', glassBackdrop: 'blur(20px)', gradientPrimary: 'linear-gradient(135deg, #C9A96E, #D4AF37)', hoverTransition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' },
    animations: { fadeInUp: 'fadeInUp 0.8s ease-out', staggerDelay: '0.15s', scrollReveal: true, hoverScale: '1.01', hoverLift: '-2px' },
    layoutPattern: 'editorial_grid',
  }),

  neo_brutalist: ds({
    colors: {
      background: '#FFFEF5', foreground: '#1a1a1a', card: '#ffffff', cardForeground: '#1a1a1a',
      primary: '#FF5733', primaryGlow: 'rgba(255, 87, 51, 0.1)', secondary: '#3357FF',
      accent: '#FFBD33', muted: '#F5F5DC', mutedForeground: '#666666',
      border: '#1a1a1a', destructive: '#FF0000',
    },
    fonts: {
      display: 'Space Mono', body: 'Work Sans', mono: 'Space Mono',
      googleImportUrl: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@400;500;600;700&display=swap',
    },
    typography: { heroSize: 'clamp(3.5rem, 9vw, 7rem)', heroWeight: '700', heroLetterSpacing: '-0.02em', headingSize: 'clamp(2rem, 4.5vw, 3.5rem)', bodySize: '1.0625rem', bodyLineHeight: '1.7' },
    spacing: { sectionPadding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 4rem)', cardPadding: '2rem', gap: '1.5rem' },
    effects: { borderRadius: '0px', cardShadow: '4px 4px 0px #1a1a1a', glassBg: 'rgba(255, 254, 245, 0.95)', glassBackdrop: 'blur(0px)', gradientPrimary: 'linear-gradient(135deg, #FF5733, #FFBD33)', hoverTransition: 'all 0.15s ease' },
    animations: { fadeInUp: 'fadeInUp 0.4s ease-out', staggerDelay: '0.06s', scrollReveal: true, hoverScale: '1.02', hoverLift: '-3px' },
    layoutPattern: 'brutalist_blocks',
  }),

  playful_rounded: ds({
    colors: {
      background: '#FFF8F0', foreground: '#2D1B4E', card: '#ffffff', cardForeground: '#2D1B4E',
      primary: '#7C3AED', primaryGlow: 'rgba(124, 58, 237, 0.12)', secondary: '#EC4899',
      accent: '#06B6D4', muted: '#F3EEFF', mutedForeground: '#7E6B9C',
      border: 'rgba(124, 58, 237, 0.1)', destructive: '#EF4444',
    },
    fonts: {
      display: 'Outfit', body: 'Nunito Sans', mono: 'Fira Code',
      googleImportUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Nunito+Sans:wght@400;500;600&family=Fira+Code:wght@400&display=swap',
    },
    typography: { heroSize: 'clamp(3rem, 7vw, 5rem)', heroWeight: '800', heroLetterSpacing: '-0.02em', headingSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', bodySize: '1.0625rem', bodyLineHeight: '1.75' },
    spacing: { sectionPadding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)', cardPadding: '2rem', gap: '1.5rem' },
    effects: { borderRadius: '2rem', cardShadow: '0 4px 20px rgba(124, 58, 237, 0.08), 0 1px 3px rgba(0,0,0,0.04)', glassBg: 'rgba(255, 248, 240, 0.85)', glassBackdrop: 'blur(16px)', gradientPrimary: 'linear-gradient(135deg, #7C3AED, #EC4899)', hoverTransition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' },
    animations: { fadeInUp: 'fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', staggerDelay: '0.1s', scrollReveal: true, hoverScale: '1.03', hoverLift: '-4px' },
    layoutPattern: 'playful_cards',
  }),

  corporate_solid: ds({
    colors: {
      background: '#F8FAFC', foreground: '#0F172A', card: '#FFFFFF', cardForeground: '#0F172A',
      primary: '#1E40AF', primaryGlow: 'rgba(30, 64, 175, 0.08)', secondary: '#0369A1',
      accent: '#2563EB', muted: '#E2E8F0', mutedForeground: '#64748B',
      border: 'rgba(15, 23, 42, 0.08)', destructive: '#DC2626',
    },
    fonts: {
      display: 'Plus Jakarta Sans', body: 'Source Sans Pro', mono: 'IBM Plex Mono',
      googleImportUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Source+Sans+Pro:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap',
    },
    typography: { heroSize: 'clamp(2.5rem, 6vw, 4.5rem)', heroWeight: '700', heroLetterSpacing: '-0.03em', headingSize: 'clamp(1.5rem, 3vw, 2.5rem)', bodySize: '1rem', bodyLineHeight: '1.7' },
    spacing: { sectionPadding: 'clamp(3.5rem, 7vw, 6rem) clamp(1.5rem, 5vw, 5rem)', cardPadding: '1.5rem', gap: '1.25rem' },
    effects: { borderRadius: '0.5rem', cardShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)', glassBg: 'rgba(248, 250, 252, 0.9)', glassBackdrop: 'blur(12px)', gradientPrimary: 'linear-gradient(135deg, #1E40AF, #2563EB)', hoverTransition: 'all 0.2s ease' },
    animations: { fadeInUp: 'fadeInUp 0.5s ease-out', staggerDelay: '0.08s', scrollReveal: true, hoverScale: '1.01', hoverLift: '-2px' },
    layoutPattern: 'corporate_grid',
  }),

  vintage_warm: ds({
    colors: {
      background: '#FAF6F0', foreground: '#3D2B1F', card: '#FFFDF8', cardForeground: '#3D2B1F',
      primary: '#8B4513', primaryGlow: 'rgba(139, 69, 19, 0.08)', secondary: '#A0522D',
      accent: '#CD853F', muted: '#EDE4DA', mutedForeground: '#7D6B5D',
      border: 'rgba(139, 69, 19, 0.1)', destructive: '#A52A2A',
    },
    fonts: {
      display: 'DM Serif Display', body: 'Work Sans', mono: 'IBM Plex Mono',
      googleImportUrl: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@400&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap',
    },
    typography: { heroSize: 'clamp(3rem, 7vw, 5.5rem)', heroWeight: '400', heroLetterSpacing: '-0.01em', headingSize: 'clamp(1.75rem, 3.5vw, 3rem)', bodySize: '1.0625rem', bodyLineHeight: '1.8' },
    spacing: { sectionPadding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)', cardPadding: '2rem', gap: '1.5rem' },
    effects: { borderRadius: '0.75rem', cardShadow: '0 2px 8px rgba(139, 69, 19, 0.06)', glassBg: 'rgba(250, 246, 240, 0.9)', glassBackdrop: 'blur(10px)', gradientPrimary: 'linear-gradient(135deg, #8B4513, #CD853F)', hoverTransition: 'all 0.3s ease' },
    animations: { fadeInUp: 'fadeInUp 0.7s ease-out', staggerDelay: '0.12s', scrollReveal: true, hoverScale: '1.01', hoverLift: '-2px' },
    layoutPattern: 'vintage_stacked',
  }),

  tech_dashboard: ds({
    colors: {
      background: '#0f0f13', foreground: '#E4E4E7', card: '#18181B', cardForeground: '#E4E4E7',
      primary: '#22C55E', primaryGlow: 'rgba(34, 197, 94, 0.12)', secondary: '#3B82F6',
      accent: '#A78BFA', muted: '#27272A', mutedForeground: '#71717A',
      border: 'rgba(255, 255, 255, 0.06)', destructive: '#EF4444',
    },
    fonts: {
      display: 'Inter', body: 'Inter', mono: 'JetBrains Mono',
      googleImportUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
    },
    typography: { heroSize: 'clamp(2.5rem, 6vw, 4.5rem)', heroWeight: '700', heroLetterSpacing: '-0.03em', headingSize: 'clamp(1.5rem, 3vw, 2.25rem)', bodySize: '0.9375rem', bodyLineHeight: '1.7' },
    spacing: { sectionPadding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 3rem)', cardPadding: '1.5rem', gap: '1rem' },
    effects: { borderRadius: '0.75rem', cardShadow: '0 2px 8px rgba(0,0,0,0.3)', glassBg: 'rgba(24, 24, 27, 0.8)', glassBackdrop: 'blur(16px)', gradientPrimary: 'linear-gradient(135deg, #22C55E, #3B82F6)', hoverTransition: 'all 0.2s ease' },
    animations: { fadeInUp: 'fadeInUp 0.4s ease-out', staggerDelay: '0.06s', scrollReveal: true, hoverScale: '1.02', hoverLift: '-2px' },
    layoutPattern: 'dashboard_dense',
  }),
};
