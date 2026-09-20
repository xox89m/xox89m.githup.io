import React, { useState, useEffect } from 'react';
import { PeriodicElement } from '../types';
import { ELEMENTS, CATEGORY_INFO, LEVEL1_GROUP_PROGRESSION, TUTORIAL_CONFIG } from '../data/elements';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { ArrowLeft, Compass, Search, Sparkles, Heart, RefreshCw } from 'lucide-react';

interface Props {
  onBackToMenu: () => void;
  onAddScore: (points: number, wonMatch?: boolean, combo?: number) => void;
}

export const ModeGridPlacement: React.FC<Props> = ({ onBackToMenu, onAddScore }) => {
  const [isTutorial, setIsTutorial] = useState(true);
  const [groupStageIndex, setGroupStageIndex] = useState(0);
  const [missingStep, setMissingStep] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong' | 'info' } | null>(null);

  // Active elements in grid
  const [activeGroups, setActiveGroups] = useState<number[]>([1]);
  const [missingSymbols, setMissingSymbols] = useState<string[]>([]);
  const [trayCards, setTrayCards] = useState<{ el: PeriodicElement; isDistractor: boolean }[]>([]);
  const [placedSymbols, setPlacedSymbols] = useState<string[]>([]);

  // Mobile Selection state (Tap card then tap target slot)
  const [selectedTraySymbol, setSelectedTraySymbol] = useState<string | null>(null);
  const [highlightedSlot, setHighlightedSlot] = useState<string | null>(null);

  // Trivia Modal
  const [activeTrivia, setActiveTrivia] = useState<PeriodicElement | null>(null);
  const [isRoundClear, setIsRoundClear] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Initialize round
  const setupRound = (tutorial = false, stageIdx = 0, step = 1) => {
    setSelectedTraySymbol(null);
    setHighlightedSlot(null);
    setFeedback(null);

    const groups = tutorial ? TUTORIAL_CONFIG.activeGroups : LEVEL1_GROUP_PROGRESSION[stageIdx];
    setActiveGroups(groups);

    const elementsInGroups = ELEMENTS.filter(e => groups.includes(e.group));
    let missingList: PeriodicElement[] = [];

    if (tutorial) {
      const fixed = elementsInGroups.find(e => e.symbol === TUTORIAL_CONFIG.fixedSymbol);
      missingList = fixed ? [fixed] : [];
    } else {
      const count = Math.min(step, elementsInGroups.length);
      const shuffled = [...elementsInGroups].sort(() => Math.random() - 0.5);
      missingList = shuffled.slice(0, count);
    }

    const missingSyms = missingList.map(e => e.symbol);
    setMissingSymbols(missingSyms);
    setPlacedSymbols([]);

    // Distractors
    let distractors: PeriodicElement[] = [];
    if (!tutorial && step >= 4) {
      const outside = ELEMENTS.filter(e => !groups.includes(e.group));
      distractors = [...outside].sort(() => Math.random() - 0.5).slice(0, 1);
    }

    const tray = [
      ...missingList.map(el => ({ el, isDistractor: false })),
      ...distractors.map(el => ({ el, isDistractor: true }))
    ].sort(() => Math.random() - 0.5);

    setTrayCards(tray);
  };

  useEffect(() => {
    setupRound(true, 0, 1);
  }, []);

  const handleSelectTrayCard = (symbol: string) => {
    const el = ELEMENTS.find(e => e.symbol === symbol);
    if (el) {
      soundManager.playElementSound(el.atomicNumber);
    } else {
      soundManager.playClick();
    }
    setSelectedTraySymbol(prev => (prev === symbol ? null : symbol));
  };

  const handleSlotClick = (expectedSymbol: string) => {
    if (!selectedTraySymbol) {
      soundManager.playClick();
      setFeedback({ text: '💡 แตะเลือกการ์ดธาตุด้านล่างก่อน แล้วแตะช่องว่าง!', type: 'info' });
      return;
    }

    if (selectedTraySymbol === expectedSymbol) {
      // Correct!
      handleCorrectPlacement(expectedSymbol);
    } else {
      // Wrong!
      handleWrongPlacement();
    }
  };

  const handleCorrectPlacement = (symbol: string) => {
    const el = ELEMENTS.find(e => e.symbol === symbol);
    if (!el) return;

    soundManager.playMatchSuccess();

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 }
    });

    const newPlaced = [...placedSymbols, symbol];
    setPlacedSymbols(newPlaced);
    setTrayCards(prev => prev.filter(c => c.el.symbol !== symbol));
    setSelectedTraySymbol(null);

    const newCombo = combo + 1;
    setCombo(newCombo);
    setMaxCombo(Math.max(maxCombo, newCombo));

    const points = Math.min(newCombo, 5) * 10;
    setScore(prev => prev + points);
    onAddScore(points, false, newCombo);

    setFeedback({ text: `✅ ถูกต้อง! +${points} แต้ม`, type: 'correct' });

    const roundFinished = newPlaced.length >= missingSymbols.length;
    setIsRoundClear(roundFinished);

    if (roundFinished) {
      soundManager.playVictory();
    }

    setTimeout(() => {
      setActiveTrivia(el);
    }, 350);
  };

  const handleWrongPlacement = () => {
    soundManager.playWrong();
    setFeedback({ text: '❌ ยังไม่ถูกต้อง ลองดูหมู่และคาบอีกครั้ง!', type: 'wrong' });
    setSelectedTraySymbol(null);

    if (!isTutorial) {
      setCombo(0);
      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setTimeout(() => {
          setIsGameOver(true);
        }, 500);
      }
    }
  };

  // Hint toolbar handlers
  const handleLocatorHint = () => {
    soundManager.playLifeline();
    const remaining = missingSymbols.filter(s => !placedSymbols.includes(s));
    if (remaining.length === 0) return;
    const el = ELEMENTS.find(e => e.symbol === remaining[0]);
    if (el) {
      setFeedback({ text: `🧭 Locator: ธาตุนี้อยู่หมู่ ${el.group}`, type: 'info' });
    }
  };

  const handleScannerHint = () => {
    soundManager.playLifeline();
    const remaining = missingSymbols.filter(s => !placedSymbols.includes(s));
    if (remaining.length === 0) return;
    const el = ELEMENTS.find(e => e.symbol === remaining[0]);
    if (el) {
      setFeedback({ text: `🔎 Scanner: ธาตุนี้อยู่คาบที่ ${el.period}`, type: 'info' });
    }
  };

  const handleRadarHint = () => {
    soundManager.playLifeline();
    const remaining = missingSymbols.filter(s => !placedSymbols.includes(s));
    if (remaining.length === 0) return;
    setHighlightedSlot(remaining[0]);
    setFeedback({ text: '✨ Radar: ชี้ช่องเป้าหมายแล้ว!', type: 'info' });
    setTimeout(() => setHighlightedSlot(null), 2500);
  };

  const handleCloseTrivia = () => {
    setActiveTrivia(null);

    if (isGameOver) return;

    if (isTutorial) {
      if (isRoundClear) {
        setIsTutorial(false);
        setGroupStageIndex(0);
        setMissingStep(1);
        setScore(0);
        setLives(3);
        setupRound(false, 0, 1);
      }
      return;
    }

    if (isRoundClear) {
      // Advance step or stage
      const currentElements = ELEMENTS.filter(e => activeGroups.includes(e.group));
      if (missingStep >= currentElements.length) {
        if (groupStageIndex < LEVEL1_GROUP_PROGRESSION.length - 1) {
          const nextStage = groupStageIndex + 1;
          setGroupStageIndex(nextStage);
          setMissingStep(1);
          setupRound(false, nextStage, 1);
        } else {
          setMissingStep(prev => prev + 1);
          setupRound(false, groupStageIndex, missingStep + 1);
        }
      } else {
        const nextStep = missingStep + 1;
        setMissingStep(nextStep);
        setupRound(false, groupStageIndex, nextStep);
      }
    }
  };

  const handleRestart = () => {
    setIsGameOver(false);
    setLives(3);
    setScore(0);
    setCombo(0);
    setGroupStageIndex(0);
    setMissingStep(1);
    setupRound(false, 0, 1);
  };

  // Grid columns and rows
  const maxPeriod = Math.max(
    ...ELEMENTS.filter(e => activeGroups.includes(e.group)).map(e => e.period),
    1
  );

  return (
    <div
      className="w-full max-w-xl mx-auto p-4 flex flex-col space-y-4"
      style={{ fontFamily: "'Mali', 'Sarabun', sans-serif" }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-2 border-slate-900 dark:border-zinc-800 bg-white dark:bg-black p-3 rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a]">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>เมนู</span>
        </button>

        <div className="text-center">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
            {isTutorial ? 'บทเรียนเบื้องต้น' : `หมู่ ${activeGroups.join(', ')} · รอบ ${missingStep}`}
          </div>
          <div className="text-sm font-black text-blue-600 dark:text-cyan-400">
            {isTutorial ? 'ทดลองวาง' : `คะแนน: ${score}`}
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm">
          {!isTutorial && (
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
          )}
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="bg-white/95 dark:bg-black border-3 border-slate-900 dark:border-zinc-800 rounded-3xl p-4 shadow-[6px_6px_0px_#1e293b] dark:shadow-[6px_6px_0px_#27272a] space-y-3">
        {/* Instruction badge */}
        <div className="bg-yellow-200 dark:bg-yellow-950/70 border-2 border-slate-900 dark:border-yellow-700 p-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-yellow-200 text-center shadow-xs">
          {isTutorial
            ? '👉 แตะการ์ดธาตุด้านล่าง แล้วแตะที่ช่องว่างเพื่อวางให้ตรงตำแหน่ง!'
            : 'สังเกตหมู่และคาบของธาตุ แล้วแตะเลือกมาวางให้ครบ!'}
        </div>

        {/* Dynamic Periodic Grid */}
        <div className="overflow-x-auto py-2">
          <div
            className="grid gap-2 mx-auto justify-center"
            style={{
              gridTemplateColumns: `repeat(${activeGroups.length}, minmax(58px, 68px))`
            }}
          >
            {/* Headers: Group number */}
            {activeGroups.map(g => (
              <div
                key={`g-${g}`}
                className="text-center text-[11px] font-black text-slate-700 dark:text-slate-300 border-b-2 border-slate-900 dark:border-zinc-800 pb-1"
              >
                หมู่ {g}
              </div>
            ))}

            {/* Grid Cells */}
            {Array.from({ length: maxPeriod }).map((_, periodIndex) => {
              const currentPeriod = periodIndex + 1;
              return activeGroups.map(g => {
                const el = ELEMENTS.find(e => e.group === g && e.period === currentPeriod);

                if (!el) {
                  return <div key={`empty-${g}-${currentPeriod}`} className="h-16 w-full" />;
                }

                const isMissing = missingSymbols.includes(el.symbol);
                const isPlaced = placedSymbols.includes(el.symbol);
                const cat = CATEGORY_INFO[el.category];
                const isRadarTarget = highlightedSlot === el.symbol;

                if (isMissing && !isPlaced) {
                  // Empty slot waiting for input
                  return (
                    <button
                      key={el.symbol}
                      onClick={() => handleSlotClick(el.symbol)}
                      className={`h-16 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition cursor-pointer ${
                        isRadarTarget
                          ? 'border-rose-500 bg-rose-100 dark:bg-rose-950/80 animate-pulse scale-105 shadow-md'
                          : selectedTraySymbol
                          ? 'border-amber-500 bg-yellow-50 dark:bg-amber-950/60 hover:bg-yellow-100 scale-102'
                          : 'border-slate-400 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-950 text-slate-400 dark:text-zinc-500'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-400">?</span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold">คาบ {el.period}</span>
                    </button>
                  );
                }

                // Filled Element Cell
                return (
                  <div
                    key={el.symbol}
                    className={`h-16 w-full rounded-xl border-2 border-slate-900 dark:border-zinc-700 ${cat.bg} flex flex-col items-center justify-center shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] p-1 text-center`}
                  >
                    <span className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {el.symbol}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-cyan-200 truncate max-w-[50px]">
                      {el.nameTH}
                    </span>
                    <span className="text-[8px] text-slate-500 dark:text-slate-400">{el.atomicNumber}</span>
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* Tray of Cards */}
        <div className="border-t-2 border-dashed border-slate-300 dark:border-zinc-800 pt-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>คลังธาตุที่ต้องวาง (แตะเพื่อเลือก):</span>
            {selectedTraySymbol && (
              <span className="text-blue-600 dark:text-cyan-400 font-bold animate-pulse">
                เลือก: {selectedTraySymbol}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center min-h-[75px] p-2 rounded-2xl bg-slate-100/70 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            {trayCards.map(({ el }) => {
              const isSelected = selectedTraySymbol === el.symbol;
              const cat = CATEGORY_INFO[el.category];

              return (
                <button
                  key={el.symbol}
                  onClick={() => handleSelectTrayCard(el.symbol)}
                  className={`h-16 w-16 rounded-2xl border-2 border-slate-900 dark:border-zinc-700 flex flex-col items-center justify-center transition active:scale-95 cursor-pointer shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#27272a] ${
                    isSelected
                      ? 'bg-amber-300 -translate-y-1 scale-105 border-amber-600 ring-2 ring-amber-400 text-slate-950'
                      : `${cat.bg} hover:bg-white dark:hover:bg-zinc-900`
                  }`}
                >
                  <span className={`text-lg font-black leading-tight ${isSelected ? 'text-slate-950' : 'text-slate-900 dark:text-white'}`}>
                    {el.symbol}
                  </span>
                  <span className={`text-[10px] font-bold truncate max-w-[50px] ${isSelected ? 'text-slate-900' : 'text-slate-700 dark:text-cyan-200'}`}>
                    {el.nameTH}
                  </span>
                </button>
              );
            })}
            {trayCards.length === 0 && (
              <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                🎉 วางธาตุครบทุกช่องแล้ว!
              </div>
            )}
          </div>
        </div>

        {/* Hints Toolbar */}
        {!isTutorial && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={handleLocatorHint}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-800 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] text-xs font-bold text-slate-800 dark:text-slate-200 transition active:translate-y-0.5 cursor-pointer"
            >
              <Compass className="h-4 w-4 text-blue-500 mb-0.5" />
              <span>🧭 Locator</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">บอกหมู่</span>
            </button>
            <button
              onClick={handleScannerHint}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-800 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] text-xs font-bold text-slate-800 dark:text-slate-200 transition active:translate-y-0.5 cursor-pointer"
            >
              <Search className="h-4 w-4 text-emerald-500 mb-0.5" />
              <span>🔎 Scanner</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">บอกคาบ</span>
            </button>
            <button
              onClick={handleRadarHint}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-800 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] text-xs font-bold text-slate-800 dark:text-slate-200 transition active:translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-500 mb-0.5" />
              <span>✨ Radar</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">ชี้ตำแหน่ง</span>
            </button>
          </div>
        )}

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-center text-xs font-bold border ${
              feedback.type === 'correct'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                : feedback.type === 'wrong'
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200'
                : 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* Trivia Knowledge Popup Modal */}
      {activeTrivia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border-3 border-slate-900 dark:border-zinc-800 bg-white dark:bg-black p-6 shadow-2xl text-center space-y-4 -rotate-1">
            <div className="inline-block p-3 rounded-2xl bg-yellow-100 dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 text-3xl mb-1 shadow-sm">
              💡
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-cyan-300">
              {activeTrivia.nameTH} ({activeTrivia.symbol})
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
              {activeTrivia.trivia}
            </p>
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-[11px] text-slate-600 dark:text-slate-300">
              เลขอะตอม {activeTrivia.atomicNumber} · หมู่ {activeTrivia.group} · คาบ {activeTrivia.period}
            </div>
            <button
              onClick={handleCloseTrivia}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black text-sm shadow-md border-2 border-slate-900 dark:border-zinc-800 cursor-pointer"
            >
              ลุยต่อเลย! 🚀
            </button>
          </div>
        </div>
      )}

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
