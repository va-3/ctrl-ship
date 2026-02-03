import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Mission Control Database Schema
 * 
 * High-quality web development agent coordination system
 * 7 specialized agents (Jarvis, Tony, Bruce, Natasha, Thor, Wanda, Strange)
 */

export default defineSchema({
  // ============================================================
  // AGENTS
  // ============================================================
  agents: defineTable({
    name: v.string(), // "Jarvis", "Tony", "Bruce", etc.
    role: v.string(), // "Tech Lead", "Frontend", "Backend", etc.
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked"),
      v.literal("paused")
    ),
    currentTaskId: v.optional(v.id("tasks")),
    sessionKey: v.string(), // OpenClaw session key for spawning
    expertise: v.array(v.string()), // ["react", "typescript", "testing"]
    githubUsername: v.optional(v.string()), // For PR attribution
    lastHeartbeat: v.optional(v.number()), // Unix timestamp
    spawnedAt: v.optional(v.number()),
    pausedAt: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .index("by_status", ["status"])
    .index("by_role", ["role"]),

  // ============================================================
  // TASKS
  // ============================================================
  tasks: defineTable({
    title: v.string(), // "Add dark mode toggle"
    description: v.string(), // Full specification
    type: v.union(
      v.literal("feature"),
      v.literal("bug"),
      v.literal("refactor"),
      v.literal("docs"),
      v.literal("test")
    ),
    status: v.union(
      v.literal("inbox"),
      v.literal("planning"),
      v.literal("dev"),
      v.literal("testing"),
      v.literal("review"),
      v.literal("merged"),
      v.literal("deployed")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    assignedTo: v.array(v.string()), // Agent names
    githubPR: v.optional(v.string()), // PR URL when created
    branch: v.optional(v.string()), // Git branch name
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    dependencies: v.array(v.id("tasks")), // Blocked by other tasks
    project: v.string(), // Which app/project this belongs to
    createdBy: v.string(), // "user" or agent name
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_project", ["project"])
    .index("by_created_at", ["createdAt"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status", "type"],
    }),

  // ============================================================
  // MESSAGES (Agent Communication)
  // ============================================================
  messages: defineTable({
    taskId: v.optional(v.id("tasks")),
    fromAgent: v.string(), // Agent name (e.g. "Jarvis")
    toAgent: v.string(), // Agent name (e.g. "Tony")
    content: v.string(),
    codeSnippet: v.optional(v.string()), // Syntax highlighted code
    attachments: v.array(v.object({
      type: v.string(),
      url: v.string(),
      name: v.optional(v.string()),
    })),
    mentions: v.array(v.string()), // Agent names (e.g. ["Tony", "Bruce"])
    timestamp: v.number(),
    read: v.boolean(),
  })
    .index("by_task", ["taskId"])
    .index("by_agent", ["fromAgent"])
    .index("by_timestamp", ["timestamp"]),

  // ============================================================
  // ACTIVITIES (Audit Trail)
  // ============================================================
  activities: defineTable({
    type: v.union(
      v.literal("task_created"),
      v.literal("task_assigned"),
      v.literal("task_started"),
      v.literal("status_update"),
      v.literal("message_sent"),
      v.literal("pr_opened"),
      v.literal("pr_reviewed"),
      v.literal("pr_merged"),
      v.literal("tests_passed"),
      v.literal("tests_failed"),
      v.literal("deployed"),
      v.literal("bug_found"),
      v.literal("agent_spawned"),
      v.literal("agent_paused")
    ),
    agentName: v.string(), // Agent name (e.g. "Jarvis")
    taskId: v.optional(v.id("tasks")),
    description: v.string(), // Human-readable description
    metadata: v.object({
      commitHash: v.optional(v.string()),
      prUrl: v.optional(v.string()),
      deployUrl: v.optional(v.string()),
      testResults: v.optional(v.any()),
      errorMessage: v.optional(v.string()),
    }),
    timestamp: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_agent", ["agentName"])
    .index("by_task", ["taskId"])
    .index("by_timestamp", ["timestamp"]),

  // ============================================================
  // DOCUMENTS (Specs, Designs, Docs)
  // ============================================================
  documents: defineTable({
    title: v.string(),
    content: v.string(), // Markdown content
    type: v.union(
      v.literal("spec"),
      v.literal("api_docs"),
      v.literal("architecture"),
      v.literal("test_plan"),
      v.literal("design_mockup")
    ),
    taskId: v.optional(v.id("tasks")),
    githubPath: v.optional(v.string()), // Path in repo
    figmaUrl: v.optional(v.string()), // For Wanda's designs
    createdBy: v.id("agents"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_type", ["type"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["type"],
    }),

  // ============================================================
  // TEST RESULTS
  // ============================================================
  testResults: defineTable({
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("unit"),
      v.literal("integration"),
      v.literal("e2e"),
      v.literal("lighthouse")
    ),
    status: v.union(v.literal("pass"), v.literal("fail")),
    coverage: v.optional(v.number()), // Percentage
    failures: v.array(
      v.object({
        test: v.string(),
        error: v.string(),
        stack: v.optional(v.string()),
      })
    ),
    lighthouse: v.optional(
      v.object({
        performance: v.number(),
        accessibility: v.number(),
        bestPractices: v.number(),
        seo: v.number(),
      })
    ),
    runAt: v.number(),
    duration: v.number(), // milliseconds
  })
    .index("by_task", ["taskId"])
    .index("by_status", ["status"])
    .index("by_run_at", ["runAt"]),

  // ============================================================
  // DEPLOYMENTS
  // ============================================================
  deployments: defineTable({
    taskId: v.optional(v.id("tasks")),
    environment: v.union(v.literal("preview"), v.literal("production")),
    url: v.string(), // Deploy URL
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failed")
    ),
    commitHash: v.string(),
    branch: v.string(),
    deployedBy: v.id("agents"),
    deployedAt: v.number(),
    errorMessage: v.optional(v.string()),
  })
    .index("by_environment", ["environment"])
    .index("by_status", ["status"])
    .index("by_deployed_at", ["deployedAt"]),

  // ============================================================
  // AI INTEGRATIONS (Strange's work)
  // ============================================================
  aiIntegrations: defineTable({
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("chatbot"),
      v.literal("recommendations"),
      v.literal("image_gen"),
      v.literal("embeddings")
    ),
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("custom")
    ),
    config: v.object({
      model: v.optional(v.string()),
      apiEndpoint: v.optional(v.string()),
      maxTokens: v.optional(v.number()),
      temperature: v.optional(v.number()),
    }),
    status: v.union(
      v.literal("planning"),
      v.literal("implemented"),
      v.literal("tested")
    ),
    createdAt: v.number(),
    testedAt: v.optional(v.number()),
  })
    .index("by_task", ["taskId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),

  // ============================================================
  // PULL REQUESTS (GitHub Integration)
  // ============================================================
  pullRequests: defineTable({
    taskId: v.id("tasks"),
    number: v.number(), // GitHub PR number
    url: v.string(),
    title: v.string(),
    branch: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("approved"),
      v.literal("changes_requested"),
      v.literal("merged"),
      v.literal("closed")
    ),
    author: v.id("agents"),
    reviewers: v.array(v.id("agents")),
    ciStatus: v.union(
      v.literal("pending"),
      v.literal("passing"),
      v.literal("failing")
    ),
    filesChanged: v.number(),
    additions: v.number(),
    deletions: v.number(),
    createdAt: v.number(),
    mergedAt: v.optional(v.number()),
  })
    .index("by_task", ["taskId"])
    .index("by_status", ["status"])
    .index("by_author", ["author"])
    .index("by_created_at", ["createdAt"]),
});
