# Mission Control Deployment Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Convex account (free tier available)

## Step 1: Deploy Convex Backend

```bash
cd /Users/vishnuanapalli/.openclaw/workspace/agent-swarm/mission-control
npx convex dev
```

This will:
1. Open browser for authentication
2. Create a new Convex project (or select existing)
3. Deploy the database schema
4. Generate the Convex URL

**Important:** Copy the Convex URL when prompted.

## Step 2: Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Convex URL:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

## Step 3: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 to see Mission Control.

## Step 4: Deploy to Vercel (Production)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

## Database Schema

The following tables are automatically created:

- **agents** - Agent status and coordination
- **tasks** - Development tasks
- **messages** - Agent communication
- **activities** - Audit trail
- **documents** - Specs, designs, docs
- **testResults** - Test coverage
- **deployments** - Deploy history
- **aiIntegrations** - AI feature configs
- **pullRequests** - GitHub PR tracking

## Usage

### Spawn an Agent

```typescript
// In OpenClaw session
await convex.mutation(api.agents.spawn, {
  name: "Jarvis",
  role: "Tech Lead",
  sessionKey: "agent:jarvis:main",
  expertise: ["coordination", "architecture", "code-review"],
  githubUsername: "jarvis-bot"
});
```

### Create a Task

```typescript
await convex.mutation(api.tasks.create, {
  title: "Add dark mode toggle",
  description: "Implement dark mode with Tailwind...",
  type: "feature",
  priority: "medium",
  project: "main-app",
  createdBy: "user"
});
```

### View Real-Time Updates

Mission Control automatically updates in real-time as:
- Agents spawn/pause
- Tasks are created/assigned
- Activities are logged
- Tests run
- Deployments occur

## Architecture

```
mission-control/
├── app/
│   ├── page.tsx          # Main dashboard
│   └── layout.tsx        # Root layout with Convex provider
├── components/
│   ├── AgentCard.tsx     # Agent status card
│   ├── TaskList.tsx      # Task queue display
│   ├── ActivityFeed.tsx  # Real-time activity log
│   ├── StatsOverview.tsx # System stats
│   └── ConvexProvider.tsx # Convex client wrapper
└── convex/
    ├── schema.ts         # Database schema
    ├── agents.ts         # Agent queries/mutations
    ├── tasks.ts          # Task queries/mutations
    └── activities.ts     # Activity logging

```

## Next Steps

1. ✅ Deploy Convex backend (`npx convex dev`)
2. ✅ Configure `.env.local` with Convex URL
3. ✅ Start dev server (`npm run dev`)
4. ⏳ Spawn first agent (Jarvis)
5. ⏳ Create first task
6. ⏳ Watch Mission Control update in real-time!

---

**Created:** 2026-02-01
**Status:** Ready for deployment
