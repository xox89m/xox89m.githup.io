import { collection, doc, setDoc, getDocs, query, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { LeaderboardEntry, UserProfile } from '../types';

export interface PlayLogEvent {
  id?: string;
  sessionId: string;
  userId: string;
  questionId: string;
  elementSymbol?: string;
  gameMode?: string;
  isCorrect: boolean;
  answerTime: number; // in seconds
  sessionDuration: number; // elapsed seconds since session started
  timestamp: string; // ISO date string
}

// Session duration tracking
const SESSION_STORAGE_KEY = 'chem_session_id';
const SESSION_START_KEY = 'chem_session_start_time';
const LOCAL_BACKUP_LOGS_KEY = 'chem_play_logs_backup';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';
  let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
  }
  return sid;
}

function getSessionStartTime(): number {
  if (typeof window === 'undefined') return Date.now();
  let start = sessionStorage.getItem(SESSION_START_KEY);
  if (!start) {
    const now = Date.now();
    sessionStorage.setItem(SESSION_START_KEY, String(now));
    return now;
  }
  return parseInt(start, 10) || Date.now();
}

/**
 * Returns elapsed seconds since current player session started
 */
export function getElapsedSessionSeconds(): number {
  const start = getSessionStartTime();
  return Math.max(0, Math.round((Date.now() - start) / 1000));
}

export function getCurrentSessionId(): string {
  return getOrCreateSessionId();
}

/**
 * Save log to local storage backup in case user is offline or Firestore is temporarily unreachable
 */
function saveBackupLocally(log: PlayLogEvent) {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_LOGS_KEY);
    const list: PlayLogEvent[] = raw ? JSON.parse(raw) : [];
    list.push(log);
    // Keep last 500 logs locally
    if (list.length > 500) list.shift();
    localStorage.setItem(LOCAL_BACKUP_LOGS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save local backup log:', e);
  }
}

export function getLocalBackupLogs(): PlayLogEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Track an answer event to Firebase Firestore collection 'play_logs'
 * Runs silently in the background without blocking game execution.
 */
export async function trackAnswerEvent(params: {
  userId: string;
  questionId: string;
  elementSymbol?: string;
  gameMode: string;
  isCorrect: boolean;
  answerTime: number; // in seconds
}): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const sessionDuration = getElapsedSessionSeconds();
  const timestamp = new Date().toISOString();
  const cleanAnswerTime = Math.max(0, Math.min(3600, Math.round(params.answerTime * 10) / 10));

  // Sanitize IDs per isValidId rule
  const safeLogId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const safeSessionId = sessionId.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 120);
  const safeUserId = (params.userId || 'guest').replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 120);
  const safeQuestionId = (params.questionId || 'q_general').replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 120);

  const logPayload: PlayLogEvent = {
    id: safeLogId,
    sessionId: safeSessionId,
    userId: safeUserId,
    questionId: safeQuestionId,
    elementSymbol: params.elementSymbol ? params.elementSymbol.substring(0, 60) : undefined,
    gameMode: params.gameMode ? params.gameMode.substring(0, 60) : 'quiz',
    isCorrect: Boolean(params.isCorrect),
    answerTime: cleanAnswerTime,
    sessionDuration,
    timestamp
  };

  // Always save backup locally first
  saveBackupLocally(logPayload);

  console.log('[Analytics:Firestore] 🚀 ยิงข้อมูลลง collection play_logs ใน Firestore ทันทีที่ตอบคำถาม:', {
    logId: safeLogId,
    mode: logPayload.gameMode,
    questionId: logPayload.questionId,
    elementSymbol: logPayload.elementSymbol,
    isCorrect: logPayload.isCorrect,
    answerTime: logPayload.answerTime,
    sessionDuration: logPayload.sessionDuration,
    timestamp: logPayload.timestamp,
    fullPayload: logPayload
  });

  // Send to Firestore in background
  try {
    const logDocRef = doc(db, 'play_logs', safeLogId);
    await setDoc(logDocRef, logPayload);
    console.log(`[Analytics:Firestore] ✅ บันทึกลง Firestore collection play_logs สำเร็จ (ID: ${safeLogId})`);
  } catch (err) {
    console.error(`[Analytics:Firestore] ❌ บันทึกข้อมูลลง Firestore collection play_logs ไม่สำเร็จ:`, err);
    // Silent catch so it doesn't disturb gameplay, but log per skill
    try {
      handleFirestoreError(err, OperationType.WRITE, `play_logs/${safeLogId}`);
    } catch {
      // Ignored for gameplay continuity
    }
  }
}

