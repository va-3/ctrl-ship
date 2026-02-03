/**
 * Swarm Store — Global client-side state for the agent swarm
 * 
 * Replaces Convex for the dashboard. Tracks:
 * - Active agents and their current tasks
 * - Pipeline jobs (queued, active, completed)
 * - Activity feed (real-time log of events)
 * - Stats (derived from the above)
 * 
 * This is an in-memory store with React hooks.
 * Persists to sessionStorage so dashboard survives page navigation.
 */

type AgentId = string;
type JobId = string;

export interface SwarmAgent {
  id: AgentId;
  name: string;
  role: string;
  model: string;
  status: 'idle' | 'active' | 'busy' | 'error';
  currentTask?: string;
  currentJobId?: JobId;
  expertise: string[];
  stageProgress?: string; // e.g., "intent", "design", "codegen"
  startedAt?: number;
  completedTasks: number;
  totalDurationMs: number;
  lastActiveAt: number;
  icon: string; // emoji
  color: string;
}

export interface SwarmJob {
  id: JobId;
  prompt: string;
  tier: string;
  model: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  assignedAgents: AgentId[];
  currentStage?: string;
  stages: {
    name: string;
    status: 'pending' | 'active' | 'done' | 'skipped' | 'error';
    durationMs?: number;
    detail?: string;
  }[];
  qualityScore?: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface SwarmActivity {
  id: string;
  type: 'agent_spawned' | 'agent_idle' | 'job_started' | 'job_completed' | 'job_failed' | 'stage_started' | 'stage_completed' | 'quality_check';
  agentName?: string;
  agentIcon?: string;
  description: string;
  timestamp: number;
  accent: string;
}

export interface SwarmStats {
  activeAgents: number;
  totalAgents: number;
  queuedJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgQualityScore: number;
  avgDurationMs: number;
  systemStatus: 'operational' | 'degraded' | 'error';
}

type Listener = () => void;

// ── Default Agents (the swarm) ──────────────────────────────────────────

const DEFAULT_AGENTS: SwarmAgent[] = [
  {
    id: 'nova',
    name: 'Nova',
    role: 'Strategy & Intent',
    model: 'claude-sonnet-4-5',
    status: 'idle',
    expertise: ['intent classification', 'design systems', 'UX strategy', 'color theory'],
    completedTasks: 0,
    totalDurationMs: 0,
    lastActiveAt: Date.now(),
    icon: '/agents/nova.png',
    color: '#06b6d4',
  },
  {
    id: 'prism',
    name: 'Prism',
    role: 'Visual Design',
    model: 'claude-sonnet-4-5',
    status: 'idle',
    expertise: ['typography', 'color palettes', 'layout composition', 'animations'],
    completedTasks: 0,
    totalDurationMs: 0,
    lastActiveAt: Date.now(),
    icon: '/agents/prism.png',
    color: '#a78bfa',
  },
  {
    id: 'echo',
    name: 'Echo',
    role: 'Content & Copy',
    model: 'claude-sonnet-4-5',
    status: 'idle',
    expertise: ['copywriting', 'content strategy', 'SEO', 'microcopy'],
    completedTasks: 0,
    totalDurationMs: 0,
    lastActiveAt: Date.now(),
    icon: '/agents/echo.png',
    color: '#f59e0b',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Quality Assurance',
    model: 'claude-sonnet-4-5',
    status: 'idle',
    expertise: ['code review', 'quality validation', 'performance', 'best practices'],
    completedTasks: 0,
    totalDurationMs: 0,
    lastActiveAt: Date.now(),
    icon: '/agents/sentinel.png',
    color: '#10b981',
  },
  {
    id: 'forge',
    name: 'Forge',
    role: 'Code Generation',
    model: 'claude-sonnet-4-5',
    status: 'idle',
    expertise: ['HTML/CSS', 'Tailwind', 'responsive design', 'accessibility'],
    completedTasks: 0,
    totalDurationMs: 0,
    lastActiveAt: Date.now(),
    icon: '/agents/forge.png',
    color: '#3b82f6',
  },
];

// Map pipeline stages to which agent handles them
const STAGE_AGENT_MAP: Record<string, AgentId> = {
  intent: 'nova',
  design: 'prism',
  content: 'echo',
  codegen: 'forge',
  quality: 'sentinel',
};

// ── Store ───────────────────────────────────────────────────────────────

class SwarmStore {
  private agents: Map<AgentId, SwarmAgent> = new Map();
  private jobs: Map<JobId, SwarmJob> = new Map();
  private activities: SwarmActivity[] = [];
  private listeners: Set<Listener> = new Set();
  private jobCounter = 0;
  private activityCounter = 0;

