/**
 * React hooks for the Swarm Store
 * 
 * useSyncExternalStore for tear-free reads from the singleton store.
 */

'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { getSwarmStore, type SwarmStats, type SwarmAgent, type SwarmJob, type SwarmActivity } from './swarm-store';

function useSwarmSelector<T>(selector: () => T): T {
  const store = getSwarmStore();
  const getSnapshot = useCallback(() => {
    // Return a new reference so React detects changes
    return JSON.stringify(selector());
  }, [selector]);

  const raw = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    getSnapshot,
    getSnapshot, // server snapshot (SSR)
  );

  return JSON.parse(raw) as T;
}

export function useSwarmAgents(): SwarmAgent[] {
  return useSwarmSelector(() => getSwarmStore().getAgents());
}

export function useSwarmJobs(): SwarmJob[] {
  return useSwarmSelector(() => getSwarmStore().getJobs());
}

export function useSwarmActiveJobs(): SwarmJob[] {
  return useSwarmSelector(() => getSwarmStore().getActiveJobs());
}

export function useSwarmActivities(limit = 30): SwarmActivity[] {
  return useSwarmSelector(() => getSwarmStore().getActivities(limit));
}

export function useSwarmStats(): SwarmStats {
  return useSwarmSelector(() => getSwarmStore().getStats());
}

export function useSwarmStore() {
  return getSwarmStore();
}
