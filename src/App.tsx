import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useRealtimeLeaderboard } from './hooks/useRealtimeLeaderboard';
import { useAudio } from './hooks/useAudio';
import { Navbar } from './components/Navbar';
import { ModePeriodicQuiz } from './components/ModePeriodicQuiz';
import { ModeGridPlacement } from './components/ModeGridPlacement';
import { ModePropertyMatch } from './components/ModePropertyMatch';
import { ModeRealtimeBattle } from './components/ModeRealtimeBattle';
import { ModePeriodicExplorer } from './components/ModePeriodicExplorer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AuthModal } from './components/AuthModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { MusicPlayer } from './components/MusicPlayer';
import { soundManager } from './utils/audio';
import { ELEMENTS, CATEGORY_INFO } from './data/elements';
import { 
  ChevronRight, 
  Sparkles, 
  WifiOff,
  Zap,
  Smartphone,
  Trophy,
  LogIn,
  BarChart3,
  Music
} from 'lucide-react';

export default function App() {
  const { user, loginWithGoogle, logout, updateProfile, addScore } = useAuth();
  const { 
    leaderboard, 
    onlineUsers, 
    onlineCount, 
    latestEvent, 
    isConnected, 
    fetchLeaderboard, 
    updatePresenceStatus 
  } = useRealtimeLeaderboard(user);

  const { theme, isIdleSongEnabled, isIdleSongPlaying, startIdleSong, stopIdleSong, toggleIdleSong } = useAudio();

  const [activeScreen, setActiveScreen] = useState<'home' | 'quiz' | 'grid' | 'match' | 'battle' | 'explorer'>('home');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMusicPlayerModal, setShowMusicPlayerModal] = useState(false);

  // Spotlight carousel
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Sync theme to root html element for dark: variant styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Idle song ("ไม่มีวันไหนที่ไม่คิดถึง"): play softly in home screen if enabled, pause during active gameplay
  useEffect(() => {
    if (activeScreen === 'home') {
      if (isIdleSongEnabled) {
        // Attempt to start idle song; Web Audio API will activate as soon as user interacts
        startIdleSong();
      }
    } else {
      stopIdleSong();
    }
  }, [activeScreen, isIdleSongEnabled, startIdleSong, stopIdleSong]);

  // Also unlock audio context on first user click/touch anywhere on screen
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundManager.initContext();
      if (activeScreen === 'home' && isIdleSongEnabled && !soundManager.isIdleSongPlaying) {
        soundManager.startIdleSong();
      }
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [activeScreen, isIdleSongEnabled]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Spotlight auto-rotation
  useEffect(() => {
    if (activeScreen !== 'home') return;
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % ELEMENTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeScreen]);

  const currentSpotlight = ELEMENTS[spotlightIndex] || ELEMENTS[0];
  const cat = CATEGORY_INFO[currentSpotlight.category];

  return (
    <div 
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-200"
      style={{ fontFamily: "'Mali', 'Sarabun', sans-serif" }}
    >
      {/* Navbar */}
      <Navbar
        user={user}
        onlineCount={onlineCount}
        isConnected={isConnected}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenAuth={() => setShowAuth(true)}
        onOpenInstall={() => setShowInstall(true)}
        onOpenAudio={() => setShowAudioSettings(true)}
        onOpenAnalytics={() => setShowAnalytics(true)}
        onOpenMusic={() => setShowMusicPlayerModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 flex flex-col justify-start">
        {/* SCREEN 1: HOME */}
        {activeScreen === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Hero / Welcome Greeting Banner */}
            <div className="bg-white dark:bg-black border-2 border-slate-900 dark:border-zinc-800 rounded-3xl p-5 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] relative overflow-hidden transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-cyan-400 mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>เกมของไตตั้น</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    เกมเกี่ยวกับตารางธาตุ
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                    ตอบคำถาม ดวลเรียลไทม์ และแข่งขันขึ้นกระดานคะแนนสด
                  </p>
                </div>
                <div className="text-4xl p-2.5 rounded-2xl bg-amber-100 dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-800 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]">
                  {theme === 'dark' ? '🌌' : '🧪'}
                </div>
              </div>

              {/* Stats Chips */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 text-xs font-bold">
                <div className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">ธาตุในเกม</span>
                  <span className="text-sm font-black text-blue-600 dark:text-cyan-400">{ELEMENTS.length}+ ธาตุ</span>
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">เลเวล</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">Lv.{user.level}</span>
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">คะแนนสะสม</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{user.totalPoints.toLocaleString()}</span>
                </div>
              </div>

              {/* Idle Song Status & Quick Control Strip */}
              <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div 
                  onClick={() => setShowMusicPlayerModal(true)}
                  className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80 transition"
                >
                  <span className="flex h-2 w-2 relative">
                    {isIdleSongPlaying && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isIdleSongPlaying ? 'bg-pink-500' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    🎶 เพลงไม่มีวันไหนที่ไม่คิดถึง (starlost.)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowMusicPlayerModal(true)}
                    className="px-2 py-1 rounded-lg text-[11px] font-black border border-slate-900 dark:border-zinc-700 bg-pink-100 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300 hover:bg-pink-200 transition cursor-pointer"
                  >
                    แผงควบคุม & เนื้อเพลง
                  </button>
                  <button
                    onClick={toggleIdleSong}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-black border border-slate-900 dark:border-zinc-700 bg-pink-50 dark:bg-zinc-900 text-pink-700 dark:text-pink-300 hover:bg-pink-100 transition cursor-pointer"
                  >
                    {isIdleSongEnabled ? 'ปิด' : 'เปิด'}
                  </button>
                </div>
              </div>
            </div>

            {/* ANALYTICS & EVENT TRACKING BANNER (Requested by user for Excel/Looker Studio) */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white border-2 border-slate-900 dark:border-zinc-800 rounded-3xl p-4 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] flex items-center justify-between transition cursor-pointer hover:brightness-105 active:translate-y-0.5"
              onClick={() => {
                soundManager.playClick();
                setShowAnalytics(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shrink-0 border border-white/30">
                  📊
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">ระบบวิเคราะห์ข้อมูลผู้เล่น (Analytics)</span>
                    <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-amber-300 text-amber-950">
                      Firebase
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-100 mt-0.5">
                    ตรวจอัตราตอบถูก 10 นาทีแรก vs. หลังจากนั้น และแนวโน้มพัฒนาการของผู้เรียน
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/80 shrink-0" />
            </div>

            {/* Real-time Online Presence & Activity Bar */}
            <button
              onClick={() => {
                soundManager.playClick();
                setShowLeaderboard(true);
              }}
              className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-white rounded-2xl p-3 border-2 border-slate-900 dark:border-slate-700 shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#020617] flex items-center justify-between transition cursor-pointer hover:bg-slate-800 text-left"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <div className="truncate">
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <span>ผู้เล่นออนไลน์สด {onlineCount} คน</span>
                    <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.2 rounded-full font-bold">
                      LIVE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate mt-0.5">
                    {latestEvent ? (
                      <span className="flex items-center gap-1 text-yellow-300 font-bold">
                        <Zap className="h-3 w-3 shrink-0" />
                        {latestEvent.userName} เพิ่งได้ +{latestEvent.pointsAdded} แต้ม!
                      </span>
                    ) : (
                      <span>ดูรายชื่อเพื่อนและอันดับคะแนนเรียลไทม์ที่นี่ 🏆</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stacked Avatars */}
              <div className="flex items-center -space-x-2 shrink-0 ml-2">
                {onlineUsers.slice(0, 3).map((u, i) => (
                  <span
                    key={u.id || i}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border-2 border-white dark:border-slate-900 text-xs shadow-xs"
                    title={u.name}
                  >
                    {u.avatar}
                  </span>
                ))}
                {onlineUsers.length > 3 && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 text-[10px] font-black text-white">
                    +{onlineUsers.length - 3}
                  </span>
                )}
              </div>
            </button>

            {/* Spotlight Element Carousel Card */}
            <div className="bg-white dark:bg-black border-2 border-slate-900 dark:border-zinc-800 rounded-3xl p-4 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] relative transition-colors">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  ธาตุเด่นประจำวัน
                </span>
                <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
                  {spotlightIndex + 1} / {ELEMENTS.length}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div 
                  onClick={() => soundManager.playElementSound(currentSpotlight.atomicNumber)}
                  className={`flex flex-col items-center justify-center h-16 w-16 rounded-2xl border-2 border-slate-900 dark:border-slate-700 ${cat.bg} shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#020617] shrink-0 transition-transform cursor-pointer hover:scale-105 active:scale-95`}
                  title="แตะเพื่อฟังคลื่นเสียงสังเคราะห์ประจำธาตุ"
                >
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{currentSpotlight.atomicNumber}</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{currentSpotlight.symbol}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-base text-slate-900 dark:text-cyan-300">{currentSpotlight.nameTH}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">({currentSpotlight.nameEN})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300">
                      หมู่ {currentSpotlight.group} · คาบ {currentSpotlight.period}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-bold truncate mt-1">
                    💡 {currentSpotlight.hint}
                  </div>
                </div>
              </div>
            </div>

            {/* Game Modes Menu */}
            <div className="space-y-2.5">
              <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider pl-1 flex items-center justify-between">
                <span>เลือกโหมดการเล่น</span>
                <span className="text-[11px] text-blue-600 dark:text-cyan-400 font-bold">5 โหมดพร้อมเล่น</span>
              </div>

              {/* MODE 1: PERIODIC QUIZ */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveScreen('quiz');
                }}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl p-4 border-2 border-slate-900 dark:border-zinc-800 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] flex items-center justify-between transition active:translate-y-0.5 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl border-2 border-slate-900 text-blue-600 shadow-sm group-hover:scale-105 transition">
                    🧠
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base">โหมดตอบคำถามตารางธาตุ</span>
                      <span className="bg-amber-300 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-900">
                        ยอดนิยม
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 font-semibold mt-0.5">
                      แบบทดสอบสัญลักษณ์ เลขอะตอม หมู่-คาบ และเกร็ดวิทยาศาสตร์
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/80 shrink-0" />
              </button>

              {/* MODE 2: REALTIME 1v1 BATTLE */}
              <button
                onClick={() => {
                  soundManager.playBattleStart();
                  setActiveScreen('battle');
                }}
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-3xl p-4 border-2 border-slate-900 dark:border-zinc-800 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] flex items-center justify-between transition active:translate-y-0.5 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl border-2 border-slate-900 text-rose-600 shadow-sm group-hover:scale-105 transition">
                    ⚔️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base">ศึกดวลสดเรียลไทม์ 1v1</span>
                      <span className="bg-yellow-300 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-900">
                        LIVE
                      </span>
                    </div>
                    <p className="text-xs text-rose-100 font-semibold mt-0.5">
                      แข่งสปีดความเร็วตอบคำถามตารางธาตุแบบสดๆ ชนะรับ +250 แต้ม
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/80 shrink-0" />
              </button>

              {/* MODE 3: GRID PLACEMENT */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveScreen('grid');
                }}
                className="w-full bg-emerald-100 dark:bg-black hover:bg-emerald-200 dark:hover:bg-zinc-950 text-emerald-950 dark:text-emerald-200 rounded-3xl p-4 border-2 border-slate-900 dark:border-zinc-800 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] flex items-center justify-between transition active:translate-y-0.5 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 text-2xl border-2 border-slate-900 dark:border-zinc-700 text-emerald-700 dark:text-emerald-400 shadow-sm group-hover:scale-105 transition">
                    🧩
                  </div>
                  <div>
                    <span className="font-black text-base text-slate-900 dark:text-white">โหมดจัดเรียงตารางธาตุ</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                      ลากหรือแตะวางธาตุหลากสีลงในตารางให้ตรงหมู่และคาบ
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300 shrink-0" />
              </button>

              {/* MODE 4: PROPERTY MATCH */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveScreen('match');
                }}
                className="w-full bg-blue-100 dark:bg-black hover:bg-blue-200 dark:hover:bg-zinc-950 text-blue-950 dark:text-blue-200 rounded-3xl p-4 border-2 border-slate-900 dark:border-zinc-800 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] flex items-center justify-between transition active:translate-y-0.5 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 text-2xl border-2 border-slate-900 dark:border-zinc-700 text-blue-700 dark:text-blue-400 shadow-sm group-hover:scale-105 transition">
                    🔗
                  </div>
                  <div>
                    <span className="font-black text-base text-slate-900 dark:text-white">โหมดจับคู่ธาตุ-คุณสมบัติ</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                      จับคู่สัญลักษณ์ธาตุกับคุณสมบัติเด่นและการประยุกต์ใช้
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300 shrink-0" />
              </button>

              {/* MODE 5: EXPLORER ENCYCLOPEDIA */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveScreen('explorer');
                }}
                className="w-full bg-purple-100 dark:bg-black hover:bg-purple-200 dark:hover:bg-zinc-950 text-purple-950 dark:text-purple-200 rounded-3xl p-4 border-2 border-slate-900 dark:border-zinc-800 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] flex items-center justify-between transition active:translate-y-0.5 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 text-2xl border-2 border-slate-900 dark:border-zinc-700 text-purple-700 dark:text-purple-400 shadow-sm group-hover:scale-105 transition">
                    📖
                  </div>
                  <div>
                    <span className="font-black text-base text-slate-900 dark:text-white">สารานุกรมตารางธาตุ</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                      สืบค้นธาตุทั้งหมด พร้อมเกร็ดวิทยาศาสตร์และความรู้ครบถ้วน
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300 shrink-0" />
              </button>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowInstall(true);
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-800 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] text-center transition active:scale-98 cursor-pointer"
              >
                <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-[11px] font-black text-slate-900 dark:text-white">ติดตั้งแอป</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">PWA/APK</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowLeaderboard(true);
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-800 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] text-center transition active:scale-98 cursor-pointer"
              >
                <Trophy className="h-4 w-4 text-amber-500 mb-1" />
                <span className="text-[11px] font-black text-slate-900 dark:text-white">คะแนนสด</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">{onlineCount} ออนไลน์</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowAuth(true);
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-800 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] text-center transition active:scale-98 cursor-pointer"
              >
                <LogIn className="h-4 w-4 text-blue-600 dark:text-cyan-400 mb-1" />
                <span className="text-[11px] font-black text-slate-900 dark:text-white">Google</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">{user.email ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowAudioSettings(true);
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-50 dark:bg-zinc-950 hover:bg-amber-100 dark:hover:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-800 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] text-center transition active:scale-98 cursor-pointer"
              >
                <span className="text-base mb-0.5">{theme === 'dark' ? '🌙' : '🔊'}</span>
                <span className="text-[11px] font-black text-amber-950 dark:text-cyan-300">เสียง & ธีม</span>
                <span className="text-[9px] text-amber-700 dark:text-slate-400">{theme === 'dark' ? 'Cyber' : 'Daylight'}</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: PERIODIC QUIZ */}
        {activeScreen === 'quiz' && (
          <ModePeriodicQuiz
            user={user}
            onBack={() => setActiveScreen('home')}
            onAddScore={addScore}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onUpdateStatus={updatePresenceStatus}
          />
        )}

        {/* SCREEN 3: GRID PLACEMENT */}
        {activeScreen === 'grid' && (
          <ModeGridPlacement
            user={user}
            onBackToMenu={() => setActiveScreen('home')}
            onAddScore={addScore}
          />
        )}

        {/* SCREEN 4: PROPERTY MATCH */}
        {activeScreen === 'match' && (
          <ModePropertyMatch
            user={user}
            onBackToMenu={() => setActiveScreen('home')}
            onAddScore={addScore}
          />
        )}

        {/* SCREEN 5: REAL-TIME BATTLE */}
        {activeScreen === 'battle' && (
          <ModeRealtimeBattle
            user={user}
            onBackToMenu={() => setActiveScreen('home')}
            onAddScore={addScore}
          />
        )}

        {/* SCREEN 6: PERIODIC EXPLORER */}
        {activeScreen === 'explorer' && (
          <ModePeriodicExplorer
            onBackToMenu={() => setActiveScreen('home')}
          />
        )}
      </main>

      {/* Offline Toast */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-50 flex items-center justify-center gap-2 bg-amber-600 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl border-2 border-slate-900">
          <WifiOff className="h-4 w-4" />
          <span>โหมดออฟไลน์: กำลังเล่นด้วยข้อมูลที่แคชไว้ในเครื่อง</span>
        </div>
      )}

      {/* Modals */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentUser={user}
        leaderboard={leaderboard}
        onlineUsers={onlineUsers}
        latestEvent={latestEvent}
        onRefresh={fetchLeaderboard}
        isConnected={isConnected}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        user={user}
        onLoginGoogle={loginWithGoogle}
        onLogout={logout}
        onUpdateProfile={updateProfile}
      />

      <PWAInstallModal
        isOpen={showInstall}
        onClose={() => setShowInstall(false)}
      />

      <AudioSettingsModal
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
        onOpenMusicPlayer={() => setShowMusicPlayerModal(true)}
      />

      <AnalyticsModal
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />

      {/* Persistent & Floating Music Player (PURPEECH - ไม่มีวันไหนที่ไม่คิดถึง) */}
      <MusicPlayer
        isGameActive={activeScreen === 'quiz' || activeScreen === 'battle'}
        isOpenModal={showMusicPlayerModal}
        onCloseModal={() => setShowMusicPlayerModal(false)}
        onRequestOpenModal={() => setShowMusicPlayerModal(true)}
      />
    </div>
  );
}