/**
 * Fetch all play logs from Firestore with fallback to local storage
 */
export async function fetchAllPlayLogs(maxLogs: number = 1000): Promise<PlayLogEvent[]> {
  try {
    const logsRef = collection(db, 'play_logs');
    const q = query(logsRef, limit(maxLogs));
    const snapshot = await getDocs(q);

    const remoteLogs: PlayLogEvent[] = [];
    snapshot.forEach(d => {
      remoteLogs.push({ id: d.id, ...(d.data() as PlayLogEvent) });
    });

    if (remoteLogs.length > 0) {
      return remoteLogs;
    }
  } catch (err) {
    console.warn('Could not fetch remote play_logs, falling back to local logs:', err);
  }

  // Fallback to local storage logs if Firestore is offline or empty
  return getLocalBackupLogs();
}

/**
 * Subscribe to Firestore play_logs collection in real-time
 */
export function subscribePlayLogs(callback: (logs: PlayLogEvent[]) => void, maxLogs: number = 1000): () => void {
  try {
    const logsRef = collection(db, 'play_logs');
    const q = query(logsRef, limit(maxLogs));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteLogs: PlayLogEvent[] = [];
      snapshot.forEach(d => {
        remoteLogs.push({ id: d.id, ...(d.data() as PlayLogEvent) });
      });
      if (remoteLogs.length > 0) {
        callback(remoteLogs);
      } else {
        callback(getLocalBackupLogs());
      }
    }, (err) => {
      console.warn('subscribePlayLogs error:', err);
      callback(getLocalBackupLogs());
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Failed to setup snapshot listener:', e);
    callback(getLocalBackupLogs());
    return () => {};
  }
}

export interface MistakenElementStat {
  symbol: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  totalAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  overallAccuracy: number;
  first10MinTotal: number;
  first10MinCorrect: number;
  first10MinAccuracy: number;
  after10MinTotal: number;
  after10MinCorrect: number;
  after10MinAccuracy: number;
  accuracyTrendDiff: number; // positive = improved after 10 mins
  avgAnswerTime: number;
  modeBreakdown: Record<string, { total: number; correct: number; accuracy: number }>;
  topMistakenElements: MistakenElementStat[];
}

