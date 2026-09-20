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

// Direct APK Download Endpoint for Android
app.get(["/download/periodic-table-game.apk", "/api/download-apk", "/api/download/apk"], (_req, res) => {
  const publicApk = path.join(process.cwd(), "public", "downloads", "periodic-table-game.apk");
  const distApk = path.join(process.cwd(), "dist", "periodic-table-game.apk");
  const apkPath = fs.existsSync(publicApk) ? publicApk : distApk;

  if (fs.existsSync(apkPath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="periodic-table-game.apk"');
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.sendFile(apkPath);
  } else {
    res.status(404).json({ error: "APK file not found. Please build it using npm run build:apk" });
  }
});

// In-memory persistent database for leaderboard & users
let leaderboard: LeaderboardEntry[] = [
  { id: "bot-1", name: "ดร.เคมีพิสดาร 🧪", avatar: "👨‍🔬", totalPoints: 12450, level: 18, wins: 45 },
  { id: "bot-2", name: "น้องนุ่นรักตารางธาตุ ✨", avatar: "👩‍🎓", totalPoints: 9820, level: 14, wins: 34 },
  { id: "bot-3", name: "บอสไอโซโทป ⚡", avatar: "🧙‍♂️", totalPoints: 8300, level: 12, wins: 28 },
  { id: "bot-4", name: "คุณครูสมศรีเคมี 📚", avatar: "👩‍🏫", totalPoints: 6750, level: 10, wins: 21 },
  { id: "bot-5", name: "เด็กสายวิทย์_007 🎯", avatar: "🧑‍💻", totalPoints: 5120, level: 8, wins: 15 },
  { id: "bot-6", name: "แชมป์โอลิมปิกวิทย์ 🏆", avatar: "🧑‍🔬", totalPoints: 4300, level: 7, wins: 13 },
  { id: "bot-7", name: "เจ้าหญิงนีออน 🎈", avatar: "👸", totalPoints: 3450, level: 5, wins: 9 }
];

const users: Map<string, UserProfile> = new Map();

// Helper to get formatted & sorted leaderboard
function getSortedLeaderboard(): LeaderboardEntry[] {
  return [...leaderboard]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 50)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
}

// Simulated active online peers
const simulatedActiveChemistList: OnlineUser[] = [
  { id: "bot-1", name: "ดร.เคมีพิสดาร 🧪", avatar: "👨‍🔬", totalPoints: 12450, level: 18, status: "กำลังทำควิซมาราธอน 🧠", lastActive: Date.now(), isGuest: false },
  { id: "bot-2", name: "น้องนุ่นรักตารางธาตุ ✨", avatar: "👩‍🎓", totalPoints: 9820, level: 14, status: "กำลังจัดเรียงตารางธาตุ 🧩", lastActive: Date.now(), isGuest: false },
  { id: "bot-3", name: "บอสไอโซโทป ⚡", avatar: "🧙‍♂️", totalPoints: 8300, level: 12, status: "รอท้าดวล 1v1 ⚔️", lastActive: Date.now(), isGuest: false },
  { id: "bot-5", name: "เด็กสายวิทย์_007 🎯", avatar: "🧑‍💻", totalPoints: 5120, level: 8, status: "กำลังจับคู่ธาตุ 🔗", lastActive: Date.now(), isGuest: false }
];

// Active live connected sockets and their user profile
const onlineClients = new Map<WebSocket, OnlineUser>();

function getCombinedOnlineUsers(): OnlineUser[] {
  const realUsers = Array.from(onlineClients.values());
  const realUserIds = new Set(realUsers.map(u => u.id));
  const filteredSimulated = simulatedActiveChemistList.filter(s => !realUserIds.has(s.id));
  return [...realUsers, ...filteredSimulated];
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

// Get Online Users
app.get("/api/online-users", (_req, res) => {
  const list = getCombinedOnlineUsers();
  res.json({ onlineUsers: list, totalCount: list.length });
});

// Submit / Update Score
app.post("/api/score", (req, res) => {
  const { userId, name, avatar, pointsAdded, wonMatch, combo, gameMode } = req.body;
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
      highestCombo: 0
    };
  }

  user.totalPoints += Math.max(0, pointsAdded);
  user.gamesPlayed += 1;
  if (wonMatch) user.wins += 1;
  if (combo && combo > user.highestCombo) {
    user.highestCombo = combo;
  }
  // Level calculation (every 500 points = 1 level)
  user.level = Math.max(1, Math.floor(user.totalPoints / 500) + 1);

  if (name) user.name = name;
  if (avatar) user.avatar = avatar;

  users.set(userId, user);

  // Update in leaderboard array
  const lbIndex = leaderboard.findIndex(e => e.id === userId);
  if (lbIndex >= 0) {
    leaderboard[lbIndex] = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      totalPoints: user.totalPoints,
      level: user.level,
      wins: user.wins
    };
  } else {
    leaderboard.push({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      totalPoints: user.totalPoints,
      level: user.level,
      wins: user.wins
    });
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
  const { id, name, email, avatar, isGuest } = req.body;
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
      isGuest: !!isGuest
    };
    users.set(userId, user);
  } else {
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (email) user.email = email;
    if (typeof isGuest === 'boolean') user.isGuest = isGuest;
  }

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

                const botNames = [
                  { name: "ดร.เคมีพิสดาร 🧪", avatar: "👨‍🔬" },
                  { name: "น้องนุ่นรักตารางธาตุ ✨", avatar: "👩‍🎓" },
                  { name: "บอสไอโซโทป ⚡", avatar: "🧙‍♂️" },
                  { name: "เด็กสายวิทย์_007 🎯", avatar: "🧑‍💻" }
                ];
                const bot = botNames[Math.floor(Math.random() * botNames.length)];
                const botId = `bot-${Date.now()}`;

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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
