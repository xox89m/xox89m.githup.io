import { useState, useEffect, useRef, useCallback } from 'react';
import { LeaderboardEntry, OnlineUser, LiveScoreEvent, UserProfile } from '../types';

export function useRealtimeLeaderboard(user: UserProfile) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [latestEvent, setLatestEvent] = useState<LiveScoreEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial leaderboard via REST
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.warn('Could not fetch leaderboard via REST', e);
    }
  }, []);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/online-users');
      const data = await res.json();
      if (data.onlineUsers) {
        setOnlineUsers(data.onlineUsers);
      }
    } catch (e) {
      console.warn('Could not fetch online users via REST', e);
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
