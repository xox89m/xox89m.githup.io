import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { ELEMENTS } from "./src/data/elements.ts";
import { BattleQuestion, LeaderboardEntry, UserProfile, OnlineUser, LiveScoreEvent } from "./src/types.ts";

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// In-memory persistent database for leaderboard & users with file sync
const DATA_DIR = path.join(process.cwd(), "data");
const LEADERBOARD_FILE = path.join(DATA_DIR, "leaderboard.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create data dir:", e);
  }
}

function loadInitialLeaderboard(): LeaderboardEntry[] {
  const bossBot: LeaderboardEntry = {
    id: "bot-boss-3-1",
    name: "บอส3/1",
    avatar: "👾",
    totalPoints: 1000,
    level: 3,
    wins: 5,
    accuracy: 88,
    totalAnswered: 35
  };

  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, "utf-8"));
      if (Array.isArray(data)) {
        // Filter out old deleted bots
        const filtered = data.filter(entry => 
          !entry.id.startsWith("player-seed-") &&
          !["ดร.เคมีพิสดาร 🧪", "น้องนุ่นรักตารางธาตุ ✨", "บอสไอโซโทป ⚡", "เด็กสายวิทย์_007 🎯"].includes(entry.name)
        );
        // Ensure บอส3/1 exists with proper stats
        const existingBossIndex = filtered.findIndex(e => e.id === "bot-boss-3-1" || e.name === "บอส3/1");
        if (existingBossIndex >= 0) {
          filtered[existingBossIndex] = {
            ...bossBot,
            ...filtered[existingBossIndex],
            accuracy: filtered[existingBossIndex].accuracy ?? 88,
            totalAnswered: filtered[existingBossIndex].totalAnswered ?? 35
          };
        } else {
          filtered.push(bossBot);
        }
        return filtered;
      }
    }
  } catch (e) {
    console.warn("Could not load persisted leaderboard:", e);
  }
  return [bossBot];
}

function loadInitialUsers(): Map<string, UserProfile> {
  const map = new Map<string, UserProfile>();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const arr = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
      if (Array.isArray(arr)) {
        arr.forEach(u => map.set(u.id, u));
      }
    }
  } catch (e) {
    console.warn("Could not load persisted users:", e);
  }
  return map;
}

let leaderboard: LeaderboardEntry[] = loadInitialLeaderboard();
const users: Map<string, UserProfile> = loadInitialUsers();

function saveDatabase() {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), "utf-8");
    fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(users.values()), null, 2), "utf-8");
  } catch (e) {
    console.error("Error persisting data:", e);
  }
}

// Helper to get formatted & sorted leaderboard
function getSortedLeaderboard(): LeaderboardEntry[] {
  return [...leaderboard]
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return (b.accuracy || 0) - (a.accuracy || 0);
    })
    .slice(0, 100)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      accuracy: item.accuracy ?? (item.id === "bot-boss-3-1" ? 88 : (item.wins > 0 ? Math.min(95, 65 + item.wins * 6) : 0)),
      totalAnswered: item.totalAnswered ?? (item.id === "bot-boss-3-1" ? 35 : (item.wins * 8 || 1))
    }));
}

// Active live connected sockets and their user profile
const onlineClients = new Map<WebSocket, OnlineUser>();

function getCombinedOnlineUsers(): OnlineUser[] {
  const realUsers = Array.from(onlineClients.values());
  // Sort real online users by points descending
  return realUsers.sort((a, b) => b.totalPoints - a.totalPoints);
}

function broadcastOnlinePresence() {
  const list = getCombinedOnlineUsers();
  const payload = JSON.stringify({
    type: "presence:update",
    onlineUsers: list,
    onlineCount: list.length
  });

  onlineClients.forEach((_, clientWs) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(payload);
    }
  });
}

function broadcastLeaderboardUpdate(recentEvent?: LiveScoreEvent) {
  const sorted = getSortedLeaderboard();
  const payload = JSON.stringify({
    type: "leaderboard:update",
    leaderboard: sorted,
    recentEvent: recentEvent || null
  });

  onlineClients.forEach((_, clientWs) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(payload);
    }
  });
}