export interface UserSummaryItem {
  userId: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface PlayerScoreSummary {
  userId: string;
  name: string;
  avatar: string;
  totalPoints: number;
  level: number;
  wins: number;
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
  rank?: number;
  isBot?: boolean;
  isCurrentUser?: boolean;
  gamesPlayed?: number;
  lastActive?: string;
}

/**
 * Compute unified player list synchronizing Leaderboard points, levels, and play log analytics
 */
export function computeAllPlayersSummary(
  logs: PlayLogEvent[],
  leaderboard: LeaderboardEntry[] = [],
  currentUser?: UserProfile
): PlayerScoreSummary[] {
  // Aggregate stats per userId from all play logs
  const logStatsMap = new Map<string, { total: number; correct: number; lastTimestamp: string }>();
  for (const log of logs) {
    const uid = log.userId || 'anonymous';
    const cur = logStatsMap.get(uid) || { total: 0, correct: 0, lastTimestamp: log.timestamp };
    cur.total++;
    if (log.isCorrect) cur.correct++;
    if (new Date(log.timestamp).getTime() > new Date(cur.lastTimestamp).getTime()) {
      cur.lastTimestamp = log.timestamp;
    }
    logStatsMap.set(uid, cur);
  }

  const playersMap = new Map<string, PlayerScoreSummary>();

  // 1. Process leaderboard entries
  for (const entry of leaderboard) {
    const logStat = logStatsMap.get(entry.id);
    const isBot = entry.id === 'bot-boss-3-1' || entry.name === 'บอส3/1';
    
    const totalAnswered = logStat ? logStat.total : (entry.totalAnswered ?? (isBot ? 35 : 0));
    const totalCorrect = logStat ? logStat.correct : (isBot ? Math.round(totalAnswered * 0.88) : 0);
    const accuracy = totalAnswered > 0
      ? Math.round((totalCorrect / totalAnswered) * 100)
      : (entry.accuracy ?? (isBot ? 88 : 0));

    playersMap.set(entry.id, {
      userId: entry.id,
      name: entry.name,
      avatar: entry.avatar,
      totalPoints: entry.totalPoints,
      level: entry.level || Math.max(1, Math.floor(entry.totalPoints / 500) + 1),
      wins: entry.wins || 0,
      totalAnswered,
      totalCorrect,
      accuracy,
      isBot,
      isCurrentUser: currentUser ? entry.id === currentUser.id : false,
      lastActive: logStat?.lastTimestamp
    });
  }

  // 2. Ensure currentUser is present and up to date with latest live state
  if (currentUser) {
    const existing = playersMap.get(currentUser.id);
    const logStat = logStatsMap.get(currentUser.id);
    const totalAnswered = logStat ? logStat.total : (existing?.totalAnswered || currentUser.totalAnswered || 0);
    const totalCorrect = logStat ? logStat.correct : (existing?.totalCorrect || 0);
    const accuracy = totalAnswered > 0 
      ? Math.round((totalCorrect / totalAnswered) * 100)
      : (existing?.accuracy || currentUser.accuracy || 0);

    playersMap.set(currentUser.id, {
      userId: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      totalPoints: Math.max(currentUser.totalPoints, existing?.totalPoints || 0),
      level: Math.max(currentUser.level, existing?.level || 1),
      wins: Math.max(currentUser.wins, existing?.wins || 0),
      totalAnswered,
      totalCorrect,
      accuracy,
      isBot: false,
      isCurrentUser: true,
      lastActive: logStat?.lastTimestamp
    });
  }

  // 3. Add any users from logs who aren't in leaderboard yet
  logStatsMap.forEach((stat, uid) => {
    if (!playersMap.has(uid) && uid !== 'anonymous') {
      const isGuest = uid.startsWith('guest-') || uid.startsWith('guest_');
      const displayName = isGuest ? `นักทดลองเคมี (แขก)` : uid.replace(/^(google_|google-)/, '').slice(0, 18);
      const points = stat.correct * 100;
      const level = Math.max(1, Math.floor(points / 500) + 1);
      const accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;

      playersMap.set(uid, {
        userId: uid,
        name: displayName,
        avatar: '🧑‍🔬',
        totalPoints: points,
        level,
        wins: Math.floor(stat.correct / 5),
        totalAnswered: stat.total,
        totalCorrect: stat.correct,
        accuracy,
        isBot: false,
        isCurrentUser: currentUser ? uid === currentUser.id : false,
        lastActive: stat.lastTimestamp
      });
    }
  });

  // 4. Ensure บอส3/1 exists if leaderboard was empty
  if (!playersMap.has('bot-boss-3-1')) {
    playersMap.set('bot-boss-3-1', {
      userId: 'bot-boss-3-1',
      name: 'บอส3/1',
      avatar: '👾',
      totalPoints: 1000,
      level: 3,
      wins: 5,
      totalAnswered: 35,
      totalCorrect: 31,
      accuracy: 88,
      isBot: true,
      isCurrentUser: false
    });
  }

  // 5. Sort by totalPoints descending, tie-break by accuracy
  const sorted = Array.from(playersMap.values()).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return b.accuracy - a.accuracy;
  });

  // Assign ranks
  return sorted.map((p, idx) => ({
    ...p,
    rank: idx + 1
  }));
}

/**
 * Extract unique users from logs with basic stats
 */
export function getUniqueUsers(logs: PlayLogEvent[]): UserSummaryItem[] {
  const map = new Map<string, { total: number; correct: number }>();
  for (const log of logs) {
    const uid = log.userId || 'anonymous';
    const current = map.get(uid) || { total: 0, correct: 0 };
    current.total++;
    if (log.isCorrect) current.correct++;
    map.set(uid, current);
  }

  const result: UserSummaryItem[] = [];
  map.forEach((val, userId) => {
    result.push({
      userId,
      total: val.total,
      correct: val.correct,
      accuracy: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0
    });
  });

  return result.sort((a, b) => b.total - a.total);
}

/**
 * Compute behavioral analytics: First 10 minutes vs After 10 minutes learning curve
 */
