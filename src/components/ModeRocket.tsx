import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ELEMENTS, CATEGORY_INFO } from '../data/elements';
import { QuizQuestion, UserProfile } from '../types';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { trackAnswerEvent } from '../services/analytics';
import { 
  Rocket, 
  Moon, 
  Flame, 
  Zap, 
  Trophy, 
  RotateCcw, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  FastForward, 
  AlertTriangle,
  Sparkles,
  Gauge,
  Timer
} from 'lucide-react';

interface Props {
  user: UserProfile;
  onBack: () => void;
  onAddScore: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void;
  onOpenLeaderboard: () => void;
  onUpdateStatus?: (status: string) => void;
}

// Distance to Moon: 384,400 km
const TOTAL_DISTANCE_KM = 384400;
const INITIAL_TIME_SECONDS = 60; // 60 seconds starting flight time
const TARGET_CORRECT_TO_LAND = 12; // Reach the moon on 12 successful thrust answers or when progress reaches 100%

export const ModeRocket: React.FC<Props> = ({
  user,
  onBack,
  onAddScore,
  onOpenLeaderboard,
  onUpdateStatus
}) => {
  const [gameState, setGameState] = useState<'lobby' | 'flying' | 'landed' | 'crashed'>('lobby');
  
  // Rocket flight dynamics
  // Time remaining to reach moon: +3 seconds on correct answer, -3 seconds on wrong/timeout
  const [flightTimeRemaining, setFlightTimeRemaining] = useState<number>(INITIAL_TIME_SECONDS);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(28000); // 28,000 km/h baseline
  const [progressPercent, setProgressPercent] = useState<number>(0); // 0 to 100%
  const [thrustEffect, setThrustEffect] = useState<'boost' | 'slow' | null>(null);
  
  // Questions & Scoring
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(10); // 10s per question
  
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);

  const flightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update presence status
  useEffect(() => {
    if (onUpdateStatus) {
      if (gameState === 'flying') {
        onUpdateStatus('กำลังขับยานจรวดไปดวงจันทร์ 🚀🌕');
      } else if (gameState === 'landed') {
        onUpdateStatus('ยานลงจอดบนดวงจันทร์สำเร็จ! 🏆🌕');
      } else {
        onUpdateStatus('พร้อมบินสู่ดวงจันทร์ 🚀');
      }
    }
  }, [gameState, onUpdateStatus]);

  // Question generator optimized for fast-paced rocket thrusting
  const generateQuestions = (count: number = 30): QuizQuestion[] => {
    const shuffledElements = [...ELEMENTS].sort(() => 0.5 - Math.random());
    const generated: QuizQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const el = shuffledElements[i % shuffledElements.length];
      const type = i % 4;

      if (type === 0) {
        // Element symbol to name
        const correct = el.nameTH;
        const others = ELEMENTS.filter(e => e.symbol !== el.symbol).sort(() => 0.5 - Math.random()).slice(0, 3).map(e => e.nameTH);
        const options = [correct, ...others].sort(() => 0.5 - Math.random());
        generated.push({
          id: `rk-${i}-${el.symbol}`,
          type: 'name',
          question: `เชื้อเพลิงขับเคลื่อน: สัญลักษณ์ "${el.symbol}" คือธาตุใด?`,
          options,
          correctIndex: options.indexOf(correct),
          explanation: `ธาตุ ${el.symbol} คือ ${el.nameTH} (${el.nameEN}) มีเลขอะตอม ${el.atomicNumber}`,
          elementSymbol: el.symbol,
          elementName: el.nameTH,
          atomicNumber: el.atomicNumber,
          category: el.category
        });
      } else if (type === 1) {
        // Atomic number to symbol
        const correct = el.symbol;
        const others = ELEMENTS.filter(e => e.atomicNumber !== el.atomicNumber).sort(() => 0.5 - Math.random()).slice(0, 3).map(e => e.symbol);
        const options = [correct, ...others].sort(() => 0.5 - Math.random());
        generated.push({
          id: `rk-${i}-num-${el.atomicNumber}`,
          type: 'symbol',
          question: `จุดระเบิดไอพ่น: ธาตุเลขอะตอม ${el.atomicNumber} มีสัญลักษณ์ใด?`,
          options,
          correctIndex: options.indexOf(correct),
          explanation: `เลขอะตอม ${el.atomicNumber} หมายถึง ${el.nameTH} (${el.symbol})`,
          elementSymbol: el.symbol,
          elementName: el.nameTH,
          atomicNumber: el.atomicNumber,
          category: el.category
        });
      } else if (type === 2) {
        // Group and period
        const correct = `หมู่ ${el.group} คาบ ${el.period}`;
        const fakes: string[] = [];
        while (fakes.length < 3) {
          const fg = Math.floor(Math.random() * 18) + 1;
          const fp = Math.floor(Math.random() * 7) + 1;
          const val = `หมู่ ${fg} คาบ ${fp}`;
          if (val !== correct && !fakes.includes(val)) fakes.push(val);
        }
        const options = [correct, ...fakes].sort(() => 0.5 - Math.random());
        generated.push({
          id: `rk-${i}-gp-${el.symbol}`,
          type: 'groupPeriod',
          question: `พิกัดวิถีโคจร: ธาตุ ${el.nameTH} (${el.symbol}) อยู่ตำแหน่งใด?`,
          options,
          correctIndex: options.indexOf(correct),
          explanation: `${el.nameTH} อยู่ในหมู่ ${el.group} คาบ ${el.period}`,
          elementSymbol: el.symbol,
          elementName: el.nameTH,
          atomicNumber: el.atomicNumber,
          category: el.category
        });
      } else {
        // Fuel / Rocket property hint
        const correct = el.nameTH;
        const others = ELEMENTS.filter(e => e.symbol !== el.symbol).sort(() => 0.5 - Math.random()).slice(0, 3).map(e => e.nameTH);
        const options = [correct, ...others].sort(() => 0.5 - Math.random());
        generated.push({
          id: `rk-${i}-hint-${el.symbol}`,
          type: 'trivia',
          question: `ข้อมูลนักบิน: ธาตุใดมีคุณสมบัติ "${el.hint}"?`,
          options,
          correctIndex: options.indexOf(correct),
          explanation: el.trivia,
          elementSymbol: el.symbol,
          elementName: el.nameTH,
          atomicNumber: el.atomicNumber,
          category: el.category
        });
      }
    }
    return generated;
  };

  // Start Rocket Game
  const handleLaunchRocket = () => {
    const qList = generateQuestions(40);
    setQuestions(qList);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setWrongCount(0);
    setProgressPercent(0);
    setFlightTimeRemaining(INITIAL_TIME_SECONDS);
    setCurrentSpeedKmh(28000);
    setQuestionTimeLeft(10);
    setThrustEffect(null);
    setGameState('flying');
    soundManager.playBattleStart();
  };

  // Main flight countdown timer
  useEffect(() => {
    if (gameState !== 'flying') {
      if (flightTimerRef.current) clearInterval(flightTimerRef.current);
      return;
    }

    flightTimerRef.current = setInterval(() => {
      setFlightTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(flightTimerRef.current!);
          handleFlightTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (flightTimerRef.current) clearInterval(flightTimerRef.current);
    };
  }, [gameState]);

  // Question countdown timer (10s limit per question)
  useEffect(() => {
    if (gameState !== 'flying' || isAnswered) {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      return;
    }

    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(questionTimerRef.current!);
          handleQuestionTimeout();
          return 0;
        }
        if (prev <= 3) {
          soundManager.playTick(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [gameState, currentQuestionIndex, isAnswered]);

  // Handle when 10s question timer expires (treated as wrong: -3 seconds flight time)
  const handleQuestionTimeout = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(-1);
    setCombo(0);
    setWrongCount(prev => prev + 1);
    soundManager.playWrong();

    // User rule: "ถ้าตอบผิดหรือหมดเวลาจะช้าลง3วิ"
    triggerSpeedPenalty(3);

    const q = questions[currentQuestionIndex];
    if (q) {
      trackAnswerEvent({
        userId: user.id || user.name || 'guest',
        questionId: q.id,
        elementSymbol: q.elementSymbol,
        gameMode: 'rocket',
        isCorrect: false,
        answerTime: 10
      });
    }

    setTimeout(() => {
      goToNextQuestion();
    }, 1400);
  };

  // Handle when overall flight time hits 0 -> Rocket fuel depleted
  const handleFlightTimeout = () => {
    soundManager.playWrong();
    setGameState('crashed');
  };

  // Penalty logic: -3 seconds to time remaining and reduce speed
  const triggerSpeedPenalty = (secondsLost: number) => {
    setThrustEffect('slow');
    setTimeout(() => setThrustEffect(null), 1000);

    setFlightTimeRemaining(prev => {
      const nextTime = Math.max(0, prev - secondsLost);
      if (nextTime === 0) {
        setTimeout(() => setGameState('crashed'), 400);
      }
      return nextTime;
    });

    setCurrentSpeedKmh(prev => Math.max(12000, prev - 4500));
  };

  // Boost logic: +3 seconds to time remaining and boost speed
  const triggerSpeedBoost = (secondsGained: number) => {
    setThrustEffect('boost');
    setTimeout(() => setThrustEffect(null), 1000);

    setFlightTimeRemaining(prev => prev + secondsGained);
    setCurrentSpeedKmh(prev => Math.min(65000, prev + 3200));
  };

  // Select option handler
  const handleSelectOption = (idx: number) => {
    if (isAnswered || gameState !== 'flying') return;
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    setSelectedOption(idx);
    setIsAnswered(true);

    const q = questions[currentQuestionIndex];
    const isCorrect = idx === q.correctIndex;
    const answerDuration = 10 - questionTimeLeft;

    trackAnswerEvent({
      userId: user.id || user.name || 'guest',
      questionId: q.id,
      elementSymbol: q.elementSymbol,
      gameMode: 'rocket',
      isCorrect,
      answerTime: Math.max(0.5, answerDuration)
    });

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      setCorrectCount(prev => prev + 1);

      // Points calculation
      const comboBonus = (newCombo - 1) * 20;
      const speedBonus = questionTimeLeft * 10;
      const points = 100 + comboBonus + speedBonus;
      setScore(prev => prev + points);

      if (newCombo > 1) {
        soundManager.playCombo(newCombo);
      } else {
        soundManager.playCorrect();
      }

      // User rule: "ถ้าตอบถูกจะไปเร็วขั้น3วิ" (+3 seconds to flight time)
      triggerSpeedBoost(3);

      // Update progress toward Moon
      const nextCorrect = correctCount + 1;
      const newProgress = Math.min(100, Math.round((nextCorrect / TARGET_CORRECT_TO_LAND) * 100));
      setProgressPercent(newProgress);

      if (newProgress >= 100) {
        // Reached the Moon!
        handleMoonLanding(score + points + 500);
        return;
      }
    } else {
      // Wrong answer
      setCombo(0);
      setWrongCount(prev => prev + 1);
      soundManager.playWrong();

      // User rule: "ถ้าตอบผิดหรือหมดเวลาจะช้าลง3วิ"
      triggerSpeedPenalty(3);
    }

    setTimeout(() => {
      goToNextQuestion();
    }, 1300);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setQuestionTimeLeft(10);
    } else {
      // End of questions list: loop fresh questions if still flying
      const freshQuestions = generateQuestions(20);
      setQuestions(prev => [...prev, ...freshQuestions]);
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setQuestionTimeLeft(10);
    }
  };

  const handleMoonLanding = (finalScore: number) => {
    if (flightTimerRef.current) clearInterval(flightTimerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    setGameState('landed');
    soundManager.playVictory();
    
    // Blast confetti!
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#38bdf8', '#fbbf24', '#a855f7', '#34d399', '#f43f5e']
    });

    // Submit score to real-time database
    onAddScore(finalScore, true, maxCombo, 'จรวดไปดวงจันทร์ 🚀🌕');
  };

  // Distance covered calculation
  const distanceCoveredKm = Math.round((progressPercent / 100) * TOTAL_DISTANCE_KM);
  const remainingDistanceKm = TOTAL_DISTANCE_KM - distanceCoveredKm;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-12 select-none">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-3 rounded-2xl border-2 border-slate-900 dark:border-zinc-800 shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#27272a]">
        <button
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-slate-200 font-black text-xs hover:bg-slate-200 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>กลับหน้าหลัก</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <h1 className="text-base font-black text-slate-900 dark:text-white">
            ภารกิจจรวดไปดวงจันทร์
          </h1>
          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full border border-slate-900">
            โหมดใหม่
          </span>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenLeaderboard();
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-zinc-900 border border-amber-300 dark:border-zinc-700 text-amber-800 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 transition cursor-pointer"
        >
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span>อันดับ</span>
        </button>
      </div>

      {/* LOBBY VIEW */}
      {gameState === 'lobby' && (
        <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-black text-white p-6 rounded-3xl border-2 border-slate-900 dark:border-zinc-800 shadow-[5px_5px_0px_#1e293b] space-y-6 text-center relative overflow-hidden">
          {/* Cosmic background stars */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 space-y-3 pt-2">
            <div className="relative inline-block">
              <div className="text-6xl animate-bounce">🚀</div>
              <div className="absolute -top-1 -right-4 text-3xl animate-pulse">🌕</div>
            </div>
            
            <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              ภารกิจนำยานเคมีสู่ดวงจันทร์
            </h2>
            
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              เติมพลังงานเชื้อเพลิงด้วยการตอบคำถามตารางธาตุให้ถูกต้อง เพื่อส่งยานเดินทางข้ามอวกาศระยะทาง 384,400 กิโลเมตร
            </p>
          </div>

          {/* RULES HIGHLIGHT CARD */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto">
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 text-lg">
                ⚡
              </div>
              <div>
                <div className="text-xs font-black text-emerald-300">ตอบถูก = เร่งสปีด +3 วิ!</div>
                <div className="text-[11px] text-emerald-100/80 mt-0.5">
                  เพิ่มเวลาบิน 3 วินาที เร่งความเร็วขับเคลื่อนและเข้าใกล้ดวงจันทร์ทันที
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/60 border-2 border-rose-500/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 shrink-0 text-lg">
                ⚠️
              </div>
              <div>
                <div className="text-xs font-black text-rose-300">ตอบผิด / หมดเวลา = ช้าลง 3 วิ!</div>
                <div className="text-[11px] text-rose-100/80 mt-0.5">
                  สูญเสียเวลาและเชื้อเพลิง 3 วินาที ยานสูญเสียแรงขับเคลื่อน
                </div>
              </div>
            </div>
          </div>

          {/* FLIGHT STATS SUMMARY */}
          <div className="relative z-10 flex items-center justify-around p-3.5 rounded-2xl bg-white/5 border border-white/10 max-w-lg mx-auto text-xs">
            <div>
              <div className="text-slate-400 font-bold">เวลาตั้งต้น</div>
              <div className="text-base font-black text-amber-300">60 วินาที</div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <div className="text-slate-400 font-bold">เป้าหมายลงจอด</div>
              <div className="text-base font-black text-emerald-300">12 คำตอบถูกต้อง</div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <div className="text-slate-400 font-bold">โบนัสภารกิจ</div>
              <div className="text-base font-black text-cyan-300">+500 แต้ม</div>
            </div>
          </div>

          {/* START BUTTON */}
          <div className="relative z-10 pt-2">
            <button
              onClick={handleLaunchRocket}
              className="w-full max-w-md py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-black text-lg border-2 border-white/80 shadow-[0px_0px_20px_rgba(251,191,36,0.5)] active:scale-98 transition cursor-pointer flex items-center justify-center gap-3 mx-auto"
            >
              <Rocket className="h-6 w-6 animate-pulse" />
              <span>จุดระเบิดไอพ่น ปล่อยยานเดี๋ยวนี้!</span>
            </button>
          </div>
        </div>
      )}

      {/* FLYING ACTIVE VIEW */}
      {gameState === 'flying' && (
        <div className="space-y-4">
          {/* FLIGHT DASHBOARD HUD */}
          <div className="bg-slate-900 text-white p-4 rounded-3xl border-2 border-slate-900 dark:border-zinc-800 shadow-[4px_4px_0px_#0f172a] relative overflow-hidden">
            {/* Ambient propulsion glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
              thrustEffect === 'boost' ? 'bg-emerald-500/30' : thrustEffect === 'slow' ? 'bg-rose-500/30' : 'bg-cyan-500/10'
            }`} />

            {/* TOP ROW: TIME REMAINING & SPEED */}
            <div className="flex items-center justify-between relative z-10 mb-3">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm border transition-all ${
                  flightTimeRemaining <= 10 
                    ? 'bg-rose-600/90 text-white border-rose-400 animate-pulse'
                    : 'bg-slate-800 text-amber-300 border-slate-700'
                }`}>
                  <Timer className="h-4 w-4" />
                  <span>เวลาบิน: {flightTimeRemaining} วินาที</span>
                  {thrustEffect === 'boost' && (
                    <span className="text-emerald-400 font-black text-xs animate-bounce">+3s 🚀</span>
                  )}
                  {thrustEffect === 'slow' && (
                    <span className="text-rose-400 font-black text-xs animate-bounce">-3s ⚠️</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 font-black text-xs">
                  <Gauge className="h-3.5 w-3.5" />
                  <span>{currentSpeedKmh.toLocaleString()} กม./ชม.</span>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{score} แต้ม</span>
                </div>
              </div>
            </div>

            {/* ROCKET TRAJECTORY TRACK (EARTH TO MOON) */}
            <div className="relative z-10 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1">
                <span className="flex items-center gap-1 text-blue-400">
                  <span>🌍 โลก</span>
                </span>
                <span className="text-amber-300 font-black">
                  พิชิตระยะทาง: {distanceCoveredKm.toLocaleString()} / {TOTAL_DISTANCE_KM.toLocaleString()} กม. ({progressPercent}%)
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <span>🌕 ดวงจันทร์</span>
                </span>
              </div>

              {/* Progress bar with animated rocket */}
              <div className="relative w-full h-7 bg-slate-800 rounded-full p-1 overflow-hidden border border-slate-700 flex items-center">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                />

                {/* Animated rocket marker on the progress bar */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out flex items-center text-lg"
                  style={{ left: `calc(${Math.min(92, Math.max(3, progressPercent))}% - 12px)` }}
                >
                  <span className={`inline-block transform -rotate-45 ${thrustEffect === 'boost' ? 'scale-125' : ''}`}>
                    🚀
                  </span>
                </div>
              </div>
            </div>

            {/* COMBO STREAK & QUESTION TIME */}
            <div className="flex items-center justify-between mt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">พลังไอพ่นต่อเนื่อง:</span>
                {combo > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 font-black">
                    <Flame className="h-3 w-3" />
                    {combo}x บูสต์
                  </span>
                ) : (
                  <span className="text-slate-500">พร้อมสะสมคอมโบ</span>
                )}
              </div>

              {/* Question 10s Timer */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">เวลาตอบข้อนี้:</span>
                <span className={`font-black px-2 py-0.5 rounded-lg border ${
                  questionTimeLeft <= 3 
                    ? 'bg-rose-500/30 text-rose-300 border-rose-500 animate-pulse'
                    : 'bg-slate-800 text-slate-200 border-slate-700'
                }`}>
                  {questionTimeLeft} วิ
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE QUESTION CARD */}
          {questions[currentQuestionIndex] && (
            <div className="bg-white dark:bg-zinc-950 p-5 rounded-3xl border-2 border-slate-900 dark:border-zinc-800 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-zinc-800">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-cyan-400 font-black">
                  <Zap className="h-4 w-4" />
                  <span>คำถามขับเคลื่อนยาน #{currentQuestionIndex + 1}</span>
                </span>
                <span className="bg-slate-100 dark:bg-zinc-900 px-2 py-1 rounded-xl">
                  {questions[currentQuestionIndex].elementSymbol} (เลขอะตอม {questions[currentQuestionIndex].atomicNumber})
                </span>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                {questions[currentQuestionIndex].question}
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {questions[currentQuestionIndex].options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === questions[currentQuestionIndex].correctIndex;

                  let btnStyle = "bg-slate-50 dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-400";

                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-500 text-white border-emerald-700 shadow-[0px_0px_12px_rgba(16,185,129,0.5)]";
                    } else if (isSelected) {
                      btnStyle = "bg-rose-500 text-white border-rose-700";
                    } else {
                      btnStyle = "opacity-40 bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`p-3.5 rounded-2xl border-2 font-black text-sm text-left transition active:scale-98 flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10 text-xs font-black shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-white shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant feedback explanation */}
              {isAnswered && (
                <div className={`p-3 rounded-2xl text-xs font-semibold border-2 transition-all flex items-start gap-2.5 ${
                  selectedOption === questions[currentQuestionIndex].correctIndex
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200'
                }`}>
                  <div className="text-base shrink-0">
                    {selectedOption === questions[currentQuestionIndex].correctIndex ? '🚀' : '⚠️'}
                  </div>
                  <div>
                    <div className="font-black text-xs mb-0.5">
                      {selectedOption === questions[currentQuestionIndex].correctIndex 
                        ? 'คำตอบถูกต้อง! จรวดเร่งความเร็ว +3 วินาที' 
                        : selectedOption === -1 
                          ? 'หมดเวลา 10 วินาที! จรวดชะลอความเร็ว -3 วินาที'
                          : 'คำตอบยังไม่ถูกต้อง! จรวดสูญเสียเวลาบิน -3 วินาที'}
                    </div>
                    <p className="opacity-90">{questions[currentQuestionIndex].explanation}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LANDED VICTORY MODAL / SCREEN */}
      {gameState === 'landed' && (
        <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-black text-white p-6 sm:p-8 rounded-3xl border-2 border-slate-900 dark:border-zinc-800 shadow-[6px_6px_0px_#1e293b] text-center space-y-5">
          <div className="text-6xl animate-bounce">🌕🚀</div>

          <div className="space-y-1">
            <span className="bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              ภารกิจสำเร็จลุล่วง!
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mt-2">
              ยานลงจอดบนดวงจันทร์สำเร็จ!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              ยินดีด้วย! คุณใช้ความรู้ตารางธาตุขับเคลื่อนยานอวกาศข้ามระยะทาง 384,400 กิโลเมตร ได้สำเร็จงดงาม
            </p>
          </div>

          {/* STATS BENTO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <div className="text-[10px] text-slate-400 font-bold">คะแนนรวม</div>
              <div className="text-lg font-black text-amber-400">{score.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <div className="text-[10px] text-slate-400 font-bold">เวลาที่เหลือ</div>
              <div className="text-lg font-black text-emerald-400">{flightTimeRemaining} วิ</div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <div className="text-[10px] text-slate-400 font-bold">ตอบถูกต้อง</div>
              <div className="text-lg font-black text-cyan-400">{correctCount} ข้อ</div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <div className="text-[10px] text-slate-400 font-bold">คอมโบสูงสุด</div>
              <div className="text-lg font-black text-orange-400">{maxCombo}x</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleLaunchRocket}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm border-2 border-white/80 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>ปล่อยยานบินอีกครั้ง</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenLeaderboard();
              }}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>ดูกระดานอันดับสด</span>
            </button>
          </div>
        </div>
      )}

      {/* CRASHED / TIMEOUT SCREEN */}
      {gameState === 'crashed' && (
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border-2 border-slate-900 dark:border-zinc-800 shadow-[6px_6px_0px_#1e293b] text-center space-y-5">
          <div className="text-6xl animate-pulse">💥🛸</div>

          <div className="space-y-1">
            <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              เชื้อเพลิงและเวลาหมดลง
            </span>
            <h2 className="text-2xl font-black text-rose-400 mt-2">
              ยานจรวดไปไม่ถึงดวงจันทร์!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              เวลาการบินหมดลงก่อนถึงจุดหมาย คุณเดินทางไปได้ {progressPercent}% ({distanceCoveredKm.toLocaleString()} กม.)
            </p>
          </div>

          {/* PARTIAL STATS */}
          <div className="flex items-center justify-around p-3.5 bg-white/5 rounded-2xl border border-white/10 max-w-sm mx-auto text-xs">
            <div>
              <div className="text-slate-400 font-bold">คะแนนที่ได้</div>
              <div className="text-base font-black text-amber-400">{score.toLocaleString()}</div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <div className="text-slate-400 font-bold">ตอบถูก</div>
              <div className="text-base font-black text-emerald-400">{correctCount} ข้อ</div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <div className="text-slate-400 font-bold">ตอบผิด</div>
              <div className="text-base font-black text-rose-400">{wrongCount} ข้อ</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleLaunchRocket}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-black text-sm border-2 border-white/80 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>ลองบินใหม่อีกครั้ง</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onBack();
              }}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-slate-700 transition cursor-pointer"
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
