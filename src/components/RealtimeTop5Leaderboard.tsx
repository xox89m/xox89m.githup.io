import React from 'react';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  ChevronRight, 
  Radio, 
  Swords, 
  BarChart3, 
  Zap,
  Target
} from 'lucide-react';
import { LeaderboardEntry, LiveScoreEvent, UserProfile } from '../types';
import { soundManager } from '../services/sound';

interface RealtimeTop5LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUser: UserProfile;
  latestEvent: LiveScoreEvent | null;
  isConnected: boolean;
  onOpenFullLeaderboard: () => void;
  onOpenAnalytics: (targetUserId?: string) => void;
  onStartBattle: () => void;
}

export const RealtimeTop5Leaderboard: React.FC<RealtimeTop5LeaderboardProps> = ({
  leaderboard,
  currentUser,
  latestEvent,
  isConnected,
  onOpenFullLeaderboard,
  onOpenAnalytics,
  onStartBattle
}) => {
  // Sort and pick Top 5 players
  const top5 = [...leaderboard]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Find user rank
  const userRankIndex = leaderboard.findIndex(e => e.id === currentUser.id || e.name === currentUser.name);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : leaderboard.length + 1;
  const isUserInTop5 = userRank <= 5;
  const pointsToTop5 = !isUserInTop5 && top5.length >= 5 ? Math.max(10, (top5[4]?.totalPoints || 1000) - currentUser.totalPoints + 10) : 0;

  return (
    <div 
      id="realtime-top5-leaderboard-card"
      className="bg-white dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] space-y-3.5 transition-all overflow-hidden relative"
    >
      {/* Header Banner with Realtime Pulsing Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-amber-400 text-amber-950 font-black shadow-xs border border-amber-500">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                5 อันดับคะแนนสูงสุด
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-extrabold text-[11px]">
                TOP 5
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              กระดานคะแนนเรียลไทม์ · อัปเดตทันทีเมื่อมีคนทำแต้ม
            </p>
          </div>
        </div>

        {/* Real-time Connection Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>{isConnected ? 'LIVE เรียลไทม์' : 'ซิงก์สดอัตโนมัติ'}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenFullLeaderboard();
            }}
            className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Recent Score Event Ticker */}
      {latestEvent && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5 truncate">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="font-bold truncate">{latestEvent.userName}</span>
            <span className="text-[11px] text-amber-700 dark:text-amber-300">เพิ่งได้</span>
            <span className="font-black px-1.5 py-0.2 rounded-md bg-amber-400 text-amber-950 text-[11px]">
              +{latestEvent.pointsAdded} แต้ม
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">({latestEvent.gameMode})</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">สด</span>
        </div>
      )}

      {/* Top 5 Ranked List */}
      <div className="space-y-2">
        {top5.map((player) => {
          const isCurrent = player.id === currentUser.id || player.name === currentUser.name;
          const isBoss = player.id === 'bot-boss-3-1' || player.name.includes('บอส');

          // Rank styling
          let rankBadge = `${player.rank}`;
          let rankContainerClass = 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-zinc-700';
          let borderHighlight = 'border-slate-200 dark:border-zinc-800';

          if (player.rank === 1) {
            rankBadge = '🥇 #1';
            rankContainerClass = 'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 border-amber-500 font-black shadow-xs';
            borderHighlight = 'border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20';
          } else if (player.rank === 2) {
            rankBadge = '🥈 #2';
            rankContainerClass = 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 border-slate-400 font-black';
            borderHighlight = 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-zinc-850/50';
          } else if (player.rank === 3) {
            rankBadge = '🥉 #3';
            rankContainerClass = 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-700 font-black';
            borderHighlight = 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10';
          }

          if (isCurrent) {
            borderHighlight = 'border-blue-500 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-400/50';
          }

          return (
            <div
              key={player.id}
              className={`p-2.5 sm:p-3 rounded-2xl border-2 ${borderHighlight} transition-all duration-200 flex items-center justify-between gap-3 group hover:scale-[1.01]`}
            >
              {/* Left: Rank & Avatar & Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Rank Badge */}
                <div className={`px-2 py-1 rounded-xl text-xs flex items-center justify-center shrink-0 border ${rankContainerClass}`}>
                  {rankBadge}
                </div>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <span className="text-2xl p-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 block shadow-2xs">
                    {player.avatar}
                  </span>
                  {isBoss && (
                    <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full bg-purple-600 text-white text-[9px] font-black shadow-xs">
                      BOSS
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-black shadow-xs">
                      คุณ
                    </span>
                  )}
                </div>

                {/* Name & Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {player.name}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-[10px] font-bold shrink-0">
                        (คุณ)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">
                      Lv.{player.level}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      🎯 แม่น {player.accuracy ?? 85}%
                    </span>
                    <span>•</span>
                    <span>{player.totalAnswered ?? 1} ข้อ</span>
                  </div>
                </div>
              </div>

              {/* Right: Score & Action */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                    {player.totalPoints.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    แต้มสะสม ⭐
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    onOpenAnalytics(player.id);
                  }}
                  title="ดูสถิติและกราฟการเรียนรู้"
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-300 transition cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* If current user is not in top 5, show their position and gap */}
      {!isUserInTop5 && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-900 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl p-1 rounded-xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800">
              {currentUser.avatar}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-blue-950 dark:text-blue-200">
                  อันดับของคุณ: #{userRank} {currentUser.name}
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-blue-600 text-white font-bold text-[10px]">
                  {currentUser.totalPoints.toLocaleString()} แต้ม
                </span>
              </div>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300 mt-0.5">
                ต้องการอีก <strong className="text-blue-900 dark:text-blue-100 font-black">+{pointsToTop5} แต้ม</strong> เพื่อขึ้นสู่ TOP 5! 🚀
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onStartBattle();
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>ลุยดวลบอส</span>
          </button>
        </div>
      )}

      {/* Footer Quick Action Bar */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span>เล่นเกมตอบคำถามหรือท้าดวลบอสเพื่อสะสมคะแนนไต่อันดับได้ตลอดเวลา!</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onStartBattle();
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>ดวลบอส 3/1</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenFullLeaderboard();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>ดูกระดานเต็ม</span>
          </button>
        </div>
      </div>
    </div>
  );
};