export function computeAnalyticsSummary(logs: PlayLogEvent[]): AnalyticsSummary {
  const total = logs.length;
  if (total === 0) {
    return {
      totalAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
      overallAccuracy: 0,
      first10MinTotal: 0,
      first10MinCorrect: 0,
      first10MinAccuracy: 0,
      after10MinTotal: 0,
      after10MinCorrect: 0,
      after10MinAccuracy: 0,
      accuracyTrendDiff: 0,
      avgAnswerTime: 0,
      modeBreakdown: {},
      topMistakenElements: []
    };
  }

  let totalCorrect = 0;
  let totalTime = 0;

  let first10Total = 0;
  let first10Correct = 0;

  let after10Total = 0;
  let after10Correct = 0;

  const modeBreakdown: Record<string, { total: number; correct: number; accuracy: number }> = {};
  const mistakenElementCounts: Record<string, number> = {};
  let totalMistakes = 0;

  for (const log of logs) {
    if (log.isCorrect) {
      totalCorrect++;
    } else {
      totalMistakes++;
      // Determine element symbol
      let sym = log.elementSymbol;
      if (!sym && log.questionId) {
        // Try extracting symbol from questionId if like "sym_H" or similar
        const match = log.questionId.match(/([A-Z][a-z]?)$/);
        if (match) sym = match[1];
      }
      if (sym) {
        mistakenElementCounts[sym] = (mistakenElementCounts[sym] || 0) + 1;
      }
    }
    totalTime += (log.answerTime || 0);

    // 10 minutes = 600 seconds
    if (log.sessionDuration <= 600) {
      first10Total++;
      if (log.isCorrect) first10Correct++;
    } else {
      after10Total++;
      if (log.isCorrect) after10Correct++;
    }

    const mode = log.gameMode || 'general';
    if (!modeBreakdown[mode]) {
      modeBreakdown[mode] = { total: 0, correct: 0, accuracy: 0 };
    }
    modeBreakdown[mode].total++;
    if (log.isCorrect) modeBreakdown[mode].correct++;
  }

  // Calculate percentages
  Object.keys(modeBreakdown).forEach(m => {
    const item = modeBreakdown[m];
    item.accuracy = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
  });

  const first10Accuracy = first10Total > 0 ? Math.round((first10Correct / first10Total) * 100) : 0;
  const after10Accuracy = after10Total > 0 ? Math.round((after10Correct / after10Total) * 100) : 0;
  const overallAccuracy = Math.round((totalCorrect / total) * 100);
  const avgAnswerTime = Math.round((totalTime / total) * 10) / 10;
  const accuracyTrendDiff = after10Total > 0 && first10Total > 0 ? after10Accuracy - first10Accuracy : 0;
  const totalWrong = total - totalCorrect;

  // Top mistaken elements sorted by count descending
  const topMistakenElements: MistakenElementStat[] = Object.entries(mistakenElementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([symbol, count]) => ({
      symbol,
      count,
      percentage: totalMistakes > 0 ? Math.round((count / totalMistakes) * 100) : 0
    }));

  return {
    totalAnswered: total,
    totalCorrect,
    totalWrong,
    overallAccuracy,
    first10MinTotal: first10Total,
    first10MinCorrect: first10Correct,
    first10MinAccuracy: first10Accuracy,
    after10MinTotal: after10Total,
    after10MinCorrect: after10Correct,
    after10MinAccuracy: after10Accuracy,
    accuracyTrendDiff,
    avgAnswerTime,
    modeBreakdown,
    topMistakenElements
  };
}

/**
 * Generate CSV and trigger browser download for Excel / Looker Studio analysis
 */
export function downloadPlayLogsCSV(logs: PlayLogEvent[], filenamePrefix: string = 'chemistry_play_logs'): void {
  if (logs.length === 0) {
    alert('ยังไม่มีข้อมูลการเล่นในระบบ กรุณาลองเล่นสัก 1-2 ข้อก่อนดาวน์โหลดครับ');
    return;
  }

  // CSV Columns Header
  const headers = [
    'Log ID',
    'Session ID',
    'User ID',
    'Game Mode',
    'Question ID / Topic',
    'Element Symbol',
    'Is Correct',
    'Answer Time (Seconds)',
    'Session Duration (Seconds)',
    'Session Duration (Minutes)',
    'Time Window',
    'Timestamp (ISO)'
  ];

  const escapeCSV = (val: string | number | boolean | undefined | null): string => {
    if (val === undefined || val === null) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = logs.map(l => {
    const durationMin = (l.sessionDuration / 60).toFixed(2);
    const windowTag = l.sessionDuration <= 600 ? 'First 10 Minutes' : 'After 10 Minutes';
    return [
      escapeCSV(l.id || ''),
      escapeCSV(l.sessionId),
      escapeCSV(l.userId),
      escapeCSV(l.gameMode || 'quiz'),
      escapeCSV(l.questionId),
      escapeCSV(l.elementSymbol || ''),
      escapeCSV(l.isCorrect ? 'TRUE' : 'FALSE'),
      escapeCSV(l.answerTime),
      escapeCSV(l.sessionDuration),
      escapeCSV(durationMin),
      escapeCSV(windowTag),
      escapeCSV(l.timestamp)
    ].join(',');
  });

  // Include UTF-8 BOM (\uFEFF) so Excel correctly displays Thai characters & dates
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
