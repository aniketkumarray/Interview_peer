import { Badge } from '@/types';
import { ALL_BADGES } from './demo-store';

export function getUnlockedBadges(verifiedCount: number): Badge[] {
  return ALL_BADGES.filter((b) => verifiedCount >= b.countRequired);
}

export function getCurrentBadge(verifiedCount: number): Badge | null {
  const unlocked = getUnlockedBadges(verifiedCount);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

export function getNextBadge(verifiedCount: number): Badge | null {
  return ALL_BADGES.find((b) => verifiedCount < b.countRequired) || null;
}

export function getMilestoneProgress(verifiedCount: number): {
  currentBadge: Badge | null;
  nextBadge: Badge | null;
  progressPercent: number;
} {
  const current = getCurrentBadge(verifiedCount);
  const next = getNextBadge(verifiedCount);

  if (!next) {
    return { currentBadge: current, nextBadge: null, progressPercent: 100 };
  }

  const prevThreshold = current ? current.countRequired : 0;
  const targetThreshold = next.countRequired;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((verifiedCount - prevThreshold) / (targetThreshold - prevThreshold)) * 100))
  );

  return {
    currentBadge: current,
    nextBadge: next,
    progressPercent,
  };
}
