import { useState, useEffect, useRef, useCallback } from 'react';
import { LeaderboardEntry, OnlineUser, LiveScoreEvent, UserProfile } from '../types';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: "bot-boss-3-1", name: "บอส3/1", avatar: "👾", totalPoints: 1000, level: 3, wins: 5, rank: 1 }
];

const DEFAULT_ONLINE: OnlineUser[] = [];

export function useRealtimeLeaderboard(user: UserProfile) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>(DEFAULT_ONLINE);
  const [latestEvent, setLatestEvent] = useState<LiveScoreEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial leaderboard via REST
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (data.leaderboard && data.leaderboard.length > 0) {
        setLeaderboard(data.leaderboard);
      }
    } catch {
      // Keep DEFAULT_LEADERBOARD merged with current user
      setLeaderboard((prev) => {
        const existing = prev.filter(e => e.id !== user.id);
        const userEntry: LeaderboardEntry = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          totalPoints: user.totalPoints,
          level: user.level,
          wins: user.wins
        };
        const combined = [...existing, userEntry].sort((a, b) => b.totalPoints - a.totalPoints);
        return combined.map((item, idx) => ({ ...item, rank: idx + 1 }));
      });
    }
  }, [user]);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/online-users');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (data.onlineUsers && data.onlineUsers.length > 0) {
        setOnlineUsers(data.onlineUsers);
      }
    } catch {
      // Keep default online bots
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    fetchOnlineUsers();
  }, [fetchLeaderboard, fetchOnlineUsers]);

  // Connect WebSocket for real-time live sync
  useEffect(() => {
    let isMounted = true;

    function connectWs() {
      if (typeof window === 'undefined') return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          // Register presence
          socket.send(JSON.stringify({
            type: 'presence:join',
            user: {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              email: user.email,
              totalPoints: user.totalPoints,
              level: user.level,
              isGuest: user.isGuest
            },
            status: 'พร้อมลุยเกมเคมี 🟢'
          }));
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'init:data') {
              if (data.leaderboard) setLeaderboard(data.leaderboard);
              if (data.onlineUsers) setOnlineUsers(data.onlineUsers);
            } else if (data.type === 'leaderboard:update') {
              if (data.leaderboard) setLeaderboard(data.leaderboard);
              if (data.recentEvent) {
                setLatestEvent(data.recentEvent);
              }
            } else if (data.type === 'presence:update') {
              if (data.onlineUsers) setOnlineUsers(data.onlineUsers);
            }
          } catch (e) {
            console.error('Error parsing live WS message', e);
          }
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Auto-reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connectWs();
          }, 3000);
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch (err) {
        console.warn('Live WebSocket connection failed, retrying in 3s', err);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) connectWs();
        }, 3000);
      }
    }

    connectWs();

    // Heartbeat ping interval
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'presence:ping' }));
      }
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user.id]);

  // Keep server updated if user's name or avatar changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'presence:join',
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          email: user.email,
          totalPoints: user.totalPoints,
          level: user.level,
          isGuest: user.isGuest
        }
      }));
    }
  }, [user.name, user.avatar, user.totalPoints, user.level, user.isGuest, user.id, user.email]);

  const updatePresenceStatus = useCallback((status: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'presence:status',
        status
      }));
    }
  }, []);

  return {
    leaderboard,
    onlineUsers,
    onlineCount: onlineUsers.length,
    latestEvent,
    isConnected,
    fetchLeaderboard,
    updatePresenceStatus
  };
}
