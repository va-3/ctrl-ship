import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Send a message between agents
 */
export const send = mutation({
  args: {
    fromAgent: v.string(),
    toAgent: v.string(),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
    mentions: v.optional(v.array(v.string())),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.string(),
          url: v.string(),
          name: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      fromAgent: args.fromAgent,
      toAgent: args.toAgent,
      content: args.content,
      taskId: args.taskId,
      mentions: args.mentions || [],
      attachments: args.attachments || [],
      read: false,
      timestamp: Date.now(),
    });

    return messageId;
  },
});

/**
 * Get messages for an agent (inbox)
 */
export const getInbox = query({
  args: {
    agentName: v.string(),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let messagesQuery = ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("toAgent"), args.agentName))
      .order("desc");

    const messages = await messagesQuery.collect();

    if (args.unreadOnly) {
      return messages.filter((m) => !m.read);
    }

    return messages;
  },
});

/**
 * Get messages for a task (conversation thread)
 */
export const getByTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("taskId"), args.taskId))
      .order("asc")
      .collect();
  },
});

/**
 * Mark message as read
 */
export const markRead = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { read: true });
  },
});

/**
 * Get conversation between two agents
 */
export const getConversation = query({
  args: {
    agent1: v.string(),
    agent2: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages").collect();

    return messages
      .filter(
        (m) =>
          (m.fromAgent === args.agent1 && m.toAgent === args.agent2) ||
          (m.fromAgent === args.agent2 && m.toAgent === args.agent1)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  },
});
