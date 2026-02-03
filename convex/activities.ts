import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const recent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("activities")
      .order("desc")
      .take(limit);
  },
});

export const log = mutation({
  args: {
    activityType: v.union(
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
    description: v.string(),
    agentName: v.string(),
    taskId: v.optional(v.id("tasks")),
    metadata: v.optional(v.object({
      commitHash: v.optional(v.string()),
      prUrl: v.optional(v.string()),
      deployUrl: v.optional(v.string()),
      testResults: v.optional(v.any()),
      errorMessage: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      type: args.activityType,
      description: args.description,
      agentName: args.agentName,
      taskId: args.taskId,
      metadata: args.metadata ?? {},
      timestamp: Date.now(),
    });
  },
});

export const getByAgent = query({
  args: {
    agentName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("agentName"), args.agentName))
      .order("desc")
      .take(limit);
  },
});

export const getByTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("taskId"), args.taskId))
      .order("desc")
      .collect();
  },
});
