/**
 * CTRL+Ship Generation Pipeline
 *
 * 5-stage pipeline for website generation:
 *   1. Intent Classification
 *   2. Design System Generation
 *   3. Content Planning
 *   4. HTML Code Generation
 *   5. Quality Validation
 */

export { runPipeline } from './pipeline';
export type { PipelineCallbacks } from './pipeline';

export { classifyIntent } from './stage1-intent';
export { generateDesignSystem, getTemplateDesignSystem } from './stage2-design';
export { TEMPLATE_THEMES } from './template-themes';
export { generateContentPlan } from './stage3-content';
export { generateCode, iterateCode } from './stage4-codegen';
export { validateHTML, autoFixHTML, llmReviewPass } from './stage5-quality';

export { GatewayClient, getGateway, parseJSONResponse, extractHTML } from './gateway';

export type {
  // Pipeline
  PipelineInput,
  PipelineResult,
  PipelineStageResult,
  QualityTier,
  // Stage 1
  IntentResult,
  SiteType,
  MoodType,
  ClarifyingQuestion,
  // Stage 2
  DesignSystem,
  DesignSystemColors,
  DesignSystemFonts,
  DesignSystemTypography,
  DesignSystemSpacing,
  DesignSystemEffects,
  DesignSystemAnimations,
  // Stage 3
  ContentPlan,
  SectionContent,
  // Stage 5
  QualityReport,
  QualityIssue,
  IssueSeverity,
  // Gateway
  GatewayConfig,
  GatewayMessage,
} from './types';
