import React, { useState, useEffect, useRef } from 'react';
import { ELEMENTS, CATEGORY_INFO } from '../data/elements';
import { QuizQuestion, UserProfile } from '../types';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { trackAnswerEvent } from '../services/analytics';
import { AtomIllustration } from './AtomIllustration';
import { 
  Clock, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Trophy, 
  Zap, 
  ChevronLeft,
  BookOpen
} from 'lucide-react';

interface Props {
  user: UserProfile;
  onBack: () => void;
  onAddScore: (points: number, wonMatch?: boolean, combo?: number, gameMode?: string) => void;
  onOpenLeaderboard: () => void;
  onUpdateStatus?: (status: string) => void;
}

export const ModePeriodicQuiz: React.FC<Props> = ({
  user,
  onBack,
  onAddScore,
  onOpenLeaderboard,
  onUpdateStatus
}) => {
  const [questionCount, setQuestionCount] = useState<5 | 10 | 20>(10);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'result'>('lobby');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  // Scoring
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (onUpdateStatus) {
      if (gameState === 'playing') {
        onUpdateStatus('กำลังทำควิซตารางธาตุ 🧠');
      } else {
        onUpdateStatus('พร้อมลุยเกมเคมี 🟢');
      }
    }
  }, [gameState, onUpdateStatus]);

  // Question Generator with 4 chemistry archetypes
  const generateQuestions = (count: number): QuizQuestion[] => {
    const shuffledElements = [...ELEMENTS].sort(() => 0.5 - Math.random());
    const generated: QuizQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const el = shuffledElements[i % shuffledElements.length];
      const typeChoice = Math.floor(Math.random() * 4); // 0: Symbol->Name, 1: Number->Symbol, 2: Group/Period, 3: Clue/Property

      if (typeChoice === 0) {
        // Archetype 1: What is the name of this symbol?
        const correctName = el.nameTH;
        const otherOptions = ELEMENTS
          .filter(x => x.symbol !== el.symbol)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(x => x.nameTH);
        
        const options = [correctName, ...otherOptions].sort(() => 0.5 - Math.random());

        generated.push({
          id: `q-${i}-${el.symbol}`,
          type: 'name',
          question: `สัญลักษณ์ธาตุ "${el.symbol}" คือธาตุใด?`,
          options,
          correctIndex: options.indexOf(correctName),
          explanation: `ธาตุ ${el.symbol} คือ ${el.nameTH} (${el.nameEN}) มีเลขอะตอม ${el.atomicNumber} อยู่หมู่ ${el.group} คาบ ${el.period}`,
          elementSymbol: el.symbol,
          elementName: el.nameTH,
          atomicNumber: el.atomicNumber,
          category: el.category
        });
      } else if (typeChoice === 1) {
        // Archetype 2: Atomic number to symbol
        const correctSymbol = el.symbol;
        const otherOptions = ELEMENTS
          .filter(x => x.atomicNumber !== el.atomicNumber)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(x => x.symbol);

        const options = [correctSymbol, ...otherOptions].sort(() => 0.5 - Math.random());

        generated.push({
          id: `q-${i}-num-${el.atomicNumber}`,
          type: 'symbol',
          question: `ธาตุที่มี "เลขอะตอม ${el.atomicNumber}" มีสัญลักษณ์ว่าอย่างไร?`,
          options,
          correctIndex: options.indexOf(correctSymbol),
          explanation: `เลขอะตอม ${el.atomicNumber} หมายถึง ${el.nameTH} (${el.symbol}) โดยมีโปรตอน ${el.atomicNumber} ตัวในนิวเคลียส`,
          elementSymbol: el.symbol,
          elementName: el.nameTH,
          atomicNumber: el.atomicNumber,
          category: el.category
        });
      } else if (typeChoice === 2) {
        // Archetype 3: Group & Period
        const correctChoice = `หมู่ ${el.group} คาบ ${el.period}`;
        const fakeChoices: string[] = [];
        while (fakeChoices.length < 3) {
          const fakeGroup = Math.floor(Math.random() * 18) + 1;
          const fakePeriod = Math.floor(Math.random() * 7) + 1;
          const str = `หมู่ ${fakeGroup} คาบ ${fakePeriod}`;
          if (str !== correctChoice && !fakeChoices.includes(str)) {
            fakeChoices.push(str);
          }
        }
        const options = [correctChoice, ...fakeChoices].sort(() => 0.5 - Math.random());

        generated.push({
          id: `q-${i}-pos-${el.symbol}`,
          type: 'groupPeriod',
          question: `ธาตุ ${el.nameTH} (${el.symbol}) อยู่ในตำแหน่งใดของตารางธาตุ?`,
          options,
          correctIndex: options.indexOf(correctChoice),
          explanation: `${el.nameTH} (${el.symbol}) จัดเป็นธาตุในหมู่ ${el.group} และคาบที่ ${el.period}`,
          elementSymbol: el.symbol,
          elementName: el.nameTH,
          atomicNumber: el.atomicNumber,
          category: el.category
        });
      } else {
        // Archetype 4: Trivia / Clue
        const correctName = el.nameTH;
        const otherOptions = ELEMENTS
          .filter(x => x.symbol !== el.symbol)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(x => x.nameTH);

        const options = [correctName, ...otherOptions].sort(() => 0.5 - Math.random());

        generated.push({
          id: `q-${i}-hint-${el.symbol}`,
          type: 'trivia',
          question: `ธาตุใดมีคำใบ้คุณสมบัติว่า: "${el.hint}"?`,
          options,
          correctIndex: options.indexOf(correctName),
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

  const handleStartGame = () => {
    const qList = generateQuestions(questionCount);
    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTimeLeft(15);
    setGameState('playing');
    soundManager.playClick();
  };

  // Timer loop
  useEffect(() => {
    if (gameState !== 'playing' || isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        if (prev <= 5) {
          soundManager.playTick(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIndex, isAnswered]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setSelectedOption(-1); // Timeout
    setCombo(0);
    soundManager.playWrong();

    const q = questions[currentIndex];
    if (q) {
      trackAnswerEvent({
        userId: user.id || user.name || 'guest',
        questionId: q.id || `q_${currentIndex}`,
        elementSymbol: q.elementSymbol,
        gameMode: 'quiz',
        isCorrect: false,
        answerTime: 15
      });
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(idx);
    setIsAnswered(true);

    const q = questions[currentIndex];
    const isCorrect = idx === q.correctIndex;
    const answerTimeSec = Math.max(0.5, 15 - timeLeft);

    // Track analytics event to Firestore
    trackAnswerEvent({
      userId: user.id || user.name || 'guest',
      questionId: q.id || `q_${currentIndex}`,
      elementSymbol: q.elementSymbol,
      gameMode: 'quiz',
      isCorrect,
      answerTime: answerTimeSec
    });

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      setCorrectCount(prev => prev + 1);

      // Speed bonus & combo multiplier
      const timeBonus = timeLeft * 10;
      const comboBonus = (newCombo - 1) * 20;
      const questionScore = 100 + timeBonus + comboBonus;
      setScore(prev => prev + questionScore);

      if (newCombo >= 3) {
        soundManager.playCombo(newCombo);
      } else {
        soundManager.playCorrect();
      }
    } else {
      setCombo(0);
      soundManager.playWrong();
    }
  };

  const handleNextQuestion = () => {
    soundManager.playClick();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setGameState('result');
    const won = correctCount >= questions.length * 0.7;
    onAddScore(score, won, maxCombo, 'quiz');

    if (won) {
      soundManager.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      soundManager.playClick();
    }
  };

  const currentQ = questions[currentIndex];
  const cat = currentQ ? CATEGORY_INFO[currentQ.category] : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-white dark:bg-black hover:bg-slate-100 dark:hover:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] transition cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>กลับหน้าหลัก</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-100 dark:bg-zinc-900 hover:bg-amber-200 dark:hover:bg-zinc-800 border-2 border-slate-900 dark:border-zinc-800 text-amber-900 dark:text-amber-300 text-xs font-bold shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] transition cursor-pointer"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>กระดานคะแนนสด</span>
          </button>
        </div>
      </div>

      {/* LOBBY STATE */}
      {gameState === 'lobby' && (
        <div className="bg-white dark:bg-black border-2 border-slate-900 dark:border-zinc-800 rounded-3xl p-5 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] space-y-5 transition-colors">
          <div className="text-center space-y-2">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl shadow-md border-2 border-slate-900 dark:border-slate-700">
              🧠
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              โหมดตอบคำถามตารางธาตุ
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              ทดสอบความจำสัญลักษณ์เคมี เลขอะตอม หมู่-คาบ และเกร็ดความรู้ธาตุรอบตัว สะสมแต้มขึ้นกระดานคะแนนเรียลไทม์!
            </p>
          </div>

          {/* Question Count Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              เลือกจำนวนข้อสอบ:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { count: 5, label: '5 ข้อ', desc: 'วอร์มอัปด่วน' },
                { count: 10, label: '10 ข้อ', desc: 'มาตรฐาน' },
                { count: 20, label: '20 ข้อ', desc: 'ท้าทายเซียน' }
              ].map(item => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setQuestionCount(item.count as 5 | 10 | 20);
                  }}
                  className={`p-3 rounded-2xl border-2 transition text-center cursor-pointer ${
                    questionCount === item.count
                      ? 'border-blue-600 dark:border-cyan-400 bg-blue-50 dark:bg-cyan-950/40 shadow-[2px_2px_0px_#2563eb] dark:shadow-[2px_2px_0px_#06b6d4]'
                      : 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <span className="block font-black text-sm text-slate-900 dark:text-white">{item.label}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rules / Features Box */}
          <div className="bg-indigo-50 dark:bg-zinc-950 border border-indigo-200 dark:border-zinc-800 rounded-2xl p-3.5 space-y-1.5 text-xs text-indigo-950 dark:text-indigo-200">
            <div className="font-black flex items-center gap-1.5 text-indigo-900 dark:text-cyan-300">
              <Zap className="h-4 w-4" />
              <span>กติกาและเทคนิคสะสมคะแนน</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
              <li>มีเวลาข้อละ 15 วินาที ยิ่งตอบเร็ว ยิ่งได้แต้มโบนัสความเร็วเพิ่ม</li>
              <li>ตอบถูกติดกันจะเปิดใช้งาน <strong>คอมโบ (Combo Streak)</strong> คูณแต้มทวีคูณ</li>
              <li>คะแนนที่ได้จะถูกบันทึกและประกาศขึ้น <strong>กระดานผู้นำแบบเรียลไทม์</strong> ทันที</li>
            </ul>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-lg border-2 border-slate-900 dark:border-zinc-800 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="h-5 w-5 fill-current" />
            <span>เริ่มทำแบบทดสอบเคมี ({questionCount} ข้อ)</span>
          </button>
        </div>
      )}

      {/* PLAYING STATE */}
      {gameState === 'playing' && currentQ && (
        <div className="bg-white dark:bg-black border-2 border-slate-900 dark:border-zinc-800 rounded-3xl p-5 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] space-y-4 transition-colors">
          {/* Header Stats Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-cyan-950/70 text-blue-900 dark:text-cyan-300 border border-blue-300 dark:border-cyan-800">
                ข้อ {currentIndex + 1} / {questions.length}
              </span>
              {combo > 1 && (
                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 flex items-center gap-1 animate-pulse">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  คอมโบ x{combo}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Score */}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">คะแนน</span>
                <span className="text-base font-black text-blue-600 dark:text-cyan-400">{score.toLocaleString()}</span>
              </div>

              {/* Timer */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border font-black text-xs ${
                timeLeft <= 5 
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-400 dark:border-rose-700 animate-bounce' 
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-zinc-700'
              }`}>
                <Clock className="h-3.5 w-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Time Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-zinc-900 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-zinc-800">
            <div 
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 5 ? 'bg-rose-500' : 'bg-blue-600 dark:bg-cyan-500'
              }`}
              style={{ width: `${(timeLeft / 15) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3">
              {/* Element Avatar badge */}
              <div className={`flex flex-col items-center justify-center h-14 w-14 shrink-0 rounded-2xl border-2 border-slate-900 dark:border-zinc-600 ${cat?.bg || 'bg-blue-100 dark:bg-cyan-950/80'} shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]`}>
                <span className="text-[10px] font-black text-slate-700 dark:text-zinc-200">{currentQ.atomicNumber}</span>
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none drop-shadow-xs">{currentQ.elementSymbol}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider block">
                  คำถามเคมี
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                  {currentQ.question}
                </h4>
              </div>
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;
                let btnStyle = 'bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-slate-200';

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 font-black shadow-[2px_2px_0px_#059669]';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 dark:border-rose-600 text-rose-950 dark:text-rose-200 font-bold';
                  } else {
                    btnStyle = 'bg-slate-100 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/50 text-slate-400 dark:text-slate-600 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-3 rounded-2xl border-2 transition flex items-center justify-between text-left cursor-pointer ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 font-black text-xs text-slate-700 dark:text-slate-200">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm font-bold">{opt}</span>
                    </div>

                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation Banner when answered */}
          {isAnswered && (
            <div className="rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-950 dark:to-zinc-900 p-3.5 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-black text-blue-900 dark:text-cyan-300">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                <span>คำอธิบายความรู้เคมี:</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {currentQ.explanation}
              </p>

              {(() => {
                const qElement = ELEMENTS.find(e => e.symbol === currentQ.elementSymbol || e.atomicNumber === currentQ.atomicNumber);
                if (!qElement) return null;
                return (
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 my-1">
                    <AtomIllustration element={qElement} size="sm" showDetails={true} />
                  </div>
                );
              })()}
              
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="py-2.5 px-4 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span>{currentIndex + 1 < questions.length ? 'ข้อถัดไป' : 'ดูผลคะแนน'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESULT STATE */}
      {gameState === 'result' && (
        <div className="bg-white dark:bg-black border-2 border-slate-900 dark:border-zinc-800 rounded-3xl p-6 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] space-y-5 text-center transition-colors">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 text-4xl shadow-md">
            🏆
          </div>

          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider block">
              ผลการทดสอบเคมี
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {correctCount === questions.length ? 'ยอดเยี่ยมระดับโอลิมปิก! 🎉' : correctCount >= questions.length * 0.7 ? 'ทำได้ดีมาก ผ่านเกณฑ์! 👏' : 'ฝึกฝนเพิ่มเติมอีกนิด สู้ๆ! 💪'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              คะแนนถูกบันทึกและส่งขึ้นกระดานคะแนนสดเรียลไทม์แล้ว
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-50 dark:bg-zinc-950 border border-blue-200 dark:border-zinc-800 rounded-2xl p-3">
              <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold block">คะแนนที่ได้</span>
              <span className="text-xl font-black text-blue-900 dark:text-cyan-200">+{score.toLocaleString()}</span>
            </div>
            <div className="bg-emerald-50 dark:bg-zinc-950 border border-emerald-200 dark:border-zinc-800 rounded-2xl p-3">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">ตอบถูก</span>
              <span className="text-xl font-black text-emerald-900 dark:text-emerald-200">{correctCount}/{questions.length}</span>
            </div>
            <div className="bg-amber-50 dark:bg-zinc-950 border border-amber-200 dark:border-zinc-800 rounded-2xl p-3">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">คอมโบสูงสุด</span>
              <span className="text-xl font-black text-amber-900 dark:text-amber-200">x{maxCombo}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleStartGame}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-sm rounded-xl shadow-md border-2 border-slate-900 dark:border-zinc-700 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <RotateCcw className="h-4 w-4" />
              <span>เล่นใหม่อีกรอบ ({questionCount} ข้อ)</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenLeaderboard();
              }}
              className="w-full py-3 px-4 bg-amber-100 dark:bg-zinc-900 hover:bg-amber-200 dark:hover:bg-zinc-800 text-amber-950 dark:text-amber-200 font-black text-sm rounded-xl shadow-md border-2 border-slate-900 dark:border-zinc-800 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Trophy className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              <span>ดูกระดานคะแนนสด & ผู้เล่นออนไลน์</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onBack();
              }}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-zinc-950 hover:bg-slate-200 dark:hover:bg-zinc-900 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-300 dark:border-zinc-800 cursor-pointer"
            >
              กลับสู่หน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
