import React, { useState, useEffect, useRef } from 'react';
import { PeriodicElement, UserProfile } from '../types';
import { ELEMENTS, CATEGORY_INFO } from '../data/elements';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { trackAnswerEvent } from '../services/analytics';
import { ArrowLeft, Heart, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  user?: UserProfile;
  onBackToMenu: () => void;
  onAddScore: (points: number, wonMatch?: boolean, combo?: number) => void;
  onRecordPropertyMatch?: () => void;
}

export const ModePropertyMatch: React.FC<Props> = ({ user, onBackToMenu, onAddScore, onRecordPropertyMatch }) => {
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const lastAttemptTimeRef = useRef<number>(Date.now());

  // Cards
  const [symbolCards, setSymbolCards] = useState<PeriodicElement[]>([]);
  const [propertyCards, setPropertyCards] = useState<PeriodicElement[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [matchedSymbols, setMatchedSymbols] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong' } | null>(null);

  const startRound = (currentStage = stage) => {
    setSelectedSymbol(null);
    setSelectedProperty(null);
    setFeedback(null);

    const pairCount = Math.min(3 + (currentStage - 1), 6);
    const chosen = [...ELEMENTS].sort(() => Math.random() - 0.5).slice(0, pairCount);

    setSymbolCards([...chosen].sort(() => Math.random() - 0.5));
    setPropertyCards([...chosen].sort(() => Math.random() - 0.5));
    setMatchedSymbols([]);
  };

  useEffect(() => {
    startRound(1);
  }, []);

  const handleSelectSymbol = (symbol: string) => {
    if (matchedSymbols.includes(symbol)) return;
    soundManager.playClick();
    setSelectedSymbol(symbol);
    checkMatch(symbol, selectedProperty);
  };

  const handleSelectProperty = (symbol: string) => {
    if (matchedSymbols.includes(symbol)) return;
    soundManager.playClick();
    setSelectedProperty(symbol);
    checkMatch(selectedSymbol, symbol);
  };

  const checkMatch = (sym: string | null, prop: string | null) => {
    if (!sym || !prop) return;

    const now = Date.now();
    const rawTime = Math.round((now - lastAttemptTimeRef.current) / 100) / 10;
    const answerTime = Math.max(0.5, Math.min(rawTime, 30));
    lastAttemptTimeRef.current = now;

    const isCorrect = sym === prop;

    // Track analytics event to Firestore
    trackAnswerEvent({
      userId: user?.id || user?.name || 'guest',
      questionId: `match_s${stage}_${sym}`,
      elementSymbol: sym,
      gameMode: 'property-match',
      isCorrect,
      answerTime
    });

    if (isCorrect) {
      // MATCH!
      soundManager.playMatchSuccess();
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.6 }
      });

      const newMatched = [...matchedSymbols, sym];
      setMatchedSymbols(newMatched);

      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(Math.max(maxCombo, newCombo));

      const points = Math.min(newCombo, 5) * 10;
      setScore(prev => prev + points);
      onAddScore(points, false, newCombo);
      onRecordPropertyMatch?.();

      setFeedback({ text: `✅ จับคู่ถูกต้อง! +${points} แต้ม`, type: 'correct' });

      setSelectedSymbol(null);
      setSelectedProperty(null);

      // Check if all pairs cleared
      if (newMatched.length >= symbolCards.length) {
        soundManager.playVictory();
        setTimeout(() => {
          const nextStage = stage + 1;
          setStage(nextStage);
          startRound(nextStage);
        }, 800);
      }
    } else {
      // MISMATCH!
      soundManager.playWrong();
      setFeedback({ text: '❌ ยังไม่ตรงกัน ลองใหม่อีกครั้ง!', type: 'wrong' });
      setCombo(0);
      const newLives = lives - 1;
      setLives(newLives);

      setTimeout(() => {
        setSelectedSymbol(null);
        setSelectedProperty(null);
      }, 500);

      if (newLives <= 0) {
        setTimeout(() => {
          setIsGameOver(true);
        }, 500);
      }
    }
  };

  const handleRestart = () => {
    setIsGameOver(false);
    setLives(3);
    setScore(0);
    setCombo(0);
    setStage(1);
    startRound(1);
  };

  return (
    <div
      className="w-full max-w-xl mx-auto p-4 flex flex-col space-y-4"
      style={{ fontFamily: "'Mali', 'Sarabun', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-2 border-slate-900 dark:border-zinc-800 bg-white dark:bg-black p-3 rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a]">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>เมนู</span>
        </button>

        <div className="text-center">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">ด่านที่ {stage}</div>
          <div className="text-sm font-black text-blue-600 dark:text-cyan-400">คะแนน: {score}</div>
        </div>

        <div className="flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={`h-4 w-4 ${
                i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-300 dark:text-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Board */}
      <div className="bg-white/95 dark:bg-black border-3 border-slate-900 dark:border-zinc-800 rounded-3xl p-5 shadow-[6px_6px_0px_#1e293b] dark:shadow-[6px_6px_0px_#27272a] space-y-4">
        <div className="bg-blue-100 dark:bg-cyan-950/70 border-2 border-slate-900 dark:border-cyan-800 p-2.5 rounded-xl text-xs font-bold text-blue-900 dark:text-cyan-200 text-center shadow-xs">
          🔗 แตะเลือกสัญลักษณ์ธาตุทางซ้าย แล้วแตะคุณสมบัติที่ตรงกันทางขวา!
        </div>

        {/* 2 Columns: Symbols vs Properties */}
        <div className="grid grid-cols-2 gap-3">
          {/* Column 1: Symbol Cards */}
          <div className="space-y-2.5">
            <div className="text-xs font-black text-slate-700 dark:text-slate-300 text-center pb-1 border-b-2 border-slate-200 dark:border-zinc-800">
              สัญลักษณ์ธาตุ
            </div>
            {symbolCards.map(el => {
              const isMatched = matchedSymbols.includes(el.symbol);
              const isSelected = selectedSymbol === el.symbol;
              const cat = CATEGORY_INFO[el.category];

              return (
                <button
                  key={el.symbol}
                  disabled={isMatched}
                  onClick={() => handleSelectSymbol(el.symbol)}
                  className={`w-full p-3 rounded-2xl border-2 border-slate-900 dark:border-zinc-700 flex flex-col items-center justify-center transition active:scale-95 cursor-pointer shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#27272a] ${
                    isMatched
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-300 opacity-40 scale-95 shadow-none'
                      : isSelected
                      ? 'bg-amber-300 scale-105 border-amber-600 ring-2 ring-amber-400 text-slate-950'
                      : `${cat.bg} hover:bg-white dark:hover:bg-zinc-900`
                  }`}
                >
                  <span className={`text-2xl font-black ${isSelected ? 'text-slate-950' : 'text-slate-900 dark:text-white'}`}>{el.symbol}</span>
                  <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-700 dark:text-cyan-200'}`}>{el.nameTH}</span>
                </button>
              );
            })}
          </div>

          {/* Column 2: Property Cards */}
          <div className="space-y-2.5">
            <div className="text-xs font-black text-slate-700 dark:text-slate-300 text-center pb-1 border-b-2 border-slate-200 dark:border-zinc-800">
              คุณสมบัติเด่น
            </div>
            {propertyCards.map(el => {
              const isMatched = matchedSymbols.includes(el.symbol);
              const isSelected = selectedProperty === el.symbol;

              return (
                <button
                  key={`prop-${el.symbol}`}
                  disabled={isMatched}
                  onClick={() => handleSelectProperty(el.symbol)}
                  className={`w-full p-3 min-h-[66px] rounded-2xl border-2 border-slate-900 dark:border-zinc-700 flex items-center justify-center text-center text-xs font-bold transition active:scale-95 cursor-pointer shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#27272a] ${
                    isMatched
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-300 opacity-40 scale-95 shadow-none'
                      : isSelected
                      ? 'bg-amber-300 scale-102 border-amber-600 ring-2 ring-amber-400 text-slate-900'
                      : 'bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <span>{el.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-center text-xs font-bold border ${
              feedback.type === 'correct'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border-3 border-slate-900 dark:border-zinc-800 bg-white dark:bg-black p-6 shadow-2xl text-center space-y-4">
            <div className="text-5xl">💥</div>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">GAME OVER</h3>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">คะแนนรอบนี้: {score} แต้ม</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Max Combo: x{maxCombo}</p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md border-2 border-slate-900 dark:border-zinc-800 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>เล่นใหม่อีกครั้ง</span>
              </button>
              <button
                onClick={onBackToMenu}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-zinc-700 cursor-pointer"
              >
                กลับเมนูหลัก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