  constructor() {
    this.loadFromStorage();
    if (this.agents.size === 0) {
      DEFAULT_AGENTS.forEach(a => this.agents.set(a.id, { ...a }));
    }
  }

  // ── Subscriptions ──

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
    this.saveToStorage();
  }

  // ── Persistence ──

  private saveToStorage() {
    try {
      const state = {
        agents: Array.from(this.agents.entries()),
        jobs: Array.from(this.jobs.entries()),
        activities: this.activities.slice(-100), // keep last 100
        jobCounter: this.jobCounter,
        activityCounter: this.activityCounter,
      };
      sessionStorage.setItem('swarm-store', JSON.stringify(state));
    } catch { /* quota errors etc */ }
  }

  private loadFromStorage() {
    try {
      const raw = sessionStorage.getItem('swarm-store');
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.agents) this.agents = new Map(state.agents);
      if (state.jobs) this.jobs = new Map(state.jobs);
      if (state.activities) this.activities = state.activities;
      if (state.jobCounter) this.jobCounter = state.jobCounter;
      if (state.activityCounter) this.activityCounter = state.activityCounter;
    } catch { /* corrupted storage */ }
  }

  // ── Reads ──

  getAgents(): SwarmAgent[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: AgentId): SwarmAgent | undefined {
    return this.agents.get(id);
  }

  getJobs(): SwarmJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getActiveJobs(): SwarmJob[] {
    return this.getJobs().filter(j => j.status === 'running' || j.status === 'queued');
  }

  getCompletedJobs(): SwarmJob[] {
    return this.getJobs().filter(j => j.status === 'completed');
  }

  getActivities(limit = 30): SwarmActivity[] {
    return this.activities.slice(-limit).reverse();
  }

  getStats(): SwarmStats {
    const agents = this.getAgents();
    const jobs = this.getJobs();
    const completed = jobs.filter(j => j.status === 'completed');
    const failed = jobs.filter(j => j.status === 'failed');
    const running = jobs.filter(j => j.status === 'running');
    const queued = jobs.filter(j => j.status === 'queued');

    const scores = completed.filter(j => j.qualityScore != null).map(j => j.qualityScore!);
    const durations = completed.filter(j => j.completedAt && j.startedAt).map(j => j.completedAt! - j.startedAt!);

    return {
      activeAgents: agents.filter(a => a.status === 'active' || a.status === 'busy').length,
      totalAgents: agents.length,
      queuedJobs: queued.length,
      runningJobs: running.length,
      completedJobs: completed.length,
      failedJobs: failed.length,
      avgQualityScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      avgDurationMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      systemStatus: failed.length > completed.length ? 'degraded' : 'operational',
    };
  }

  // ── Writes: Job lifecycle ──

  createJob(prompt: string, tier: string, model: string): JobId {
    const id = `job-${++this.jobCounter}-${Date.now()}`;
    const stageNames = tier === 'fast'
      ? ['intent', 'design', 'codegen', 'quality']
      : tier === 'balanced'
        ? ['intent', 'design', 'codegen', 'quality']
        : ['intent', 'design', 'content', 'codegen', 'quality'];

    const job: SwarmJob = {
      id,
      prompt,
      tier,
      model,
      status: 'queued',
      assignedAgents: [],
      stages: stageNames.map(name => ({
        name,
        status: 'pending',
      })),
      createdAt: Date.now(),
    };
    this.jobs.set(id, job);
    this.addActivity({
      type: 'job_started',
      description: `New ${tier} build queued: "${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}"`,
      accent: '#3b82f6',
    });
    this.notify();
    return id;
  }

  startJob(jobId: JobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = 'running';
    job.startedAt = Date.now();
    this.notify();
  }

  startStage(jobId: JobId, stageName: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.currentStage = stageName;

    const stage = job.stages.find(s => s.name === stageName);
    if (stage) stage.status = 'active';

    // Activate the corresponding agent
    const agentId = STAGE_AGENT_MAP[stageName];
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = 'active';
        agent.currentTask = `Processing: ${stageName}`;
        agent.currentJobId = jobId;
        agent.stageProgress = stageName;
        agent.startedAt = Date.now();
        if (!job.assignedAgents.includes(agentId)) {
          job.assignedAgents.push(agentId);
        }
        this.addActivity({
          type: 'stage_started',
          agentName: agent.name,
          agentIcon: agent.icon,
          description: `${agent.icon} ${agent.name} started ${stageName} stage`,
          accent: agent.color,
        });
      }
    }
    this.notify();
  }

  completeStage(jobId: JobId, stageName: string, durationMs?: number, detail?: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const stage = job.stages.find(s => s.name === stageName);
    if (stage) {
      stage.status = 'done';
      stage.durationMs = durationMs;
      stage.detail = detail;
    }

    // Set agent to idle
    const agentId = STAGE_AGENT_MAP[stageName];
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = 'idle';
        agent.currentTask = undefined;
        agent.currentJobId = undefined;
        agent.stageProgress = undefined;
        agent.completedTasks++;
        agent.totalDurationMs += durationMs || 0;
        agent.lastActiveAt = Date.now();
        this.addActivity({
          type: 'stage_completed',
          agentName: agent.name,
          agentIcon: agent.icon,
          description: `${agent.icon} ${agent.name} completed ${stageName}${durationMs ? ` in ${(durationMs / 1000).toFixed(1)}s` : ''}${detail ? ` — ${detail}` : ''}`,
          accent: '#10b981',
        });
      }
    }
    this.notify();
  }

  skipStage(jobId: JobId, stageName: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const stage = job.stages.find(s => s.name === stageName);
    if (stage) stage.status = 'skipped';
    this.notify();
  }

  failStage(jobId: JobId, stageName: string, error?: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const stage = job.stages.find(s => s.name === stageName);
    if (stage) stage.status = 'error';

    const agentId = STAGE_AGENT_MAP[stageName];
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = 'error';
        agent.currentTask = `Error: ${error?.substring(0, 50) || 'unknown'}`;
        this.addActivity({
          type: 'stage_completed',
          agentName: agent.name,
          agentIcon: agent.icon,
          description: `${agent.icon} ${agent.name} failed at ${stageName}: ${error?.substring(0, 80) || 'unknown error'}`,
          accent: '#ef4444',
        });
        // Reset agent after a moment
        setTimeout(() => {
          if (agent.status === 'error') {
            agent.status = 'idle';
            agent.currentTask = undefined;
            agent.currentJobId = undefined;
            this.notify();
          }
        }, 5000);
      }
    }
    this.notify();
  }

  completeJob(jobId: JobId, qualityScore?: number) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = 'completed';
    job.completedAt = Date.now();
    job.qualityScore = qualityScore;

    this.addActivity({
      type: 'job_completed',
      description: `✅ Build completed${qualityScore ? ` — Quality: ${qualityScore}/100` : ''} (${job.tier} tier)`,
      accent: '#10b981',
    });
    this.notify();
  }

  failJob(jobId: JobId, error?: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = 'failed';
    job.completedAt = Date.now();
    job.error = error;

    // Reset all active agents for this job
    job.assignedAgents.forEach(agentId => {
      const agent = this.agents.get(agentId);
      if (agent && agent.currentJobId === jobId) {
        agent.status = 'idle';
        agent.currentTask = undefined;
        agent.currentJobId = undefined;
      }
    });

    this.addActivity({
      type: 'job_failed',
      description: `❌ Build failed: ${error?.substring(0, 80) || 'unknown error'}`,
      accent: '#ef4444',
    });
    this.notify();
  }

  // Update agent model — currently Sonnet only
  setAgentModel(_model: string) {
    // All agents use Sonnet 4.5 — no switching needed
    this.agents.forEach(agent => {
      agent.model = 'claude-sonnet-4-5';
    });
    this.notify();
  }

  // Reset store (for testing)
  reset() {
    this.agents.clear();
    this.jobs.clear();
    this.activities = [];
    this.jobCounter = 0;
    this.activityCounter = 0;
    DEFAULT_AGENTS.forEach(a => this.agents.set(a.id, { ...a }));
    sessionStorage.removeItem('swarm-store');
    this.notify();
  }

  // ── Private ──

  private addActivity(partial: Omit<SwarmActivity, 'id' | 'timestamp'>) {
    this.activities.push({
      ...partial,
      id: `act-${++this.activityCounter}`,
      timestamp: Date.now(),
    });
    // Cap at 200
    if (this.activities.length > 200) {
      this.activities = this.activities.slice(-100);
    }
  }
}

// ── Singleton ──
let _store: SwarmStore | null = null;

export function getSwarmStore(): SwarmStore {
  if (!_store) {
    _store = new SwarmStore();
  }
  return _store;
}
