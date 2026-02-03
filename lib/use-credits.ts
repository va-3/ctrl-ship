'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { getCreditsStore, type CreditTier, TIER_COSTS } from './credits-store';

export function useCredits() {
  const store = getCreditsStore();

  const credits = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getCredits(),
    () => 1000, // SSR fallback
  );

  const rawCredits = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getRawCredits(),
    () => 1000,
  );

  const totalSpent = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getTotalSpent(),
    () => 0,
  );

  const generationCount = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getGenerationCount(),
    () => 0,
  );

  const isOwner = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.isOwner(),
    () => false,
  );

  const canAfford = useCallback((tier: CreditTier) => store.canAfford(tier), [store]);
  const deduct = useCallback((tier: CreditTier) => store.deduct(tier), [store]);
  const refund = useCallback((tier: CreditTier) => store.refund(tier), [store]);

  return {
    credits,
    rawCredits,
    totalSpent,
    generationCount,
    isOwner,
    canAfford,
    deduct,
    refund,
    tierCosts: TIER_COSTS,
  };
}
