import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { getLocalBackupLogs } from '../services/analytics';
import {
  unlockAchievement,
  checkStreakAchievements,
  recordModePlayed,
  recordBattleWin as recordBattleWinUtil,
  recordGridPlacementSuccess,
  recordPropertyMatchSuccess,
  recordExplorerElementView,
  recordReviewSuccess,
  checkScoreMilestones
} from '../utils/achievementSystem';

const STORAGE_KEY = 'periodic_game_user_v1';

export function useAuth() {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default guest profile
    const randomId = `guest-${Math.floor(Math.random() * 100000)}`;
    const randomSuffix = Math.floor(Math.random() * 900 + 100);
    return {
      id: randomId,
      name: `นักทดลองเคมี_${randomSuffix}`,
      avatar: '🧑‍🔬',
      totalPoints: 0,
      level: 1,
      gamesPlayed: 0,
      wins: 0,
      highestCombo: 0,
      isGuest: true,
      unlockedAchievements: [],
      modesPlayed: [],
      achievementsProgress: {},
      exploredElements: []
    };
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  // Sync to server on mount
  useEffect(() => {
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(prev => ({
            ...prev,
            totalPoints: Math.max(prev.totalPoints, data.user.totalPoints || 0),
            level: Math.max(prev.level, data.user.level || 1),
            gamesPlayed: Math.max(prev.gamesPlayed, data.user.gamesPlayed || 0),
            wins: Math.max(prev.wins, data.user.wins || 0),
            unlockedAchievements: Array.from(new Set([...(prev.unlockedAchievements || []), ...(data.user.unlockedAchievements || [])])),
            modesPlayed: Array.from(new Set([...(prev.modesPlayed || []), ...(data.user.modesPlayed || [])]))
          }));
        }
      })
      .catch(() => {
        // offline or loading
      });
  }, []);

  const loginWithGoogle = useCallback(async (googleData: { name: string; email: string; avatar?: string; id?: string }) => {
    const userId = googleData.id || `google-${googleData.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const updatedUser: UserProfile = {
      ...user,
      id: userId,
      name: googleData.name,
      email: googleData.email,
      avatar: googleData.avatar || '🧪',
      isGuest: false
    };

    setUser(updatedUser);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: googleData.name,
          email: googleData.email,
          avatar: googleData.avatar || '🧪'
        })
      });
      const data = await res.json();
      if (data.user) {
        setUser(prev => ({
          ...data.user,
          unlockedAchievements: Array.from(new Set([...(prev.unlockedAchievements || []), ...(data.user.unlockedAchievements || [])])),
          modesPlayed: Array.from(new Set([...(prev.modesPlayed || []), ...(data.user.modesPlayed || [])]))
        }));
      }
    } catch (e) {
      console.error('Error logging in with Google on server:', e);
    }
  }, [user]);

  const logout = useCallback(() => {
    const randomSuffix = Math.floor(Math.random() * 900 + 100);
    const guestUser: UserProfile = {
      id: `guest-${Date.now()}`,
      name: `นักทดลองเคมี_${randomSuffix}`,
      avatar: '🧑‍🔬',
      totalPoints: 0,
      level: 1,
      gamesPlayed: 0,
      wins: 0,
      highestCombo: 0,
      isGuest: true,
      unlockedAchievements: [],
      modesPlayed: [],
      achievementsProgress: {},
      exploredElements: []
    };
    setUser(guestUser);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfile = useCallback(async (name: string, avatar: string) => {
    const updated: UserProfile = {
      ...user,
      name,
      avatar
    };
    setUser(updated);

    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch {
      // ignore
    }
  }, [user]);

  const addScore = useCallback(async (
    points: number, 
    wonMatch = false, 
    combo = 0, 
    gameMode = 'เกมตารางธาตุ',
    stats?: { totalAnswered?: number; totalCorrect?: number; accuracy?: number }
  ) => {
    if (points <= 0) return;

    // Calculate current user accuracy from local logs if available
    const localLogs = getLocalBackupLogs();
    const userLogs = localLogs.filter(l => l.userId === user.id);
    const userTotalAnswered = stats?.totalAnswered ?? (userLogs.length > 0 ? userLogs.length : 1);
    const userTotalCorrect = stats?.totalCorrect ?? (userLogs.length > 0 ? userLogs.filter(l => l.isCorrect).length : (wonMatch ? 1 : 0));
    const userAccuracy = stats?.accuracy ?? (userTotalAnswered > 0 ? Math.round((userTotalCorrect / userTotalAnswered) * 100) : undefined);

    let nextUser: UserProfile = { ...user };

    setUser(prev => {
      const newTotal = prev.totalPoints + points;
      const newLevel = Math.max(1, Math.floor(newTotal / 500) + 1);
      const newWins = wonMatch ? prev.wins + 1 : prev.wins;
      const newHighest = Math.max(prev.highestCombo, combo);

      let updated: UserProfile = {
        ...prev,
        totalPoints: newTotal,
        level: newLevel,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: newWins,
        highestCombo: newHighest,
        accuracy: userAccuracy ?? prev.accuracy,
        totalAnswered: (prev.totalAnswered || 0) + (stats?.totalAnswered || 1)
      };

      // Check 1000 score milestone
      if (newTotal >= 1000) {
        updated = checkScoreMilestones(updated);
      }

      nextUser = updated;
      return updated;
    });

    try {
      await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          avatar: user.avatar,
          pointsAdded: points,
          wonMatch,
          combo,
          gameMode,
          accuracy: userAccuracy,
          totalAnswered: stats?.totalAnswered || 1,
          totalCorrect: stats?.totalCorrect || (wonMatch ? 1 : 0),
          unlockedAchievements: nextUser.unlockedAchievements || user.unlockedAchievements || [],
          modesPlayed: nextUser.modesPlayed || user.modesPlayed || []
        })
      });
    } catch (e) {
      console.error('Error recording score:', e);
    }
  }, [user]);

  // Achievement Trigger Actions
  const recordStreak = useCallback((streak: number) => {
    setUser(prev => checkStreakAchievements(prev, streak, addScore));
  }, [addScore]);

  const recordMode = useCallback((modeName: 'quiz' | 'battle' | 'grid' | 'match' | 'explorer') => {
    setUser(prev => recordModePlayed(prev, modeName, addScore));
  }, [addScore]);

  const recordBattleWin = useCallback((opponent: { id?: string; name?: string }) => {
    setUser(prev => recordBattleWinUtil(prev, opponent, addScore));
  }, [addScore]);

  const recordGridPlacement = useCallback(() => {
    setUser(prev => recordGridPlacementSuccess(prev, addScore));
  }, [addScore]);

  const recordPropertyMatch = useCallback(() => {
    setUser(prev => recordPropertyMatchSuccess(prev, addScore));
  }, [addScore]);

  const recordExplorerElement = useCallback((symbol: string) => {
    setUser(prev => recordExplorerElementView(prev, symbol, addScore));
  }, [addScore]);

  const recordExplorer = useCallback((symbol?: string) => {
    setUser(prev => recordExplorerElementView(prev, symbol || 'H', addScore));
  }, [addScore]);

  const recordReview = useCallback(() => {
    setUser(prev => recordReviewSuccess(prev, addScore));
  }, [addScore]);

  const unlockById = useCallback((achievementId: string) => {
    setUser(prev => unlockAchievement(prev, achievementId, addScore));
  }, [addScore]);

  return {
    user,
    setUser,
    loginWithGoogle,
    logout,
    updateProfile,
    addScore,
    recordStreak,
    recordMode,
    recordBattleWin,
    recordGridPlacement,
    recordPropertyMatch,
    recordExplorer,
    recordExplorerElement,
    recordReview,
    unlockById
  };
}
