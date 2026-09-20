import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';

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
      isGuest: true
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
            wins: Math.max(prev.wins, data.user.wins || 0)
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
        setUser(data.user);
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
      isGuest: true
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

  const addScore = useCallback(async (points: number, wonMatch = false, combo = 0, gameMode = 'เกมตารางธาตุ') => {
    if (points <= 0) return;

    setUser(prev => {
      const newTotal = prev.totalPoints + points;
      const newLevel = Math.max(1, Math.floor(newTotal / 500) + 1);
      const newWins = wonMatch ? prev.wins + 1 : prev.wins;
      const newHighest = Math.max(prev.highestCombo, combo);

      return {
        ...prev,
        totalPoints: newTotal,
        level: newLevel,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: newWins,
        highestCombo: newHighest
      };
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
          gameMode
        })
      });
    } catch (e) {
      console.error('Error recording score:', e);
    }
  }, [user.id, user.name, user.avatar]);

  return {
    user,
    setUser,
    loginWithGoogle,
    logout,
    updateProfile,
    addScore
  };
}
