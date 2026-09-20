import React from 'react';
import { UserProfile } from '../types';
import { Trophy, Smartphone, Volume2, VolumeX, Sun, Moon, BarChart3, Music } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

interface Props {
  user: UserProfile;
  onlineCount?: number;
  isConnected?: boolean;
  onOpenLeaderboard: () => void;
  onOpenAuth: () => void;
  onOpenInstall: () => void;
  onOpenAudio: () => void;
  onOpenAnalytics: () => void;
  onOpenMusic?: () => void;
}

export const Navbar: React.FC<Props> = ({
  user,
  onlineCount = 1,
  isConnected = true,
  onOpenLeaderboard,
  onOpenAuth,
  onOpenInstall,
  onOpenAudio,
  onOpenAnalytics,
  onOpenMusic
}) => {
  const { isMuted, playClick, theme, toggleTheme, isIdleSongEnabled, toggleIdleSong } = useAudio();

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-slate-900 dark:border-zinc-800 bg-white/95 dark:bg-black/95 backdrop-blur-md px-3 sm:px-4 py-2 shadow-sm transition-colors duration-200">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg border-2 border-slate-900 dark:border-zinc-800 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]">
            🧪
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                เกมเกี่ยวกับตารางธาตุ
              </h1>
              {/* Real-time online pulse badge */}
              <button
                onClick={() => {
                  playClick();
                  onOpenLeaderboard();
                }}
                title={`กำลังออนไลน์ ${onlineCount} คนแบบเรียลไทม์`}
                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 dark:border-emerald-600 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 cursor-pointer"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
                <span>{onlineCount} สด</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${theme === 'dark' ? 'bg-zinc-900 text-cyan-300 border border-zinc-700' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                {theme === 'dark' ? '🌙 เสียง Cyber Lab' : '☀️ เสียง Day Lab'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Dark / Light Mode Toggle with Distinct Audio */}
          <button
            onClick={() => {
              toggleTheme();
            }}
            title={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง (เสียง Daylight Lab)' : 'เปลี่ยนเป็นโหมดมืด (เสียง Cyber Neon Lab)'}
            className={`flex items-center justify-center h-8 w-8 rounded-xl border-2 transition active:translate-y-0.5 cursor-pointer ${
              theme === 'dark'
                ? 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-zinc-700 shadow-[2px_2px_0px_#27272a]'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-slate-900 shadow-[2px_2px_0px_#1e293b]'
            }`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-300 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-slate-800 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Sound Mute / Settings Quick Toggle */}
          <button
            onClick={() => {
              playClick();
              onOpenAudio();
            }}
            title={isMuted ? 'เปิดเสียง / ตั้งค่าเสียง' : 'ปิดเสียง / ตั้งค่าเสียง'}
            className={`flex items-center justify-center h-8 w-8 rounded-xl border-2 border-slate-900 dark:border-zinc-800 text-xs font-black shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] transition active:translate-y-0.5 cursor-pointer ${
              isMuted 
                ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 hover:bg-rose-200' 
                : 'bg-indigo-50 dark:bg-zinc-900 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Idle Song: เพลงไม่มีวันไหนที่ไม่คิดถึง Toggle & Modal */}
          <button
            onClick={() => {
              playClick();
              if (onOpenMusic) {
                onOpenMusic();
              } else {
                toggleIdleSong();
              }
            }}
            title="เครื่องเล่นเพลง: ไม่มีวันไหนที่ไม่คิดถึง (starlost. - PURPEECH)"
            className="flex items-center justify-center h-8 w-8 rounded-xl border-2 bg-pink-500 hover:bg-pink-600 text-white border-pink-700 shadow-[2px_2px_0px_#be185d] transition active:translate-y-0.5 cursor-pointer"
          >
            <Music className="h-4 w-4" />
          </button>

          {/* Analytics / Event Tracking Button */}
          <button
            onClick={() => {
              playClick();
              onOpenAnalytics();
            }}
            title="สถิติเชิงวิเคราะห์พฤติกรรมผู้เรียน (Analytics)"
            className="flex items-center gap-1 py-1 px-2 rounded-xl bg-violet-100 dark:bg-violet-950/80 hover:bg-violet-200 dark:hover:bg-violet-900/60 border-2 border-slate-900 dark:border-zinc-800 text-violet-950 dark:text-violet-200 text-xs font-black shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] transition active:translate-y-0.5 cursor-pointer"
          >
            <BarChart3 className="h-3.5 w-3.5 text-violet-700 dark:text-violet-400" />
            <span className="hidden sm:inline">วิเคราะห์</span>
          </button>

          {/* PWA Install Button */}
          <button
            onClick={() => {
              playClick();
              onOpenInstall();
            }}
            title="ติดตั้งแอปลงมือถือ (PWA)"
            className="flex items-center gap-1 py-1 px-2 rounded-xl bg-emerald-100 dark:bg-zinc-900 hover:bg-emerald-200 dark:hover:bg-zinc-800 border-2 border-slate-900 dark:border-zinc-800 text-emerald-900 dark:text-emerald-300 text-xs font-black shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] transition active:translate-y-0.5 cursor-pointer"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
            <span className="hidden sm:inline">ติดตั้งแอป</span>
            <span className="sm:hidden">แอป</span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => {
              playClick();
              onOpenLeaderboard();
            }}
            title="กระดานผู้นำเรียลไทม์"
            className="flex items-center gap-1 py-1 px-2 rounded-xl bg-amber-100 dark:bg-zinc-900 hover:bg-amber-200 dark:hover:bg-zinc-800 border-2 border-slate-900 dark:border-zinc-800 text-amber-950 dark:text-amber-300 text-xs font-black shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] transition active:translate-y-0.5 cursor-pointer"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">{user.totalPoints.toLocaleString()}</span>
          </button>

          {/* User Profile Button */}
          <button
            onClick={() => {
              playClick();
              onOpenAuth();
            }}
            title="โปรไฟล์ผู้เล่น & Google Sign-In"
            className="flex items-center gap-1 py-1 px-2 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border-2 border-slate-900 dark:border-zinc-800 text-slate-800 dark:text-slate-200 text-xs font-black shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] transition active:translate-y-0.5 cursor-pointer"
          >
            <span className="text-sm">{user.avatar}</span>
            <span className="max-w-[55px] truncate text-[11px] hidden sm:inline">
              {user.name}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
