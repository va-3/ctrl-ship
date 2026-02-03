# CTRL+Ship ⌨️→🚀

**AI-powered website builder with a 5-agent swarm pipeline.** Describe what you want, answer a few smart questions, and watch your site get built in real-time.

🔗 **Live:** [web-production-2ee2f.up.railway.app](https://web-production-2ee2f.up.railway.app)

---

## What It Does

Type a prompt → AI analyzes your intent, generates a custom design system, plans content, writes production HTML, and runs quality checks — all streamed live so you watch it happen.

**5-Stage Pipeline:**
1. **🎯 Nova** — Intent Analyzer: Classifies site type, mood, extracts image keywords, subject details
2. **🎨 Prism** — Design Architect: Generates a full design system (colors, fonts, spacing, effects)
3. **📝 Echo** — Content Planner: Writes all copy, structures sections, plans layout patterns
4. **⚡ Forge** — Code Builder: Streams production HTML constrained by design system + content plan
5. **✨ Sentinel** — Quality Validator: 20+ automated checks, auto-fix, optional LLM review

## Features

- **Live Streaming Preview** — Watch code appear on the left, see it render on the right in real-time
- **Smart Clarifying Questions** — Scale to prompt detail: vague prompts get 4 questions, detailed ones get 1-2
- **Progressive Pipeline Preview** — Animated skeleton that evolves through stages (colors, fonts, sections appear live)
- **Two Quality Tiers** — Fast (⚡100 credits, 2 agents, ~30s) and Best (👑250 credits, 5 agents, ~2min)
- **One-Click Deploy** — Sites deployed and served at public URLs
- **Credit System** — 1,000 starting credits, owner mode for unlimited
- **Mobile-First** — Full responsive design with tabbed Preview/Chat layout on mobile
- **Live Build Timer** — Real-time counter showing build progress
- **Subject-Specific Images** — AI extracts image keywords from your prompt for contextually relevant photos

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **AI:** Claude Sonnet 4.5 via direct Anthropic API with prompt caching
- **Styling:** Tailwind CSS + CSS custom properties theming (light/dark mode)
- **Font:** Space Grotesk (display) + Inter/DM Sans (body)
- **Hosting:** Railway (persistent server, no timeout limits)
- **State:** Client-side stores via `useSyncExternalStore` (credits, swarm)

## Architecture

```
app/
├── page.tsx              # Homepage with prompt input + templates
├── workspace/page.tsx    # Build workspace (preview + chat)
├── monitor/page.tsx      # Agent swarm dashboard
├── templates/page.tsx    # Template gallery
├── api/
│   ├── clarify/          # Smart question generation
│   ├── generate-site/    # Pipeline POST endpoint
│   │   └── stream/       # SSE streaming endpoint
│   ├── chat/             # Iteration/plan mode
│   └── deploy/           # Site deployment
└── sites/[slug]/         # Deployed site serving

lib/generation/
├── types.ts              # Full TypeScript types
├── gateway.ts            # Direct Anthropic API client with prompt caching
├── stage1-intent.ts      # Intent classification (15 site types, 10 moods)
├── stage2-design.ts      # Design system generation
├── stage3-content.ts     # Content planning
├── stage4-codegen.ts     # HTML generation (streaming)
├── stage5-quality.ts     # Validation + auto-fix
├── pipeline.ts           # Orchestrator (parallel stages 2+3)
└── template-themes.ts    # 10 pre-built design systems

components/
├── BuildWorkspace.tsx    # Main workspace (mobile-responsive tabbed layout)
├── LiveCodePreview.tsx   # Split code/preview with streaming
├── PipelinePreview.tsx   # Progressive skeleton during planning stages
├── ClarifyingQuestions.tsx # Claude Code-style pill options
├── AnimatedHero.tsx      # Dual-cycling word animation
├── NavBar.tsx            # Pill-style navigation
├── WorkspaceNav.tsx      # Workspace toolbar with live timer
└── ...15+ more components
```

## Cost Per Generation

| Tier | LLM Calls | Estimated Cost | Time |
|------|-----------|---------------|------|
| Fast ⚡ | 2 (intent + codegen) | ~$0.23 | ~30-60s |
| Best 👑 | 5 (all stages) | ~$0.55 | ~2-3min |

Prompt caching reduces repeated system prompt costs by ~90%.

## Local Development

```bash
# Install dependencies
npm install

# Set environment variable
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# Run dev server
npm run dev

# Build for production
npm run build && npm start
```

## Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Set `ANTHROPIC_API_KEY` and `PORT=3000` as environment variables in Railway dashboard.

## Built in 2 Days

This entire application — pipeline architecture, 5-stage generation, live streaming preview, mobile-responsive UI, credit system, deploy system, and Railway deployment — was built from scratch in 2 days (Feb 1-2, 2026) using AI-assisted development.

## License

MIT