// Helper to generate quick-fire periodic questions for real-time duels
function generateDuelQuestions(count = 5): BattleQuestion[] {
  const shuffled = [...ELEMENTS].sort(() => Math.random() - 0.5);
  const questions: BattleQuestion[] = [];

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const el = shuffled[i];
    const type = i % 4;

    if (type === 0) {
      // Question: Symbol of element
      const otherSymbols = ELEMENTS
        .filter(e => e.symbol !== el.symbol)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(e => e.symbol);
      const options = [el.symbol, ...otherSymbols].sort(() => Math.random() - 0.5);
      questions.push({
        id: `q-${i}-${Date.now()}`,
        question: `สัญลักษณ์ทางเคมีของ "${el.nameTH}" คือข้อใด?`,
        options,
        correctIndex: options.indexOf(el.symbol),
        explanation: `${el.nameTH} มีสัญลักษณ์คือ ${el.symbol} (เลขอะตอม ${el.atomicNumber})`,
        elementSymbol: el.symbol
      });
    } else if (type === 1) {
      // Question: Name from symbol
      const otherNames = ELEMENTS
        .filter(e => e.symbol !== el.symbol)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(e => e.nameTH);
      const options = [el.nameTH, ...otherNames].sort(() => Math.random() - 0.5);
      questions.push({
        id: `q-${i}-${Date.now()}`,
        question: `สัญลักษณ์ธาตุ "${el.symbol}" คือธาตุใดในภาษาไทย?`,
        options,
        correctIndex: options.indexOf(el.nameTH),
        explanation: `สัญลักษณ์ ${el.symbol} คือธาตุ ${el.nameTH}`,
        elementSymbol: el.symbol
      });
    } else if (type === 2) {
      // Question: Group & Period
      const correctText = `หมู่ ${el.group} คาบ ${el.period}`;
      const fake1 = `หมู่ ${el.group === 1 ? 2 : el.group - 1} คาบ ${el.period}`;
      const fake2 = `หมู่ ${el.group} คาบ ${el.period + 1}`;
      const fake3 = `หมู่ ${el.group === 18 ? 17 : el.group + 1} คาบ ${Math.max(1, el.period - 1)}`;
      const rawOptions = [correctText, fake1, fake2, fake3];
      const uniqueOptions = Array.from(new Set(rawOptions));
      while (uniqueOptions.length < 4) {
        uniqueOptions.push(`หมู่ ${Math.floor(Math.random() * 18) + 1} คาบ ${Math.floor(Math.random() * 6) + 1}`);
      }
      const options = uniqueOptions.sort(() => Math.random() - 0.5);
      questions.push({
        id: `q-${i}-${Date.now()}`,
        question: `ธาตุ "${el.nameTH} (${el.symbol})" อยู่ในหมู่และคาบใด?`,
        options,
        correctIndex: options.indexOf(correctText),
        explanation: `${el.nameTH} (${el.symbol}) เลขอะตอม ${el.atomicNumber} จัดอยู่ในหมู่ ${el.group} คาบ ${el.period}`,
        elementSymbol: el.symbol
      });
    } else {
      // Question: Trivia / Hint
      const otherHints = ELEMENTS
        .filter(e => e.symbol !== el.symbol)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(e => e.hint);
      const options = [el.hint, ...otherHints].sort(() => Math.random() - 0.5);
      questions.push({
        id: `q-${i}-${Date.now()}`,
        question: `คุณสมบัติเด่นของธาตุ "${el.nameTH} (${el.symbol})" คืออะไร?`,
        options,
        correctIndex: options.indexOf(el.hint),
        explanation: el.trivia,
        elementSymbol: el.symbol
      });
    }
  }

  return questions;
}

