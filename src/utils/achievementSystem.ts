import { UserProfile, Achievement } from '../types';
import { getAchievement, ALL_ACHIEVEMENTS } from '../data/achievements';
import { soundManager } from './audio';
import confetti from 'canvas-confetti';

export interface AchievementUnlockEvent {
  achievement: Achievement;
  timestamp: number;
}

// Global listener hook for unlocked toast
export function subscribeToAchievementUnlocks(callback: (event: AchievementUnlockEvent) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<AchievementUnlockEvent>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };
  window.addEventListener('app:achievement-unlocked', handler);
  return () => {
    window.removeEventListener('app:achievement-unlocked', handler);
  };
}

export function triggerUnlockNotification(achievement: Achievement) {
  try {
    soundManager.playVictory();
  } catch {
    // fallback
  }

  try {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.25 }
    });
  } catch {
    // fallback
  }

  const detail: AchievementUnlockEvent = {
    achievement,
    timestamp: Date.now()
  };

  window.dispatchEvent(new CustomEvent<AchievementUnlockEvent>('app:achievement-unlocked', { detail }));
}

/**
 * Checks and unlocks an achievement if not already unlocked.
 * Awards bonus points and returns the updated UserProfile.
 */
export function unlockAchievement(
  user: UserProfile,
  achievementId: string,
  onAddScore?: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void
): UserProfile {
  const currentUnlocked = user.unlockedAchievements || [];
  if (currentUnlocked.includes(achievementId)) {
    return user;
  }

  const ach = getAchievement(achievementId);
  if (!ach) return user;

  const newUnlocked = [...currentUnlocked, achievementId];
  triggerUnlockNotification(ach);

  if (onAddScore && ach.rewardPoints > 0) {
    onAddScore(ach.rewardPoints, false, 0, `ปลดล็อกความสำเร็จ: ${ach.title}`);
  }

  return {
    ...user,
    unlockedAchievements: newUnlocked,
    totalPoints: user.totalPoints + ach.rewardPoints
  };
}

/**
 * Check combo / streak achievement
 * 'ตอบถูกครบ 10 ข้อติดกัน' (streak_10)
 */
export function checkStreakAchievements(
  user: UserProfile,
  streak: number,
  onAddScore?: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void
): UserProfile {
  let updated = { ...user };
  const currentMaxStreak = Math.max(user.highestCombo || 0, streak);
  updated.highestCombo = currentMaxStreak;
  updated.currentStreak = streak;

  if (streak >= 1 && !(user.unlockedAchievements || []).includes('first_correct')) {
    updated = unlockAchievement(updated, 'first_correct', onAddScore);
  }

  if (streak >= 10 && !(user.unlockedAchievements || []).includes('streak_10')) {
    updated = unlockAchievement(updated, 'streak_10', onAddScore);
  }

  return updated;
}

/**
 * Record playing a mode
 * 'เล่นครบ 5 โหมด' (all_5_modes)
 */
export function recordModePlayed(
  user: UserProfile,
  modeName: 'quiz' | 'battle' | 'grid' | 'match' | 'explorer',
  onAddScore?: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void
): UserProfile {
  const currentModes = new Set(user.modesPlayed || []);
  currentModes.add(modeName);
  const modesList = Array.from(currentModes);

  let updated: UserProfile = {
    ...user,
    modesPlayed: modesList
  };

  if (modesList.length >= 5 && !(user.unlockedAchievements || []).includes('all_5_modes')) {
    updated = unlockAchievement(updated, 'all_5_modes', onAddScore);
  }

  return updated;
}

/**
 * Record battle win & check boss slayer
 */
export function recordBattleWin(
  user: UserProfile,
  opponentInfo: { id?: string; name?: string },
  onAddScore?: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void
): UserProfile {
  let updated = unlockAchievement(user, 'battle_winner', onAddScore);

  const isBoss = 
    opponentInfo.id?.includes('bot-boss') || 
    opponentInfo.name?.includes('บอส') || 
    opponentInfo.name?.includes('3/1');

  if (isBoss && !(user.unlockedAchievements || []).includes('boss_slayer')) {
    updated = unlockAchievement(updated, 'boss_slayer', onAddScore);
  }

  return updated;
}

/**
 * Record periodic grid placement
 */
export function recordGridPlacementSuccess(
  user: UserProfile,
  onAddScore?: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void
): UserProfile {
  const currentCount = (user.achievementsProgress?.['grid_master'] || 0) + 1;
  const progress = {
    ...(user.achievementsProgress || {}),
    grid_master: currentCount
  };

  let updated: UserProfile = {
    ...user,
    achievementsProgress: progress
  };

  if (currentCount >= 3 && !(user.unlockedAchievements || []).includes('grid_master')) {
    updated = unlockAchievement(updated, 'grid_master', onAddScore);
  }

  return updated;
}

/**
 * Record property match success
 */
export function recordPropertyMatchSuccess(
  user: UserProfile,
  onAddScore?: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void
): UserProfile {
  return unlockAchievement(user, 'match_expert', onAddScore);
}

/**
 * Record viewing an element in encyclopedia
 */
export function recordExplorerElementView(
  user: UserProfile,
  symbol: string,
  onAddScore?: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void
): UserProfile {
  const currentSet = new Set(user.exploredElements || []);
  currentSet.add(symbol);
  const explored = Array.from(currentSet);

  let updated: UserProfile = {
    ...user,
    exploredElements: explored
  };

  if (explored.length >= 10 && !(user.unlockedAchievements || []).includes('explorer_scholar')) {
    updated = unlockAchievement(updated, 'explorer_scholar', onAddScore);
  }

  return updated;
}

/**
 * Record user submitting a review
 */
export function recordReviewSuccess(
  user: UserProfile,
  onAddScore?: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void
): UserProfile {
  return unlockAchievement(user, 'reviewer_badge', onAddScore);
}

/**
 * Check total score milestone
 */
export function checkScoreMilestones(
  user: UserProfile,
  onAddScore?: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void
): UserProfile {
  if (user.totalPoints >= 1000 && !(user.unlockedAchievements || []).includes('score_1000')) {
    return unlockAchievement(user, 'score_1000', onAddScore);
  }
  return user;
}
