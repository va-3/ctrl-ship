/**
 * Credits Store — Client-side credit system
 * 
 * - Everyone starts with 1,000 credits
 * - Fast build = 100 credits (2 agents: Nova + Forge)
 * - Best build = 250 credits (all 5 agents)
 * - Owner gets unlimited credits
 * - Persists to localStorage
 */

type Listener = () => void;

export const TIER_COSTS = {
  fast: 100,
  best: 250,
} as const;

export type CreditTier = keyof typeof TIER_COSTS;

const INITIAL_CREDITS = 1000;
const STORAGE_KEY = 'ctrlship-credits';

// Owner detection — in production this would be auth-based.
// For now, owner is identified by a localStorage flag.
const OWNER_KEY = 'ctrlship-owner';

class CreditsStore {
  private credits: number;
  private totalSpent: number;
  private generationCount: number;
  private listeners: Set<Listener> = new Set();

  constructor() {
    const saved = this.loadFromStorage();
    this.credits = saved?.credits ?? INITIAL_CREDITS;
    this.totalSpent = saved?.totalSpent ?? 0;
    this.generationCount = saved?.generationCount ?? 0;
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

  // ── Reads ──

  getCredits(): number {
    return this.isOwner() ? Infinity : this.credits;
  }

  getRawCredits(): number {
    return this.credits;
  }

  getTotalSpent(): number {
    return this.totalSpent;
  }

  getGenerationCount(): number {
    return this.generationCount;
  }

  isOwner(): boolean {
    try {
      return localStorage.getItem(OWNER_KEY) === 'true';
    } catch {
      return false;
    }
  }

  canAfford(tier: CreditTier): boolean {
    if (this.isOwner()) return true;
    return this.credits >= TIER_COSTS[tier];
  }

  getCostForTier(tier: CreditTier): number {
    return TIER_COSTS[tier];
  }

  // ── Writes ──

  /** Deduct credits for a generation. Returns false if insufficient. */
  deduct(tier: CreditTier): boolean {
    if (this.isOwner()) {
      this.generationCount++;
      this.notify();
      return true;
    }

    const cost = TIER_COSTS[tier];
    if (this.credits < cost) return false;

    this.credits -= cost;
    this.totalSpent += cost;
    this.generationCount++;
    this.notify();
    return true;
  }

  /** Refund credits (e.g., on generation failure) */
  refund(tier: CreditTier): void {
    if (this.isOwner()) return;
    const cost = TIER_COSTS[tier];
    this.credits += cost;
    this.totalSpent -= cost;
    this.generationCount = Math.max(0, this.generationCount - 1);
    this.notify();
  }

  /** Set owner mode (for testing / admin) */
  setOwner(isOwner: boolean): void {
    try {
      if (isOwner) {
        localStorage.setItem(OWNER_KEY, 'true');
      } else {
        localStorage.removeItem(OWNER_KEY);
      }
      this.notify();
    } catch { /* localStorage not available */ }
  }

  /** Reset credits to initial value */
  reset(): void {
    this.credits = INITIAL_CREDITS;
    this.totalSpent = 0;
    this.generationCount = 0;
    this.notify();
  }

  // ── Persistence ──

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        credits: this.credits,
        totalSpent: this.totalSpent,
        generationCount: this.generationCount,
      }));
    } catch { /* quota errors */ }
  }

  private loadFromStorage(): { credits: number; totalSpent: number; generationCount: number } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

// ── Singleton ──
let _store: CreditsStore | null = null;

export function getCreditsStore(): CreditsStore {
  if (!_store) {
    _store = new CreditsStore();
  }
  return _store;
}
