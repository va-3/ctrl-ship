import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Agent Coordination Functions
 * 
 * Manages agent lifecycle: spawn, pause, heartbeat, assignment
 */

// ============================================================
// QUERIES
// ============================================================

/**
 * List all agents with current status
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

/**
 * Get agent by name
 */
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
  },
});

/**
 * Get active agents
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

/**
 * Get agent's current task
 */
export const getCurrentTask = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    const agent = await ctx.db.get(agentId);
    if (!agent || !agent.currentTaskId) return null;
    
    return await ctx.db.get(agent.currentTaskId);
  },
});

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Spawn an agent (on-demand mode)
 */
export const spawn = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    sessionKey: v.optional(v.string()),
    expertise: v.array(v.string()),
    model: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if agent already exists
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      // Agent already exists, just activate it
      await ctx.db.patch(existing._id, {
        status: "active",
        spawnedAt: Date.now(),
        lastHeartbeat: Date.now(),
      });

      // Log activity
      await ctx.db.insert("activities", {
        type: "agent_spawned",
        agentName: args.name,
        description: `${args.name} (${args.role}) spawned`,
        metadata: {},
        timestamp: Date.now(),
      });

      return existing._id;
    }

    // Create new agent
    const agentId = await ctx.db.insert("agents", {
      name: args.name,
      role: args.role,
      status: "active",
      sessionKey: args.sessionKey || `session-${args.name.toLowerCase()}-${Date.now()}`,
      expertise: args.expertise,
      githubUsername: args.githubUsername,
      lastHeartbeat: Date.now(),
      spawnedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "agent_spawned",
      agentName: args.name,
      description: `${args.name} (${args.role}) spawned`,
      metadata: {},
      timestamp: Date.now(),
    });

    return agentId;
  },
});

/**
 * Pause an agent (on-demand mode)
 */
export const pause = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    const agent = await ctx.db.get(agentId);
    if (!agent) throw new Error("Agent not found");

    await ctx.db.patch(agentId, {
      status: "paused",
      pausedAt: Date.now(),
      currentTaskId: undefined,
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "agent_paused",
      agentName: agent.name,
      description: `${agent.name} paused`,
      metadata: {},
      timestamp: Date.now(),
    });
  },
});

/**
 * Update agent heartbeat
 */
export const heartbeat = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    await ctx.db.patch(agentId, {
      lastHeartbeat: Date.now(),
    });
  },
});

/**
 * Assign task to agent
 */
export const assignTask = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { agentId, taskId }) => {
    const agent = await ctx.db.get(agentId);
    const task = await ctx.db.get(taskId);

    if (!agent) throw new Error("Agent not found");
    if (!task) throw new Error("Task not found");

    // Update agent
    await ctx.db.patch(agentId, {
      currentTaskId: taskId,
      status: "active",
    });

    // Update task
    const assignees = task.assignedTo.includes(agent.name)
      ? task.assignedTo
      : [...task.assignedTo, agent.name];

    await ctx.db.patch(taskId, {
      assignedTo: assignees,
      status: "dev",
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "task_assigned",
      agentName: agent.name,
      taskId,
      description: `${agent.name} assigned to "${task.title}"`,
      metadata: {},
      timestamp: Date.now(),
    });
  },
});

/**
 * Complete task for agent
 */
export const completeTask = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    await ctx.db.patch(agentId, {
      currentTaskId: undefined,
      status: "idle",
    });
  },
});

/**
 * Set agent status
 */
export const setStatus = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked"),
      v.literal("paused")
    ),
  },
  handler: async (ctx, { agentId, status }) => {
    await ctx.db.patch(agentId, { status });
  },
});
