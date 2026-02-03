import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Task Management Functions
 * 
 * Create, update, search, and manage development tasks
 */

// ============================================================
// QUERIES
// ============================================================

/**
 * List all tasks with filters
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("inbox"),
        v.literal("planning"),
        v.literal("dev"),
        v.literal("testing"),
        v.literal("review"),
        v.literal("merged"),
        v.literal("deployed")
      )
    ),
    project: v.optional(v.string()),
  },
  handler: async (ctx, { status, project }) => {
    if (status && project) {
      // Both filters - do sequential
      const allTasks = await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
      return allTasks.filter((task) => task.project === project);
    } else if (status) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    } else if (project) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("project", project))
        .collect();
    } else {
      return await ctx.db.query("tasks").collect();
    }
  },
});

/**
 * Get task by ID
 */
export const get = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    return await ctx.db.get(taskId);
  },
});

/**
 * Get inbox tasks (for dashboard)
 */
export const getInbox = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "inbox"))
      .collect();
  },
});

/**
 * Search tasks by title
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    return await ctx.db
      .query("tasks")
      .withSearchIndex("search_title", (q) => q.search("title", query))
      .collect();
  },
});

/**
 * Get tasks assigned to agent
 */
export const getByAgent = query({
  args: { agentName: v.string() },
  handler: async (ctx, { agentName }) => {
    const allTasks = await ctx.db.query("tasks").collect();
    return allTasks.filter((task) => task.assignedTo.includes(agentName));
  },
});

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Create a new task
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("feature"),
      v.literal("bug"),
      v.literal("refactor"),
      v.literal("docs"),
      v.literal("test")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    assignedTo: v.optional(v.array(v.string())),
    labels: v.optional(v.array(v.string())),
    project: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    estimatedHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      type: args.type,
      priority: args.priority,
      status: "inbox",
      project: args.project || "mission-control",
      createdBy: args.createdBy || "system",
      assignedTo: args.assignedTo || [],
      dependencies: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedHours: args.estimatedHours,
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "task_created",
      taskId,
      agentName: args.createdBy || "system",
      description: `Task created: "${args.title}"`,
      metadata: {},
      timestamp: Date.now(),
    });

    return taskId;
  },
});

/**
 * Create multiple tasks at once (batch creation)
 * Used by AI generation to create all tasks for a project
 */
export const createBatch = mutation({
  args: {
    tasks: v.array(v.object({
      title: v.string(),
      description: v.string(),
      assignedAgent: v.string(),
      type: v.string(),
      priority: v.optional(v.string()),
      estimatedHours: v.optional(v.number()),
      dependencies: v.optional(v.array(v.string())),
      projectName: v.string(),
    })),
  },
  handler: async (ctx, { tasks }) => {
    const taskIds: any[] = [];
    const taskTitleToId = new Map<string, any>();
    
    // First pass: Create all tasks
    for (const task of tasks) {
      const id = await ctx.db.insert("tasks", {
        title: task.title,
        description: task.description,
        assignedTo: [task.assignedAgent],
        type: task.type as any,
        priority: (task.priority || "medium") as any,
        estimatedHours: task.estimatedHours || 0,
        dependencies: [], // Will be filled in second pass
        project: task.projectName,
        status: "inbox",
        createdBy: "AI (Sonnet)",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      taskIds.push(id);
      taskTitleToId.set(task.title, id);
    }
    
    // Second pass: Update dependencies using task IDs
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (task.dependencies && task.dependencies.length > 0) {
        const dependencyIds = task.dependencies
          .map(depTitle => taskTitleToId.get(depTitle))
          .filter(Boolean);
        
        if (dependencyIds.length > 0) {
          await ctx.db.patch(taskIds[i], {
            dependencies: dependencyIds,
          });
        }
      }
    }
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "task_created",
      taskId: taskIds[0],
      agentName: "AI (Sonnet)",
      description: `Batch created ${tasks.length} tasks for project "${tasks[0].projectName}"`,
      metadata: { 
        testResults: { taskCount: tasks.length } 
      },
      timestamp: Date.now(),
    });
    
    return { taskIds };
  }
});

/**
 * Update task status
 */
export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("inbox"),
      v.literal("planning"),
      v.literal("dev"),
      v.literal("testing"),
      v.literal("review"),
      v.literal("merged"),
      v.literal("deployed")
    ),
  },
  handler: async (ctx, { taskId, status }) => {
    await ctx.db.patch(taskId, {
      status,
      updatedAt: Date.now(),
      ...(status === "deployed" && { completedAt: Date.now() }),
    });
  },
});

/**
 * Add PR to task
 */
export const addPR = mutation({
  args: {
    taskId: v.id("tasks"),
    prUrl: v.string(),
    branch: v.string(),
    agentName: v.optional(v.string()),
  },
  handler: async (ctx, { taskId, prUrl, branch, agentName }) => {
    await ctx.db.patch(taskId, {
      githubPR: prUrl,
      branch,
      status: "review",
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "pr_opened",
      taskId,
      agentName: agentName || "system",
      description: `PR opened: ${prUrl}`,
      metadata: { prUrl },
      timestamp: Date.now(),
    });
  },
});

/**
 * Add dependency to task
 */
export const addDependency = mutation({
  args: {
    taskId: v.id("tasks"),
    dependsOnId: v.id("tasks"),
  },
  handler: async (ctx, { taskId, dependsOnId }) => {
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    const dependencies = task.dependencies.includes(dependsOnId)
      ? task.dependencies
      : [...task.dependencies, dependsOnId];

    await ctx.db.patch(taskId, {
      dependencies,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update actual hours
 */
export const updateActualHours = mutation({
  args: {
    taskId: v.id("tasks"),
    hours: v.number(),
  },
  handler: async (ctx, { taskId, hours }) => {
    await ctx.db.patch(taskId, {
      actualHours: hours,
      updatedAt: Date.now(),
    });
  },
});
