#!/usr/bin/env node
/**
 * Agent Coordinator
 * Manages task assignment and inter-agent communication
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// Load .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not set in .env.local");
  process.exit(1);
}
const client = new ConvexHttpClient(CONVEX_URL);

interface TaskAssignment {
  feature: string;
  description: string;
  assignedTo: string[];
  priority: "urgent" | "high" | "medium" | "low";
}

async function createTask(assignment: TaskAssignment) {
  console.log(`\n📋 Creating task: ${assignment.feature}`);
  console.log(`   Description: ${assignment.description}`);
  console.log(`   Assigned to: ${assignment.assignedTo.join(", ")}`);
  console.log(`   Priority: ${assignment.priority}`);

  try {
    const taskId = await client.mutation(api.tasks.create, {
      title: assignment.feature,
      description: assignment.description,
      type: "feature" as const,
      priority: assignment.priority,
      assignedTo: assignment.assignedTo,
      project: "mission-control",
      createdBy: "Jarvis",
      estimatedHours: 2,
    });

    console.log(`✅ Task created: ${taskId}\n`);
    return taskId;
  } catch (error) {
    console.error(`❌ Failed to create task:`, error);
    throw error;
  }
}

async function sendMessage(params: {
  from: string;
  to: string;
  content: string;
  taskId?: Id<"tasks">;
}) {
  console.log(`💬 ${params.from} → ${params.to}: ${params.content}`);

  try {
    await client.mutation(api.messages.send, {
      fromAgent: params.from,
      toAgent: params.to,
      content: params.content,
      taskId: params.taskId,
      mentions: [params.to],
    });

    console.log(`✅ Message sent\n`);
  } catch (error) {
    console.error(`❌ Failed to send message:`, error);
    throw error;
  }
}

async function logActivity(params: {
  agentName: string;
  type: string;
  description: string;
  taskId?: Id<"tasks">;
}) {
  try {
    await client.mutation(api.activities.log, {
      agentName: params.agentName,
      activityType: params.type as any,
      description: params.description,
      taskId: params.taskId,
      metadata: {},
    });
  } catch (error) {
    console.error(`⚠️ Failed to log activity:`, error);
  }
}

async function runPOC() {
  console.log("🚀 Phase 2 POC: Jarvis + Tony Coordination Test\n");
  console.log("=" .repeat(60));

  // Step 1: Create a simple task
  console.log("\n📌 Step 1: Task Assignment");
  const taskId = await createTask({
    feature: "Dark Mode Toggle",
    description: "Add a dark mode toggle button to the dashboard header. Use Tailwind dark: classes. Store preference in localStorage.",
    assignedTo: ["Tony"],
    priority: "medium",
  });

  await logActivity({
    agentName: "Jarvis",
    type: "task_assigned",
    description: "Assigned 'Dark Mode Toggle' to Tony",
    taskId,
  });

  // Step 2: Jarvis messages Tony
  console.log("\n📌 Step 2: Inter-Agent Communication");
  await sendMessage({
    from: "Jarvis",
    to: "Tony",
    content: "@Tony - New task assigned: Dark Mode Toggle. Please implement a toggle button in the dashboard header using Tailwind dark mode. Store preference in localStorage. Let me know when ready for review.",
    taskId,
  });

  await logActivity({
    agentName: "Jarvis",
    type: "message_sent",
    description: "Notified Tony about Dark Mode Toggle task",
    taskId,
  });

  // Step 3: Tony acknowledges (simulated)
  console.log("\n📌 Step 3: Agent Response (Simulated)");
  await sendMessage({
    from: "Tony",
    to: "Jarvis",
    content: "@Jarvis - Acknowledged. Starting work on Dark Mode Toggle. Will implement in components/Header.tsx with useLocalStorage hook. ETA: 30 minutes.",
    taskId,
  });

  await logActivity({
    agentName: "Tony",
    type: "task_started",
    description: "Started implementation of Dark Mode Toggle",
    taskId,
  });

  // Step 4: Update task status
  console.log("\n📌 Step 4: Task Status Update");
  await client.mutation(api.tasks.updateStatus, {
    taskId,
    status: "dev" as const,
  });

  console.log(`✅ Task status → dev\n`);

  await logActivity({
    agentName: "Tony",
    type: "status_update",
    description: "Task status updated to in_progress",
    taskId,
  });

  console.log("=" .repeat(60));
  console.log("\n✅ Phase 2 POC Complete!\n");
  console.log("Verification:");
  console.log("  ✅ Task created in Convex");
  console.log("  ✅ Messages sent between agents");
  console.log("  ✅ Activities logged for audit trail");
  console.log("  ✅ Task status updated");
  console.log("\nNext: View dashboard at http://localhost:3001/dashboard");
  console.log("      Check activities feed for real-time updates\n");
}

// CLI commands
async function main() {
  const command = process.argv[2];

  switch (command) {
    case "poc":
      await runPOC();
      break;

    case "task":
      const feature = process.argv[3];
      const description = process.argv[4];
      const assignee = process.argv[5];
      if (!feature || !description || !assignee) {
        console.error("Usage: npm run coordinator task <feature> <description> <assignee>");
        process.exit(1);
      }
      await createTask({
        feature,
        description,
        assignedTo: [assignee],
        priority: "medium",
      });
      break;

    case "message":
      const from = process.argv[3];
      const to = process.argv[4];
      const content = process.argv[5];
      if (!from || !to || !content) {
        console.error("Usage: npm run coordinator message <from> <to> <content>");
        process.exit(1);
      }
      await sendMessage({ from, to, content });
      break;

    default:
      console.log("Available commands:");
      console.log("  poc              - Run Phase 2 POC (Jarvis + Tony coordination)");
      console.log("  task             - Create a new task");
      console.log("  message          - Send a message between agents");
      process.exit(1);
  }
}

main();