// ---------------- REST API ----------------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Get Top Leaderboard
app.get("/api/leaderboard", (_req, res) => {
  res.json({ leaderboard: getSortedLeaderboard() });
});

// Get Players for Analytics Dashboard
app.get("/api/analytics/players", (_req, res) => {
  res.json({ players: getSortedLeaderboard() });
});

// Get Online Users
app.get("/api/online-users", (_req, res) => {
  const list = getCombinedOnlineUsers();
  res.json({ onlineUsers: list, totalCount: list.length });
});

// Submit / Update Score
app.post("/api/score", (req, res) => {
  const { userId, name, avatar, pointsAdded, wonMatch, combo, gameMode, accuracy, totalAnswered, totalCorrect, unlockedAchievements, modesPlayed } = req.body;
  if (!userId || typeof pointsAdded !== "number") {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  let user = users.get(userId);
  if (!user) {
    user = {
      id: userId,
      name: name || "นักทดลองเคมี",
      avatar: avatar || "🧑‍🔬",
      totalPoints: 0,
      level: 1,
      gamesPlayed: 0,
      wins: 0,
      highestCombo: 0,
      accuracy: typeof accuracy === "number" ? accuracy : undefined,
      totalAnswered: typeof totalAnswered === "number" ? totalAnswered : 0,
      unlockedAchievements: Array.isArray(unlockedAchievements) ? unlockedAchievements : [],
      modesPlayed: Array.isArray(modesPlayed) ? modesPlayed : []
    };
  }

  user.totalPoints += Math.max(0, pointsAdded);
  user.gamesPlayed += 1;
  if (wonMatch) user.wins += 1;
  if (combo && combo > user.highestCombo) {
    user.highestCombo = combo;
  }
  if (typeof accuracy === "number") {
    user.accuracy = accuracy;
  }
  if (typeof totalAnswered === "number") {
    user.totalAnswered = (user.totalAnswered || 0) + totalAnswered;
  }
  if (Array.isArray(unlockedAchievements)) {
    user.unlockedAchievements = Array.from(new Set([...(user.unlockedAchievements || []), ...unlockedAchievements]));
  }
  if (Array.isArray(modesPlayed)) {
    user.modesPlayed = Array.from(new Set([...(user.modesPlayed || []), ...modesPlayed]));
  }
  // Level calculation (every 500 points = 1 level)
  user.level = Math.max(1, Math.floor(user.totalPoints / 500) + 1);

  if (name) user.name = name;
  if (avatar) user.avatar = avatar;

  users.set(userId, user);

  // Update in leaderboard array
  const lbEntry: LeaderboardEntry = {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    totalPoints: user.totalPoints,
    level: user.level,
    wins: user.wins,
    accuracy: user.accuracy,
    totalAnswered: user.totalAnswered,
    unlockedAchievements: user.unlockedAchievements || []
  };

  const lbIndex = leaderboard.findIndex(e => e.id === userId);
  if (lbIndex >= 0) {
    leaderboard[lbIndex] = lbEntry;
  } else {
    leaderboard.push(lbEntry);
  }

  // Update any active online connection for this user
  onlineClients.forEach(client => {
    if (client.id === userId) {
      client.totalPoints = user.totalPoints;
      client.level = user.level;
      client.name = user.name;
      client.avatar = user.avatar;
    }
  });

  // Create real-time live event to broadcast to everyone
  const recentEvent: LiveScoreEvent = {
    id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.name,
    avatar: user.avatar,
    pointsAdded: Math.max(0, pointsAdded),
    gameMode: gameMode || "เกมตารางธาตุ",
    totalPoints: user.totalPoints,
    timestamp: Date.now()
  };

  // Broadcast to all connected clients immediately in real-time
  broadcastLeaderboardUpdate(recentEvent);
  broadcastOnlinePresence();

  // Save persistent state
  saveDatabase();

  // Find rank
  const sorted = getSortedLeaderboard();
  const rank = sorted.findIndex(e => e.id === userId) + 1;

  res.json({
    user,
    rank,
    recentEvent
  });
});

// Google Authentication endpoint with real Google Account
app.post("/api/auth/google", (req, res) => {
  const { id, name, email, avatar, picture } = req.body;
  const userEmail = email || "";
  const userId = id || (userEmail ? `google-${userEmail.replace(/[^a-zA-Z0-9]/g, "_")}` : `google-${Date.now()}`);
  const finalAvatar = picture || avatar || "🧪";
  const finalName = name || (userEmail ? userEmail.split("@")[0] : "นักเคมี Google");

  let user = users.get(userId);
  if (!user) {
    user = {
      id: userId,
      name: finalName,
      email: userEmail,
      avatar: finalAvatar,
      totalPoints: 0,
      level: 1,
      gamesPlayed: 0,
      wins: 0,
      highestCombo: 0,
      isGuest: false
    };
    users.set(userId, user);
  } else {
    user.name = finalName;
    user.avatar = finalAvatar;
    if (userEmail) user.email = userEmail;
    user.isGuest = false;
  }

  // Update in leaderboard if existing
  const lbIndex = leaderboard.findIndex(e => e.id === userId);
  if (lbIndex >= 0) {
    leaderboard[lbIndex].name = user.name;
    leaderboard[lbIndex].avatar = user.avatar;
  }

  saveDatabase();

  // Update presence
  onlineClients.forEach(client => {
    if (client.id === userId) {
      client.name = user.name;
      client.avatar = user.avatar;
      client.email = user.email;
      client.isGuest = false;
    }
  });

  broadcastOnlinePresence();
  broadcastLeaderboardUpdate();

  res.json({ user, status: "authenticated" });
});

// Google or Guest Authentication endpoint
app.post("/api/auth/login", (req, res) => {
  const { id, name, email, avatar, isGuest, unlockedAchievements, modesPlayed } = req.body;
  const userId = id || `user-${Date.now()}`;
  
  let user = users.get(userId);
  if (!user) {
    user = {
      id: userId,
      name: name || (isGuest ? `ผู้เล่นไร้นาม_${Math.floor(Math.random()*900+100)}` : "นักเคมี Google"),
      email: email || "",
      avatar: avatar || "🧪",
      totalPoints: 0,
      level: 1,
      gamesPlayed: 0,
      wins: 0,
      highestCombo: 0,
      isGuest: !!isGuest,
      unlockedAchievements: Array.isArray(unlockedAchievements) ? unlockedAchievements : [],
      modesPlayed: Array.isArray(modesPlayed) ? modesPlayed : []
    };
    users.set(userId, user);
  } else {
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (email) user.email = email;
    if (typeof isGuest === 'boolean') user.isGuest = isGuest;
    if (Array.isArray(unlockedAchievements)) {
      user.unlockedAchievements = Array.from(new Set([...(user.unlockedAchievements || []), ...unlockedAchievements]));
    }
    if (Array.isArray(modesPlayed)) {
      user.modesPlayed = Array.from(new Set([...(user.modesPlayed || []), ...modesPlayed]));
    }
  }

  saveDatabase();

  res.json({ user });
});

// ---------------- WEBSOCKET REAL-TIME DUEL & PRESENCE ----------------
const wss = new WebSocketServer({ noServer: true });

interface RoomPlayer {
  ws?: WebSocket;
  id: string;
  name: string;
  avatar: string;
  score: number;
  currentQuestionIndex: number;
  combo: number;
  finished: boolean;
  isBot?: boolean;
}

interface BattleRoom {
  id: string;
  players: Record<string, RoomPlayer>;
  questions: BattleQuestion[];
  status: "waiting" | "playing" | "ended";
  winnerId: string | null;
  botInterval?: NodeJS.Timeout;
}

const rooms: Map<string, BattleRoom> = new Map();
const waitingMatchQueue: { ws: WebSocket; user: UserProfile }[] = [];

server.on("upgrade", (request, socket, head) => {
  const pathname = request.url ? new URL(request.url, "http://localhost").pathname : "";
  if (pathname.startsWith("/ws")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  }
});

wss.on("connection", (ws: WebSocket) => {
  let boundUserId: string | null = null;
  let boundRoomId: string | null = null;

  function broadcastRoomState(room: BattleRoom) {
    const payload = JSON.stringify({
      type: "battle:state",
      room: {
        roomId: room.id,
        status: room.status,
        players: Object.fromEntries(
          Object.entries(room.players).map(([k, p]) => [
            k,
            {
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              score: p.score,
              currentQuestionIndex: p.currentQuestionIndex,
              combo: p.combo,
              finished: p.finished
            }
          ])
        ),
        questions: room.questions,
        winnerId: room.winnerId
      }
    });

    Object.values(room.players).forEach(p => {
      if (p.ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(payload);
      }
    });
  }

  ws.on("message", (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      // Presence: User joined or reported status
      if (msg.type === "presence:join") {
        const user: UserProfile = msg.user;
        boundUserId = user.id;
        const onlineUser: OnlineUser = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          email: user.email,
          totalPoints: user.totalPoints,
          level: user.level,
          status: msg.status || "พร้อมลุยเกมเคมี 🟢",
          lastActive: Date.now(),
          isGuest: user.isGuest
        };
        onlineClients.set(ws, onlineUser);

        // Send current snapshot immediately to the new client
        ws.send(JSON.stringify({
          type: "init:data",
          leaderboard: getSortedLeaderboard(),
          onlineUsers: getCombinedOnlineUsers()
        }));

        // Broadcast presence update to everyone
        broadcastOnlinePresence();
      } else if (msg.type === "presence:status") {
        const client = onlineClients.get(ws);
        if (client) {
          client.status = msg.status || "ออนไลน์ 🟢";
          client.lastActive = Date.now();
          broadcastOnlinePresence();
        }
      } else if (msg.type === "presence:ping") {
        const client = onlineClients.get(ws);
        if (client) client.lastActive = Date.now();
        ws.send(JSON.stringify({ type: "presence:pong", time: Date.now() }));
      } else if (msg.type === "battle:matchmake") {
        const user: UserProfile = msg.user;
        boundUserId = user.id;

        // Check if someone else is in queue
        const matchOpponent = waitingMatchQueue.shift();

        if (matchOpponent && matchOpponent.ws.readyState === WebSocket.OPEN && matchOpponent.user.id !== user.id) {
          // Match found with another player!
          const roomId = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          boundRoomId = roomId;

          const questions = generateDuelQuestions(5);
          const room: BattleRoom = {
            id: roomId,
            status: "playing",
            questions,
            winnerId: null,
            players: {
              [user.id]: {
                ws,
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                score: 0,
                currentQuestionIndex: 0,
                combo: 0,
                finished: false
              },
              [matchOpponent.user.id]: {
                ws: matchOpponent.ws,
                id: matchOpponent.user.id,
                name: matchOpponent.user.name,
                avatar: matchOpponent.user.avatar,
                score: 0,
                currentQuestionIndex: 0,
                combo: 0,
                finished: false
              }
            }
          };

          rooms.set(roomId, room);
          broadcastRoomState(room);
        } else {
          // Push to queue and set 3-second fallback to match with Smart AI Rival
          waitingMatchQueue.push({ ws, user });

          setTimeout(() => {
            const index = waitingMatchQueue.findIndex(q => q.user.id === user.id);
            if (index >= 0) {
              waitingMatchQueue.splice(index, 1);
              if (ws.readyState === WebSocket.OPEN) {
                // Match with rival bot
                const roomId = `room-bot-${Date.now()}`;
                boundRoomId = roomId;

                const bot = { name: "บอส3/1", avatar: "👾" };
                const botId = `bot-boss-3-1`;

                const questions = generateDuelQuestions(5);
                const room: BattleRoom = {
                  id: roomId,
                  status: "playing",
                  questions,
                  winnerId: null,
                  players: {
                    [user.id]: {
                      ws,
                      id: user.id,
                      name: user.name,
                      avatar: user.avatar,
                      score: 0,
                      currentQuestionIndex: 0,
                      combo: 0,
                      finished: false
                    },
                    [botId]: {
                      id: botId,
                      name: bot.name,
                      avatar: bot.avatar,
                      score: 0,
                      currentQuestionIndex: 0,
                      combo: 0,
                      finished: false,
                      isBot: true
                    }
                  }
                };

                rooms.set(roomId, room);
                broadcastRoomState(room);

                // Simulate real-time bot answering step-by-step
                let botStep = 0;
                room.botInterval = setInterval(() => {
                  if (botStep >= questions.length || room.status === "ended") {
                    if (room.botInterval) clearInterval(room.botInterval);
                    return;
                  }
                  botStep++;
                  const isCorrect = Math.random() > 0.25; // 75% accuracy
                  const botPlayer = room.players[botId];
                  if (botPlayer) {
                    botPlayer.currentQuestionIndex = botStep;
                    if (isCorrect) {
                      botPlayer.combo++;
                      botPlayer.score += 80 + botPlayer.combo * 20;
                    } else {
                      botPlayer.combo = 0;
                    }
                    if (botStep >= questions.length) {
                      botPlayer.finished = true;
                    }
                  }
                  checkBattleCompletion(room);
                  broadcastRoomState(room);
                }, 2800);
              }
            }
          }, 2500);
        }
      } else if (msg.type === "battle:answer") {
        const { roomId, userId, isCorrect, timeSpentSec } = msg;
        const room = rooms.get(roomId);
        if (!room || room.status !== "playing") return;

        const player = room.players[userId];
        if (!player) return;

        player.currentQuestionIndex += 1;
        if (isCorrect) {
          player.combo += 1;
          const speedBonus = Math.max(0, 10 - (timeSpentSec || 3)) * 5;
          player.score += 100 + player.combo * 20 + speedBonus;
        } else {
          player.combo = 0;
        }

        if (player.currentQuestionIndex >= room.questions.length) {
          player.finished = true;
        }

        checkBattleCompletion(room);
        broadcastRoomState(room);
      } else if (msg.type === "battle:leave") {
        if (boundRoomId) {
          const room = rooms.get(boundRoomId);
          if (room) {
            if (room.botInterval) clearInterval(room.botInterval);
            rooms.delete(boundRoomId);
          }
        }
      }
    } catch (e) {
      console.error("WS error:", e);
    }
  });

  function checkBattleCompletion(room: BattleRoom) {
    const allFinished = Object.values(room.players).every(p => p.finished);
    if (allFinished && room.status === "playing") {
      room.status = "ended";
      if (room.botInterval) clearInterval(room.botInterval);

      const playerList = Object.values(room.players).sort((a, b) => b.score - a.score);
      if (playerList.length >= 2 && playerList[0].score > playerList[1].score) {
        room.winnerId = playerList[0].id;
      } else if (playerList.length === 1) {
        room.winnerId = playerList[0].id;
      } else {
        room.winnerId = "draw";
      }
    }
  }

  ws.on("close", () => {
    // Remove from online clients and broadcast presence
    onlineClients.delete(ws);
    broadcastOnlinePresence();

    // Remove from matchmaking queue if present
    const qIdx = waitingMatchQueue.findIndex(q => q.ws === ws);
    if (qIdx >= 0) waitingMatchQueue.splice(qIdx, 1);

    if (boundRoomId) {
      const room = rooms.get(boundRoomId);
      if (room) {
        if (room.botInterval) clearInterval(room.botInterval);
        rooms.delete(boundRoomId);
      }
    }
  });
});

// ---------------- VITE & STATIC SERVING ----------------
async function start() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    server.on("error", (err: any) => {
      console.error("HTTP/WS Server error:", err);
    });

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server listening on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Critical error starting server:", error);
  }
}

process.on("unhandledRejection", (reason) => {
  console.warn("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

start();
