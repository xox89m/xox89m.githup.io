import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, BattleRoomState, BattleQuestion } from '../types';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { ELEMENTS } from '../data/elements';
import { Swords, Trophy, Clock, Zap, ArrowLeft, Flame, CheckCircle, XCircle, Users } from 'lucide-react';

// Local generator for offline / GitHub Pages play
function generateLocalDuelQuestions(count = 5): BattleQuestion[] {
  const shuffled = [...ELEMENTS].sort(() => Math.random() - 0.5);
  const questions: BattleQuestion[] = [];

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const el = shuffled[i];
    const type = i % 3;

    if (type === 0) {
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
    } else {
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
        explanation: `${el.nameTH} อยู่ในหมู่ ${el.group} คาบที่ ${el.period}`,
        elementSymbol: el.symbol
      });
    }
  }

  return questions;
}

interface Props {
  user: UserProfile;
  onBackToMenu: () => void;
  onAddScore: (points: number, wonMatch?: boolean, combo?: number) => void;
}

export const ModeRealtimeBattle: React.FC<Props> = ({ user, onBackToMenu, onAddScore }) => {
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'playing' | 'ended'>('idle');
  const [roomState, setRoomState] = useState<BattleRoomState | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [matchResultHandled, setMatchResultHandled] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/battle`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to battle server');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'battle:state') {
          const room: BattleRoomState = data.room;
          setRoomState(room);

          if (room.status === 'playing') {
            if (matchStatus !== 'playing') {
              soundManager.playBattleStart();
            }
            setMatchStatus('playing');
          } else if (room.status === 'ended') {
            setMatchStatus('ended');
          }
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'battle:leave' }));
      }
      ws.close();
    };
  }, []);

  // Matchmaking action
  const handleStartMatchmaking = () => {
    setMatchStatus('searching');
    setMatchResultHandled(false);
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentQIndex(0);
    setTimeLeft(15);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'battle:matchmake',
          user
        })
      );
    } else {
      // Offline / GitHub Pages fallback: match with a simulated chemist bot
      setTimeout(() => {
        const botNames = ['น้องนุ่นรักตารางธาตุ ✨', 'บอสไอโซโทป ⚡', 'ดร.เคมีพิสดาร 🧪', 'เด็กสายวิทย์_007 🎯'];
        const randomBotName = botNames[Math.floor(Math.random() * botNames.length)];
        const questions = generateLocalDuelQuestions(5);
        const botId = `bot-${Date.now()}`;
        setRoomState({
          roomId: `local-${Date.now()}`,
          status: 'playing',
          players: {
            [user.id]: {
              userId: user.id,
              name: user.name,
              avatar: user.avatar,
              score: 0,
              combo: 0,
              answers: []
            },
            [botId]: {
              userId: botId,
              name: randomBotName,
              avatar: '🤖',
              score: 0,
              combo: 0,
              answers: []
            }
          },
          currentQuestionIndex: 0,
          questions,
          winnerId: null
        });
        soundManager.playBattleStart();
        setMatchStatus('playing');
      }, 1200);
    }
  };

  // Timer loop for active question
  useEffect(() => {
    if (matchStatus === 'playing' && !isAnswered) {
      questionStartTimeRef.current = Date.now();
      setTimeLeft(15);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up: submit wrong answer automatically
            handleAnswerOption(-1);
            return 0;
          }
          if (prev <= 5) {
            soundManager.playTick(true);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matchStatus, currentQIndex, isAnswered]);

  const handleAnswerOption = (index: number) => {
    if (isAnswered || !roomState || !roomState.questions[currentQIndex]) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsAnswered(true);
    setSelectedOption(index);

    const q = roomState.questions[currentQIndex];
    const isCorrect = index === q.correctIndex;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }

    const timeSpentSec = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'battle:answer',
          roomId: roomState.roomId,
          userId: user.id,
          isCorrect,
          timeSpentSec
        })
      );
    } else {
      // Local bot answer scoring simulation
      const opponentBotId = Object.keys(roomState.players).find(id => id !== user.id);
      const points = isCorrect ? Math.max(10, 20 - timeSpentSec) * 10 : 0;
      const botCorrect = Math.random() > 0.35;
      const botPoints = botCorrect ? Math.floor(Math.random() * 60 + 80) : 0;

      setRoomState(prev => {
        if (!prev) return null;
        const myScore = (prev.players[user.id]?.score || 0) + points;
        const myCombo = isCorrect ? (prev.players[user.id]?.combo || 0) + 1 : 0;
        const botScore = (opponentBotId ? prev.players[opponentBotId]?.score || 0 : 0) + botPoints;
        const isLastQ = currentQIndex + 1 >= prev.questions.length;

        let winnerId: string | null = null;
        if (isLastQ) {
          if (myScore > botScore) winnerId = user.id;
          else if (botScore > myScore) winnerId = opponentBotId || 'bot';
          else winnerId = 'draw';
        }

        return {
          ...prev,
          status: isLastQ ? 'ended' : 'playing',
          winnerId,
          players: {
            ...prev.players,
            [user.id]: {
              ...prev.players[user.id],
              score: myScore,
              combo: myCombo
            },
            ...(opponentBotId ? {
              [opponentBotId]: {
                ...prev.players[opponentBotId],
                score: botScore
              }
            } : {})
          }
        };
      });

      if (currentQIndex + 1 >= roomState.questions.length) {
        setTimeout(() => setMatchStatus('ended'), 1200);
      }
    }

    // Delay next question
    setTimeout(() => {
      setSelectedOption(null);
      setIsAnswered(false);
      setFeedback(null);
      if (currentQIndex + 1 < roomState.questions.length) {
        setCurrentQIndex((prev) => prev + 1);
      }
    }, 1200);
  };

  // Handle Battle Finished & Award Points
  useEffect(() => {
    if (matchStatus === 'ended' && roomState && !matchResultHandled) {
      setMatchResultHandled(true);
      const isWinner = roomState.winnerId === user.id;
      const isDraw = roomState.winnerId === 'draw';

      if (isWinner) {
        soundManager.playVictory();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        onAddScore(250, true, 3);
      } else if (isDraw) {
        soundManager.playClick();
        onAddScore(120, false, 1);
      } else {
        soundManager.playWrong();
        onAddScore(80, false, 0);
      }
    }
  }, [matchStatus, roomState, matchResultHandled, user.id, onAddScore]);

  // Identify players
  const myPlayer = roomState ? roomState.players[user.id] : null;
  const opponentId = roomState
    ? Object.keys(roomState.players).find((id) => id !== user.id)
    : null;
  const opponentPlayer = opponentId && roomState ? roomState.players[opponentId] : null;
  const totalQuestions = roomState?.questions?.length || 5;

  return (
    <div
      className="w-full max-w-lg mx-auto p-4 flex flex-col min-h-[85vh] justify-between"
      style={{ fontFamily: "'Mali', 'Sarabun', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-2 border-slate-900 dark:border-zinc-800 bg-white dark:bg-black p-3 rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] transition-colors">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับเมนู</span>
        </button>

        <div className="flex items-center gap-1.5 text-sm font-black text-rose-600 dark:text-rose-400">
          <Swords className="h-5 w-5" />
          <span>ศึกดวลสดเรียลไทม์ 1v1</span>
        </div>

        <div className="bg-amber-100 dark:bg-zinc-900 border border-amber-300 dark:border-zinc-700 text-amber-900 dark:text-amber-300 text-xs font-bold py-1 px-2.5 rounded-xl">
          Lv.{user.level}
        </div>
      </div>

      {/* STATE 1: IDLE */}
      {matchStatus === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 bg-white dark:bg-black border-3 border-slate-900 dark:border-zinc-800 rounded-3xl p-6 shadow-[6px_6px_0px_#1e293b] dark:shadow-[6px_6px_0px_#27272a] transition-colors">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-500 to-orange-400 text-5xl shadow-lg border-2 border-slate-900 dark:border-zinc-700 animate-pulse">
              ⚔️
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-300 border-2 border-slate-900 rounded-full p-1.5 text-xs font-black text-slate-950">
              LIVE
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">แข่งขันความเร็วตารางธาตุ</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
              ตอบคำถามเกี่ยวกับธาตุ หมู่ คาบ และสัญลักษณ์ แข่งกับผู้เล่นอื่นแบบสด ๆ ตอบเร็วยิ่งได้คะแนนโบนัสสะสมสูง!
            </p>
          </div>

          <div className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-xs space-y-2 text-slate-700 dark:text-slate-300 text-left">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              <Zap className="h-4 w-4 text-amber-500" />
              กติกาดวลสด:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
              <li>การแข่งขันมี 5 ข้อ ตอบพร้อมกันแบบเรียลไทม์</li>
              <li>ตอบถูกได้แต้มพื้นฐาน 100 แต้ม + โบนัสคอมโบ</li>
              <li>เวลา 15 วินาทีต่อข้อ ยิ่งตอบไวยิ่งได้แต้มความเร็วเพิ่ม</li>
              <li>ผู้ชนะรับแต้มสะสม +250 EXP สู่กระดานผู้นำ</li>
            </ul>
          </div>

          <button
            onClick={handleStartMatchmaking}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 active:scale-98 text-white font-black text-lg shadow-lg border-2 border-slate-900 dark:border-zinc-700 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Swords className="h-6 w-6" />
            <span>ค้นหาคู่ต่อสู้ทันที</span>
          </button>
        </div>
      )}

      {/* STATE 2: SEARCHING */}
      {matchStatus === 'searching' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 bg-white dark:bg-black border-3 border-slate-900 dark:border-zinc-800 rounded-3xl p-6 shadow-[6px_6px_0px_#1e293b] dark:shadow-[6px_6px_0px_#27272a] transition-colors">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 dark:bg-zinc-900 text-4xl border-2 border-slate-900 dark:border-zinc-700 animate-spin">
              🧪
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">กำลังจับคู่ดวลสด...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">กำลังเชื่อมต่อสัญญาณกับนักเคมีออนไลน์</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-cyan-300 bg-blue-50 dark:bg-cyan-950/70 px-4 py-2 rounded-full border border-blue-200 dark:border-cyan-800">
            <Users className="h-4 w-4 animate-bounce" />
            <span>ระบบกำลังจับคู่ให้อัตโนมัติ (ไม่เกิน 3 วินาที)</span>
          </div>

          <button
            onClick={() => setMatchStatus('idle')}
            className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700 cursor-pointer"
          >
            ยกเลิกการค้นหา
          </button>
        </div>
      )}

      {/* STATE 3: PLAYING */}
      {matchStatus === 'playing' && roomState && (
        <div className="flex-1 flex flex-col space-y-4">
          {/* Live Opponent vs You Scoreboard HUD */}
          <div className="grid grid-cols-2 gap-3 bg-white dark:bg-black border-2 border-slate-900 dark:border-zinc-800 rounded-2xl p-3.5 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] transition-colors">
            {/* YOU */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl">{user.avatar}</span>
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[80px]">คุณ</span>
                </div>
                <div className="font-black text-blue-600 dark:text-cyan-400 text-base">{myPlayer?.score || 0}</div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-slate-300 dark:border-zinc-700">
                <div
                  className="bg-blue-500 dark:bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${((myPlayer?.currentQuestionIndex || 0) / totalQuestions) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <span>ข้อ {Math.min((myPlayer?.currentQuestionIndex || 0) + 1, totalQuestions)}/{totalQuestions}</span>
                {myPlayer && myPlayer.combo > 1 && (
                  <span className="text-amber-500 flex items-center">
                    <Flame className="h-3 w-3" /> x{myPlayer.combo}
                  </span>
                )}
              </div>
            </div>

            {/* OPPONENT */}
            <div className="space-y-1 border-l-2 border-slate-200 dark:border-zinc-800 pl-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl">{opponentPlayer?.avatar || '🤖'}</span>
                  <span className="font-bold text-xs text-rose-800 dark:text-rose-300 truncate max-w-[80px]">
                    {opponentPlayer?.name || 'คู่แข่ง'}
                  </span>
                </div>
                <div className="font-black text-rose-600 dark:text-rose-400 text-base">{opponentPlayer?.score || 0}</div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-slate-300 dark:border-zinc-700">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${((opponentPlayer?.currentQuestionIndex || 0) / totalQuestions) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <span>ข้อ {Math.min((opponentPlayer?.currentQuestionIndex || 0) + 1, totalQuestions)}/{totalQuestions}</span>
                {opponentPlayer && opponentPlayer.combo > 1 && (
                  <span className="text-orange-500 flex items-center">
                    <Flame className="h-3 w-3" /> x{opponentPlayer.combo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Question Card */}
          {roomState.questions[currentQIndex] ? (
            <div className="flex-1 flex flex-col justify-between bg-white dark:bg-black border-2 border-slate-900 dark:border-zinc-800 rounded-3xl p-5 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] space-y-4 transition-colors">
              {/* Question Header & Timer */}
              <div className="flex items-center justify-between">
                <span className="bg-yellow-300 border-2 border-slate-900 text-slate-900 text-xs font-black px-2.5 py-1 rounded-xl">
                  คำถามข้อที่ {currentQIndex + 1}
                </span>

                <div className={`flex items-center gap-1 text-sm font-black px-3 py-1 rounded-xl border-2 border-slate-900 dark:border-zinc-700 ${
                  timeLeft <= 5 ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 animate-pulse border-rose-500' : 'bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-slate-200'
                }`}>
                  <Clock className="h-4 w-4" />
                  <span>{timeLeft}s</span>
                </div>
              </div>

              {/* Question text */}
              <div className="text-center py-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {roomState.questions[currentQIndex].question}
                </h3>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                {roomState.questions[currentQIndex].options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === roomState.questions[currentQIndex].correctIndex;

                  let btnStyle = 'bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-slate-900 dark:border-zinc-700 text-slate-800 dark:text-slate-100';
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-600 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-rose-100 dark:bg-rose-950/80 border-rose-600 dark:border-rose-500 text-rose-900 dark:text-rose-200 animate-shake';
                    } else {
                      btnStyle = 'opacity-50 border-slate-300 dark:border-zinc-800 text-slate-400 dark:text-zinc-600';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleAnswerOption(idx)}
                      className={`p-3.5 rounded-2xl border-2 font-bold text-sm shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#27272a] transition active:scale-98 flex items-center justify-center text-center cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback toast */}
              <div className="h-6 flex items-center justify-center text-xs font-bold">
                {feedback === 'correct' && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> ถูกต้อง! +คะแนนความเร็ว
                  </span>
                )}
                {feedback === 'wrong' && (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> ยังไม่ถูกต้อง!
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-black border-2 border-slate-900 dark:border-zinc-800 rounded-3xl p-6 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] transition-colors">
              <div className="text-center space-y-2">
                <span className="text-4xl">⏳</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">คุณตอบครบทุกข้อแล้ว!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">กำลังรอผลการตอบจากคู่แข่ง...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 4: ENDED (Match Result) */}
      {matchStatus === 'ended' && roomState && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 bg-white dark:bg-black border-3 border-slate-900 dark:border-zinc-800 rounded-3xl p-6 shadow-[6px_6px_0px_#1e293b] dark:shadow-[6px_6px_0px_#27272a] transition-colors">
          {roomState.winnerId === user.id ? (
            <div className="space-y-2">
              <div className="inline-block p-4 bg-yellow-100 dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 rounded-3xl text-5xl animate-bounce shadow-md">
                🏆
              </div>
              <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400">ยินดีด้วย! คุณเป็นฝ่ายชนะ</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">ได้รับแต้มสะสม +250 EXP</p>
            </div>
          ) : roomState.winnerId === 'draw' ? (
            <div className="space-y-2">
              <div className="inline-block p-4 bg-blue-100 dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 rounded-3xl text-5xl shadow-md">
                🤝
              </div>
              <h2 className="text-2xl font-black text-blue-600 dark:text-cyan-400">เสมอกันอย่างสูสี!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">ได้รับแต้มสะสม +120 EXP</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="inline-block p-4 bg-slate-100 dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 rounded-3xl text-5xl shadow-md">
                💪
              </div>
              <h2 className="text-2xl font-black text-slate-700 dark:text-slate-200">พ่ายแพ้ในศึกนี้</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">ได้รับแต้มปลอบใจ +80 EXP สู้ใหม่อีกครั้ง!</p>
            </div>
          )}

          {/* Final Score Comparison */}
          <div className="w-full grid grid-cols-2 gap-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl">{user.avatar}</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">คุณ</div>
              <div className="text-2xl font-black text-blue-600 dark:text-cyan-400">{myPlayer?.score || 0}</div>
            </div>
            <div className="space-y-1 border-l border-slate-200 dark:border-zinc-800">
              <div className="text-2xl">{opponentPlayer?.avatar || '🤖'}</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {opponentPlayer?.name || 'คู่แข่ง'}
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{opponentPlayer?.score || 0}</div>
            </div>
          </div>

          <div className="w-full space-y-2 pt-2">
            <button
              onClick={handleStartMatchmaking}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md border-2 border-slate-900 dark:border-zinc-700 transition cursor-pointer"
            >
              ดวลต่ออีกรอบ (Rematch)
            </button>
            <button
              onClick={onBackToMenu}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-zinc-700 transition cursor-pointer"
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
