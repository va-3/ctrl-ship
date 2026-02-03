"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import WorkspaceNav from "./WorkspaceNav";
import LivePreview from "./LivePreview";
import LiveCodePreview from "./LiveCodePreview";
import PipelinePreview from "./PipelinePreview";
import ClarifyingQuestions from "./ClarifyingQuestions";
import BuildChat, { type Message } from "./BuildChat";
import FeedbackPanel from "./FeedbackPanel";
import VersionBar, { type Version } from "./VersionBar";
import PipelineProgress, { getPipelineStages, type PipelineStage } from "./PipelineProgress";
import QualityBadge from "./QualityBadge";
import { MODELS, type ModelOption } from "./NavBar";
import { Eye, MessageSquare } from "lucide-react";
import type { QualityTier, QualityReport, PipelineStageResult } from "@/lib/generation/types";
import { getSwarmStore } from "@/lib/swarm-store";
import { getCreditsStore, type CreditTier } from "@/lib/credits-store";

type Viewport = "desktop" | "tablet" | "mobile";

interface BuildWorkspaceProps {
  initialPrompt: string;
  initialQuality: string;
  initialModel?: string;
}

// Map old quality mode names to pipeline tiers
function mapQualityToTier(quality: string): QualityTier {
  switch (quality) {
    case "fast":
    case "sketch":
      return "fast";
    case "best":
    case "premium":
      return "best";
    default:
      return "balanced";
  }
}

let msgCounter = 0;
const nextId = () => `msg-${Date.now()}-${++msgCounter}`;

