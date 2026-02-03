/**
 * CTRL+Ship Generation Pipeline — Shared Types
 * 
 * 5-stage pipeline: Intent → Design → Content → Code → Quality
 */

// ─── Stage 1: Intent Classification ──────────────────────────────────────────

export type SiteType =
  | 'saas_landing'
  | 'ecommerce'
  | 'portfolio'
  | 'restaurant'
  | 'law_firm'
  | 'healthcare'
  | 'real_estate'
  | 'education'
  | 'nonprofit'
  | 'event'
  | 'blog_magazine'
  | 'local_business'
  | 'startup_landing'
  | 'agency_studio'
  | 'personal_resume';

export type MoodType =
  | 'dark_futuristic'
  | 'clean_minimal'
  | 'warm_organic'
  | 'bold_creative'
  | 'luxury_editorial'
  | 'neo_brutalist'
  | 'playful_rounded'
  | 'corporate_solid'
  | 'vintage_warm'
  | 'tech_dashboard';

export interface ClarifyingQuestion {
  question: string;
  options: string[];
}

export interface IntentResult {
  siteType: SiteType;
  industry: string;
  businessName: string;
  mood: MoodType;
  suggestedSections: string[];
  requiredFeatures: string[];
  contentHints: {
    hasLogo: boolean;
    hasCopy: boolean;
    hasImages: boolean;
    needsGenerated: string[];
  };
  imageKeywords?: string[];
  subjectDetails?: string;
  targetAudience?: string;
  primaryAction?: string;
  uniqueSellingPoints?: string[];
  confidence: number;
  clarifyingQuestions: ClarifyingQuestion[] | null;
}

// ─── Stage 2: Design System ──────────────────────────────────────────────────

export interface DesignSystemColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryGlow: string;
  secondary: string;
  accent: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
}

export interface DesignSystemFonts {
  display: string;
  body: string;
  mono: string;
  googleImportUrl: string;
}

export interface DesignSystemTypography {
  heroSize: string;
  heroWeight: string;
  heroLetterSpacing: string;
  headingSize: string;
  bodySize: string;
  bodyLineHeight: string;
}

export interface DesignSystemSpacing {
  sectionPadding: string;
  cardPadding: string;
  gap: string;
}

export interface DesignSystemEffects {
  borderRadius: string;
  cardShadow: string;
  glassBg: string;
  glassBackdrop: string;
  gradientPrimary: string;
  hoverTransition: string;
}

export interface DesignSystemAnimations {
  fadeInUp: string;
  staggerDelay: string;
  scrollReveal: boolean;
  hoverScale: string;
  hoverLift: string;
}

export interface DesignSystem {
  colors: DesignSystemColors;
  fonts: DesignSystemFonts;
  typography: DesignSystemTypography;
  spacing: DesignSystemSpacing;
  effects: DesignSystemEffects;
  animations: DesignSystemAnimations;
  layoutPattern: string;
  cssFramework: string;
  iconLibrary: string;
  imageStrategy: string;
}

// ─── Stage 3: Content Plan ───────────────────────────────────────────────────

export interface SectionContent {
  id: string;
  type: string;
  layout: string;
  content: Record<string, unknown>;
  visualElements: string[];
}

export interface ContentPlan {
  sections: SectionContent[];
  metadata: {
    totalSections: number;
    estimatedScrollLength: string;
    mobileLayout: string;
    primaryCta: string;
    secondaryCta: string;
    // Threaded from intent analysis for codegen context
    imageKeywords?: string[];
    subjectDetails?: string;
    targetAudience?: string;
    [key: string]: unknown;
  };
}

// ─── Stage 5: Quality Validation ─────────────────────────────────────────────

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface QualityIssue {
  severity: IssueSeverity;
  category: string;
  message: string;
  autoFixable: boolean;
}

export interface QualityReport {
  passed: boolean;
  score: number;
  issues: QualityIssue[];
  metrics: {
    htmlSize: number;
    sectionCount: number;
    hasResponsiveDesign: boolean;
    hasAnimations: boolean;
    hasHoverStates: boolean;
    hasSmoothScroll: boolean;
    hasMetaViewport: boolean;
    fontCount: number;
    imageCount: number;
  };
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

export type QualityTier = 'fast' | 'balanced' | 'best';

export interface PipelineInput {
  prompt: string;
  tier: QualityTier;
  model?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface PipelineStageResult {
  stage: string;
  status: 'success' | 'error' | 'skipped';
  durationMs: number;
  data?: unknown;
  error?: string;
}

export interface PipelineResult {
  html: string;
  designSystem?: DesignSystem;
  contentPlan?: ContentPlan;
  intentResult?: IntentResult;
  qualityReport: QualityReport;
  stages: PipelineStageResult[];
  totalDurationMs: number;
  model: string;
  tier: QualityTier;
}

// ─── Gateway ─────────────────────────────────────────────────────────────────

export interface GatewayConfig {
  url: string;
  token: string;
  defaultModel: string;
}

export interface GatewayMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