export default function BuildWorkspace({ initialPrompt, initialQuality, initialModel }: BuildWorkspaceProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [showCode, setShowCode] = useState(false);
  const [model, setModel] = useState<ModelOption>(
    MODELS.find((m) => m.id === initialModel) || MODELS[0]
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [html, setHtml] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const versionHtmlMap = useRef<Map<number, string>>(new Map());
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [projectName, setProjectName] = useState("New Project");
  const [showQuality, setShowQuality] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | undefined>();
  const [isDeploying, setIsDeploying] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  
  // Mobile: tabbed layout — "preview" or "chat"
  const [mobileTab, setMobileTab] = useState<"preview" | "chat">("preview");

  // Live streaming state
  const [isCodeStreaming, setIsCodeStreaming] = useState(false);
  const [streamedHtml, setStreamedHtml] = useState("");
  const [streamCharCount, setStreamCharCount] = useState(0);
  const [streamLineCount, setStreamLineCount] = useState(0);
  const [streamChunkSeq, setStreamChunkSeq] = useState(0);
  const [designColors, setDesignColors] = useState<{ primary?: string; background?: string; accent?: string; foreground?: string; card?: string; border?: string } | undefined>();
  const [codegenStageLabel, setCodegenStageLabel] = useState<string | undefined>();

  // Pipeline preview state — for progressive visualization during stages 1-3
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [intentData, setIntentData] = useState<{
    siteType?: string;
    mood?: string;
    businessName?: string;
    confidence?: number;
    sections?: string[];
  } | null>(null);
  const [designFonts, setDesignFonts] = useState<{
    display?: string;
    body?: string;
    googleImportUrl?: string;
  } | null>(null);
  const [contentSections, setContentSections] = useState<string[]>([]);

  // Clarifying questions state — shown in chat panel before generation
  const [isClarifying, setIsClarifying] = useState(false);
  const [clarifyQuestions, setClarifyQuestions] = useState<Array<{ id: string; question: string; options: string[] }>>([]);
  const [clarifySummary, setClarifySummary] = useState("");
  const [enrichedPrompt, setEnrichedPrompt] = useState("");

  const handleDeploy = useCallback(async () => {
    if (!html || isDeploying) return;
    setIsDeploying(true);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, name: projectName }),
      });
      const data = await res.json();
      if (data.url) {
        setDeployUrl(data.url);
      }
    } catch (err) {
      console.error("Deploy failed:", err);
    } finally {
      setIsDeploying(false);
    }
  }, [html, projectName, isDeploying]);

  const handleDownload = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-v${currentVersion}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [html, projectName, currentVersion]);

  const handleClarifyComplete = useCallback((answers: Record<string, string>) => {
    const answerLines = Object.entries(answers)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");
    const enriched = `${initialPrompt}

═══ USER PREFERENCES (from clarifying questions) ═══
${answerLines}

═══ GENERATION INSTRUCTIONS ═══
Use the above preferences to deeply personalize EVERY aspect of the website:
1. IMAGES: Choose images that specifically match the subject and mood described above
2. COPY: Write headlines and descriptions that reflect the personality/style the user chose
3. COLORS: If the user indicated a mood or vibe, the design system should reflect it
4. LAYOUT: Structure sections to prioritize what the user cares about most
5. TONE: Match the writing style to the user's personality preferences
6. DETAILS: Include specific references to the user's answers — make them feel the site was built just for them`;
    setEnrichedPrompt(enriched);
    setIsClarifying(false);
    setClarifyQuestions([]);

    // Add summary message to chat
    const summaryMsg: Message = {
      id: nextId(),
      role: "assistant",
      content: `Got it! Building with your preferences:\n${Object.values(answers).map(a => `• ${a}`).join("\n")}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, summaryMsg]);

    // Switch to preview tab on mobile to watch the build
    setMobileTab("preview");
    // Start generation with enriched prompt, skip adding duplicate user message
    handleGenerate(enriched, initialQuality, true);
  }, [initialPrompt, initialQuality]);

  const handleClarifySkip = useCallback(() => {
    setIsClarifying(false);
    setClarifyQuestions([]);
    handleGenerate(initialPrompt, initialQuality);
  }, [initialPrompt, initialQuality]);

  useEffect(() => {
    const words = initialPrompt.split(" ").slice(0, 4).join(" ");
    setProjectName(words.length > 30 ? words.substring(0, 30) + "..." : words || "New Project");
  }, [initialPrompt]);

  const hasStarted = useRef(false);
  useEffect(() => {
    if (initialPrompt && !hasStarted.current) {
      hasStarted.current = true;

      // Add user message immediately
      const userMsg: Message = {
        id: nextId(),
        role: "user",
        content: initialPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([userMsg]);

      // Run clarifying questions before generation
      (async () => {
        try {
          setIsClarifying(true);
          const res = await fetch("/api/clarify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: initialPrompt }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.questions?.length > 0) {
              setClarifyQuestions(data.questions);
              setClarifySummary(data.summary || "Let me understand what you need...");
              // Auto-switch to chat tab on mobile so user sees questions
              setMobileTab("chat");
              return; // Wait for user to answer questions
            }
          }
          // No questions or API error — start generation directly
          setIsClarifying(false);
          handleGenerate(initialPrompt, initialQuality);
        } catch {
          // Network error — start generation directly
          setIsClarifying(false);
          handleGenerate(initialPrompt, initialQuality);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const messagesRef = useRef<Message[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  /**
   * Consume SSE stream from /api/generate-site/stream
   * Falls back to plain POST /api/generate-site if SSE fails
   */
  const runPipelineStream = useCallback(async (
    prompt: string,
    tier: QualityTier,
    modelId: string,
    stages: PipelineStage[],
    onStageEvent?: (event: 'start' | 'done' | 'error', stageId: string, detail?: string, durationMs?: number) => void,
  ): Promise<{
    html: string;
    qualityReport?: QualityReport;
    totalDurationMs?: number;
    intentResult?: Record<string, unknown>;
    designSystem?: Record<string, unknown>;
    stages?: PipelineStageResult[];
  } | null> => {
    try {
      const res = await fetch("/api/generate-site/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tier, model: modelId }),
      });

      if (!res.ok || !res.body) {
        // Fall back to non-streaming endpoint
        return null;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult: Record<string, unknown> | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const events = buffer.split("\n\n");
        buffer = events.pop() || ""; // Keep incomplete event in buffer

        for (const event of events) {
          if (!event.trim()) continue;

          const eventMatch = event.match(/^event:\s*(.+)$/m);
          const dataMatch = event.match(/^data:\s*(.+)$/m);
          if (!eventMatch || !dataMatch) continue;

          const eventType = eventMatch[1];
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(dataMatch[1]);
          } catch {
            continue;
          }

          switch (eventType) {
            case "stage:start": {
              const stageId = data.stage as string;
              setCurrentStage(stageId);
              setPipelineStages(prev => prev.map(s =>
                s.id === stageId
                  ? { ...s, status: "active" as const, description: (data.description as string) || s.description }
                  : s
              ));
              // When codegen starts, activate streaming mode
              if (stageId === "codegen") {
                setIsCodeStreaming(true);
                setStreamedHtml("");
                setStreamCharCount(0);
                setStreamLineCount(0);
                setStreamChunkSeq(0);
                setCodegenStageLabel("Building your website...");
              }
              onStageEvent?.('start', stageId);
              break;
            }
            case "stage:chunk": {
              // Live HTML chunk from codegen streaming
              const chunkHtml = data.html as string;
              const chars = data.chars as number;
              const lines = data.lines as number;
              const seq = data.seq as number;
              setStreamedHtml(chunkHtml);
              setStreamCharCount(chars);
              setStreamLineCount(lines);
              setStreamChunkSeq(seq);
              break;
            }
            case "stage:done": {
              const stageId = data.stage as string;
              const status = data.status as string;
              const summary = data.summary as Record<string, unknown> | undefined;

              // When codegen finishes, stop streaming mode
              if (stageId === "codegen") {
                setIsCodeStreaming(false);
              }

              let detail = "";
              if (stageId === "intent" && summary) {
                detail = `${summary.siteType} • ${summary.mood} • ${((summary.confidence as number) * 100).toFixed(0)}%`;
                // Capture intent data for pipeline preview
                setIntentData({
                  siteType: summary.siteType as string,
                  mood: summary.mood as string,
                  businessName: summary.businessName as string,
                  confidence: summary.confidence as number,
                });
              } else if (stageId === "design" && summary) {
                // Capture design system for pipeline preview
                setDesignColors({
                  primary: summary.primary as string | undefined,
                  background: summary.background as string | undefined,
                });
                setDesignFonts({
                  display: summary.displayFont as string | undefined,
                  body: summary.bodyFont as string | undefined,
                });
                detail = `${summary.displayFont || "?"} + ${summary.bodyFont || "?"}`;
              } else if (stageId === "content" && summary) {
                detail = `${summary.sectionCount || 0} sections`;
                // Capture section list for pipeline preview
                const secs = summary.sections as string[] | undefined;
                if (secs && secs.length > 0) {
                  setContentSections(secs);
                }
              } else if (stageId === "quality" && summary) {
                const qr = summary as unknown as QualityReport;
                detail = `Score: ${qr.score}/100`;
                setQualityReport(qr);
                setShowQuality(true);
              }

              setPipelineStages(prev => prev.map(s =>
                s.id === stageId
                  ? {
                      ...s,
                      status: status === "success" ? "done" as const :
                        status === "skipped" ? "skipped" as const : "error" as const,
                      durationMs: data.durationMs as number,
                      detail,
                    }
                  : s
              ));
              onStageEvent?.(status === 'success' ? 'done' : 'error', stageId, detail, data.durationMs as number);
              break;
            }
            case "stage:error": {
              const stageId = data.stage as string;
              setPipelineStages(prev => prev.map(s =>
                s.id === stageId ? { ...s, status: "error" as const } : s
              ));
              onStageEvent?.('error', stageId);
              break;
            }
            case "result": {
              finalResult = data;
              break;
            }
            case "error": {
              throw new Error((data.details as string) || (data.error as string) || "Pipeline failed");
            }
          }
        }
      }

      if (finalResult) {
        return {
          html: (finalResult.html as string) || "",
          qualityReport: finalResult.qualityReport as QualityReport | undefined,
          totalDurationMs: finalResult.totalDurationMs as number | undefined,
          intentResult: finalResult.intentResult as Record<string, unknown> | undefined,
          designSystem: finalResult.designSystem as Record<string, unknown> | undefined,
          stages: finalResult.stages as PipelineStageResult[] | undefined,
        };
      }

      return null;
    } catch (err) {
      console.error("[BuildWorkspace] SSE stream failed, falling back:", err);
      return null;
    }
  }, []);

  /**
   * Fallback: plain POST to /api/generate-site
   */
  const runPipelinePlain = useCallback(async (
    prompt: string,
    tier: QualityTier,
    modelId: string,
  ) => {
    const res = await fetch("/api/generate-site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, tier, model: modelId }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.details || errorData.error || `HTTP ${res.status}`);
    }

    return await res.json();
  }, []);

  const handleGenerate = useCallback(async (prompt: string, quality?: string, skipUserMsg?: boolean) => {
    setIsGenerating(true);
    setGenerationStartTime(Date.now());
    setShowFeedback(false);
    setShowQuality(false);
    setQualityReport(null);
    setTotalDuration(undefined);
    // Reset streaming state
    setIsCodeStreaming(false);
    setStreamedHtml("");
    setStreamCharCount(0);
    setStreamLineCount(0);
    setStreamChunkSeq(0);
    setDesignColors(undefined);
    setCodegenStageLabel(undefined);
    setCurrentStage(null);
    setIntentData(null);
    setDesignFonts(null);
    setContentSections([]);

    const tier = mapQualityToTier(quality || "balanced");
    const swarm = getSwarmStore();
    const creditsStore = getCreditsStore();

    // Check credits before starting (fast/best map to CreditTier)
    const creditTier: CreditTier = tier === "fast" ? "fast" : "best";
    if (!creditsStore.canAfford(creditTier)) {
      const errMsg: Message = {
        id: nextId(),
        role: "assistant",
        content: `Not enough credits. You need ${creditsStore.getCostForTier(creditTier)} credits for a ${creditTier} build, but you only have ${creditsStore.getRawCredits()} remaining.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
      setIsGenerating(false);
      return;
    }

    // Deduct credits upfront
    creditsStore.deduct(creditTier);

    // Update swarm agent models to match current selection
    swarm.setAgentModel(model.id);

    let updatedMessages = messagesRef.current;
    if (!skipUserMsg) {
      const userMsg: Message = {
        id: nextId(),
        role: "user",
        content: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      updatedMessages = [...messagesRef.current, userMsg];
      setMessages(updatedMessages);
    }

    // Check if this is first generation or iteration
    const hasHistory = updatedMessages.some(
      (m) => m.role === "assistant" && m.content.includes("<!DOCTYPE")
    );

    if (!hasHistory) {
      // ── First generation: use the 5-stage pipeline ──
      const stages = getPipelineStages(tier);
      setPipelineStages(stages);

      // Track in swarm store
      const jobId = swarm.createJob(prompt, tier, model.id);
      swarm.startJob(jobId);

      try {
        // Stage event handler for swarm store tracking
        const handleStageEvent = (event: 'start' | 'done' | 'error', stageId: string, detail?: string, durationMs?: number) => {
          if (event === 'start') swarm.startStage(jobId, stageId);
          else if (event === 'done') swarm.completeStage(jobId, stageId, durationMs, detail);
          else swarm.failStage(jobId, stageId, detail);
        };

        // Try SSE streaming first, fall back to plain POST
        let result = await runPipelineStream(prompt.trim(), tier, model.id, stages, handleStageEvent);

        if (!result) {
          // Fallback: simulate stage progression + plain POST
          const stageIds = stages.filter(s => s.status !== "skipped").map(s => s.id);
          let idx = 0;
          const interval = setInterval(() => {
            if (idx < stageIds.length) {
              const currentStageId = stageIds[idx];
              setPipelineStages(prev => prev.map((s) => {
                const stagePos = stageIds.indexOf(s.id);
                if (stagePos === idx) return { ...s, status: "active" as const };
                if (stagePos < idx && stagePos >= 0) return { ...s, status: "done" as const };
                return s;
              }));
              // Track in swarm
              if (idx > 0) swarm.completeStage(jobId, stageIds[idx - 1]);
              swarm.startStage(jobId, currentStageId);
              idx++;
            }
          }, 5000);

          const data = await runPipelinePlain(prompt.trim(), tier, model.id);
          clearInterval(interval);

          // Update swarm with actual stage results from plain POST
          if (data.stages) {
            for (const s of data.stages as PipelineStageResult[]) {
              if (s.status === 'success') {
                swarm.completeStage(jobId, s.stage, s.durationMs);
              } else if (s.status === 'skipped') {
                swarm.skipStage(jobId, s.stage);
              } else {
                swarm.failStage(jobId, s.stage, s.error);
              }
            }
          }

          result = {
            html: data.html || "",
            qualityReport: data.qualityReport,
            totalDurationMs: data.totalDurationMs,
            intentResult: data.intentResult,
            designSystem: data.designSystem,
            stages: data.stages,
          };

          // Update stages with actual results
          if (data.stages) {
            setPipelineStages(prev => prev.map(stage => {
              const actual = (data.stages as PipelineStageResult[]).find(
                (s: PipelineStageResult) => s.stage === stage.id
              );
              if (actual) {
                let detail = "";
                if (stage.id === "intent" && data.intentResult) {
                  detail = `${data.intentResult.siteType} • ${data.intentResult.mood} • ${(data.intentResult.confidence * 100).toFixed(0)}%`;
                } else if (stage.id === "design" && data.designSystem) {
                  detail = `${data.designSystem.fonts?.display || "?"} + ${data.designSystem.fonts?.body || "?"}`;
                } else if (stage.id === "content" && data.contentPlan) {
                  detail = `${data.contentPlan.sections?.length || 0} sections`;
                } else if (stage.id === "quality" && data.qualityReport) {
                  detail = `Score: ${data.qualityReport.score}/100`;
                }
                return {
                  ...stage,
                  status: actual.status === "success" ? "done" as const :
                    actual.status === "skipped" ? "skipped" as const : "error" as const,
                  durationMs: actual.durationMs,
                  detail,
                };
              }
              return { ...stage, status: stage.status === "skipped" ? "skipped" as const : "done" as const };
            }));
          }
        }

        if (result && result.html) {
          setHtml(result.html);
          setCodeContent(result.html);
          setTotalDuration(result.totalDurationMs);

          if (result.qualityReport) {
            setQualityReport(result.qualityReport);
            setShowQuality(true);
          }

          const vNum = versions.length + 1;
          const newVersion: Version = {
            id: nextId(),
            number: vNum,
            label: `v${vNum}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          versionHtmlMap.current.set(vNum, result.html);
          setVersions((prev) => [...prev, newVersion]);
          setCurrentVersion(vNum);
          setShowFeedback(true);

          // Build rich chat message
          const qualityScore = result.qualityReport?.score || 0;
          const stagesSummary = (result.stages || [])
            .filter((s: PipelineStageResult) => s.status !== "skipped")
            .map((s: PipelineStageResult) => `${s.stage}: ${(s.durationMs / 1000).toFixed(1)}s`)
            .join(" → ");

          const ds = result.designSystem as Record<string, Record<string, string>> | undefined;
          const ir = result.intentResult as Record<string, unknown> | undefined;

          const summaryMsg: Message = {
            id: nextId(),
            role: "assistant",
            content: result.html,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            metadata: {
              type: "generation",
              tier,
              qualityScore,
              totalDurationMs: result.totalDurationMs,
              stagesSummary,
              intentResult: ir ? {
                siteType: ir.siteType as string,
                mood: ir.mood as string,
                confidence: ir.confidence as number,
                businessName: ir.businessName as string,
              } : undefined,
              designSystem: ds ? {
                primary: ds.colors?.primary,
                background: ds.colors?.background,
                displayFont: ds.fonts?.display,
                bodyFont: ds.fonts?.body,
              } : undefined,
            },
          };
          setMessages((prev) => [...prev, summaryMsg]);

          // Track completion in swarm store
          swarm.completeJob(jobId, qualityScore);
        } else {
          // No result — pipeline returned empty
          setPipelineStages(prev => prev.map(s =>
            s.status === "active" || s.status === "pending"
              ? { ...s, status: "error" as const }
              : s
          ));
          swarm.failJob(jobId, "Pipeline returned empty output");
          creditsStore.refund(creditTier);
          const errMsg: Message = {
            id: nextId(),
            role: "assistant",
            content: "Generation produced no output. Your credits have been refunded. Try again in a moment.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, errMsg]);
        }
      } catch (err) {
        setPipelineStages(prev => prev.map(s =>
          s.status === "active" || s.status === "pending"
            ? { ...s, status: "error" as const }
            : s
        ));
        swarm.failJob(jobId, err instanceof Error ? err.message : "Unknown error");
        creditsStore.refund(creditTier);

        const errMsg: Message = {
          id: nextId(),
          role: "assistant",
          content: `Generation failed: ${err instanceof Error ? err.message : "Unknown error"}. Your credits have been refunded.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } else {
      // ── Iteration: use /api/chat for refinement ──
      setPipelineStages([
        { id: "iterate", name: "Refining", emoji: "🔄", description: "Applying your changes...", status: "active" },
      ]);

      try {
        const apiMessages = updatedMessages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            mode: "build",
            model: model.id,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const generatedHtml = data.html || data.content || "";

          setHtml(generatedHtml);
          setCodeContent(generatedHtml);

          setPipelineStages([
            { id: "iterate", name: "Refining", emoji: "🔄", description: "Changes applied", status: "done" },
          ]);

          const iterVNum = versions.length + 1;
          const newVersion: Version = {
            id: nextId(),
            number: iterVNum,
            label: `v${iterVNum}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          versionHtmlMap.current.set(iterVNum, generatedHtml);
          setVersions((prev) => [...prev, newVersion]);
          setCurrentVersion(iterVNum);
          setShowFeedback(true);

          const doneMsg: Message = {
            id: nextId(),
            role: "assistant",
            content: generatedHtml,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, doneMsg]);
        } else {
          setPipelineStages([
            { id: "iterate", name: "Refining", emoji: "🔄", description: "Failed", status: "error" },
          ]);

          const errMsg: Message = {
            id: nextId(),
            role: "assistant",
            content: `Iteration failed (${res.status}). Try again.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, errMsg]);
        }
      } catch {
        setPipelineStages([
          { id: "iterate", name: "Refining", emoji: "🔄", description: "Error", status: "error" },
        ]);

        const errMsg: Message = {
          id: nextId(),
          role: "assistant",
          content: "Connection error. Check API configuration.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    }

    setIsGenerating(false);
    setGenerationStartTime(null);
  }, [model, versions.length, runPipelineStream, runPipelinePlain]);

  const handleChatSend = useCallback(async (message: string, mode: string) => {
    if (mode === "plan") {
      const planMsg: Message = {
        id: nextId(),
        role: "user",
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const updatedMessages = [...messagesRef.current, planMsg];
      setMessages(updatedMessages);
      setIsGenerating(true);

      try {
        const apiMessages = updatedMessages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .filter((m) => !m.content.includes("<!DOCTYPE")) // Exclude HTML from plan context
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            mode: "plan",
            model: model.id,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const response: Message = {
            id: nextId(),
            role: "assistant",
            content: data.content || "I couldn't generate a plan. Try rephrasing your question.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, response]);
        } else {
          const errMsg: Message = {
            id: nextId(),
            role: "assistant",
            content: `Plan mode failed (${res.status}). Try again.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, errMsg]);
        }
      } catch {
        const errMsg: Message = {
          id: nextId(),
          role: "assistant",
          content: "Connection error. Check API configuration.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errMsg]);
      }

      setIsGenerating(false);
    } else {
      handleGenerate(message);
    }
  }, [model, handleGenerate]);

  const handleFeedback = (type: string, details?: string) => {
    setShowFeedback(false);
    if (type === "perfect") {
      const msg: Message = {
        id: nextId(),
        role: "assistant",
        content: "Great! Your project is ready. You can deploy it or continue refining.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, msg]);
    } else if (details) {
      handleGenerate(details);
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      <WorkspaceNav
        projectName={projectName}
        viewport={viewport}
        onViewportChange={setViewport}
        showCode={showCode}
        onToggleCode={() => setShowCode(!showCode)}
        model={model}
        onModelChange={setModel}
        onDownload={html ? handleDownload : undefined}
        onDeploy={html ? handleDeploy : undefined}
        deployUrl={deployUrl}
        isDeploying={isDeploying}
        isGenerating={isGenerating}
        generationStartTime={generationStartTime}
        totalDuration={totalDuration}
      />

      {/* Mobile Tab Bar — only on small screens */}
      <div
        className="flex sm:hidden items-center"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <button
          onClick={() => setMobileTab("preview")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all relative"
          style={{
            color: mobileTab === "preview" ? "var(--text)" : "var(--text-muted)",
          }}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
          {mobileTab === "preview" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: "var(--accent, #8b5cf6)" }} />
          )}
        </button>
        <button
          onClick={() => setMobileTab("chat")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all relative"
          style={{
            color: mobileTab === "chat" ? "var(--text)" : "var(--text-muted)",
          }}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
          {/* Notification dot when clarifying questions arrive while on preview tab */}
          {mobileTab === "preview" && isClarifying && clarifyQuestions.length > 0 && (
            <div className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full animate-pulse" style={{ background: "#8b5cf6" }} />
          )}
          {mobileTab === "chat" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: "var(--accent, #8b5cf6)" }} />
          )}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area — hidden on mobile when chat tab is active */}
        <div className={`flex-1 flex flex-col overflow-hidden ${mobileTab === "chat" ? "hidden sm:flex" : "flex"}`}>
          {/* Pipeline Progress — shows during generation */}
          {isGenerating && pipelineStages.length > 0 && (
            <div className="px-2 sm:px-4 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <PipelineProgress stages={pipelineStages} compact />
            </div>
          )}

          {/* Pipeline summary bar — shows after completion with details */}
          {!isGenerating && pipelineStages.length > 0 && pipelineStages.some(s => s.durationMs) && (
            <div
              className="px-2 sm:px-4 py-2 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderBottom: "1px solid var(--border)" }}
              onClick={() => setShowQuality(!showQuality)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 overflow-hidden">
                  <PipelineProgress stages={pipelineStages} compact totalDurationMs={totalDuration} />
                </div>
                {qualityReport && <QualityBadge report={qualityReport} compact />}
              </div>
            </div>
          )}

          {/* 
            Four preview states:
            1. PipelinePreview — during stages 1-3 (progressive skeleton)
            2. LiveCodePreview — during codegen streaming (split code + preview)
            3. Static code view — when "Code" toggle is on
            4. LivePreview — normal preview (before/after generation)
          */}
          {isCodeStreaming || (isGenerating && streamedHtml && !html) ? (
            <LiveCodePreview
              streamedHtml={streamedHtml}
              isStreaming={isCodeStreaming}
              charCount={streamCharCount}
              lineCount={streamLineCount}
              chunkSeq={streamChunkSeq}
              viewport={viewport}
              stageLabel={codegenStageLabel}
              designColors={designColors}
            />
          ) : (isClarifying || (isGenerating && !html && !isCodeStreaming && currentStage && currentStage !== "codegen")) ? (
            <PipelinePreview
              stage={currentStage as "intent" | "design" | "content" | "quality"}
              viewport={viewport}
              businessName={intentData?.businessName}
              siteType={intentData?.siteType}
              mood={intentData?.mood}
              sections={contentSections.length > 0 ? contentSections : intentData?.sections}
              colors={designColors}
              fonts={designFonts || undefined}
            />
          ) : showCode ? (
            <div className="flex-1 overflow-auto p-4" style={{ background: "var(--bg-secondary)" }}>
              <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                {codeContent || "// No code generated yet"}
              </pre>
            </div>
          ) : (
            <LivePreview html={html} viewport={viewport} isGenerating={isGenerating} />
          )}

          <VersionBar versions={versions} currentVersion={currentVersion} onSelect={(vNum) => {
            setCurrentVersion(vNum);
            const vHtml = versionHtmlMap.current.get(vNum);
            if (vHtml) {
              setHtml(vHtml);
              setCodeContent(vHtml);
            }
          }} />
        </div>

        {/* Chat + Details Panel — full width on mobile, side panel on desktop */}
        <div
          className={`flex flex-col shrink-0 ${mobileTab === "preview" ? "hidden sm:flex" : "flex"} w-full sm:w-80 lg:w-96 sm:border-l`}
          style={{ borderColor: "var(--border)" }}
        >
          {/* Quality report detail (expandable) */}
          {showQuality && qualityReport && !isGenerating && (
            <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <QualityBadge report={qualityReport} />
            </div>
          )}

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden">
              <BuildChat messages={messages} onSend={handleChatSend} isGenerating={isGenerating || isClarifying} />
            </div>

            {/* Clarifying questions — shown in chat panel during planning */}
            {isClarifying && clarifyQuestions.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <ClarifyingQuestions
                  questions={clarifyQuestions}
                  summary={clarifySummary}
                  onComplete={handleClarifyComplete}
                  onSkip={handleClarifySkip}
                />
              </div>
            )}
          </div>

          {showFeedback && !isClarifying && (
            <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
              <FeedbackPanel onSubmit={handleFeedback} onDismiss={() => setShowFeedback(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
