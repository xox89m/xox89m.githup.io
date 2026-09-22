import React, { useState } from 'react';
import { UserProfile, Achievement } from '../types';
import { ALL_ACHIEVEMENTS, RARITY_INFO } from '../data/achievements';
import { Award, Check, Lock, Sparkles, Trophy, Zap, Shield, Star, BookOpen, Layers } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface Props {
  user: UserProfile;
  onSelectAchievement?: (ach: Achievement) => void;
  onNavigateTab?: (tab: 'account' | 'rating') => void;
}

export const AchievementsSection: React.FC<Props> = ({
  user,
  onSelectAchievement,
  onNavigateTab
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const unlockedIds = user.unlockedAchievements || [];
  const unlockedCount = unlockedIds.length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  const percentUnlocked = Math.round((unlockedCount / totalCount) * 100);

  // Total points earned from unlocked achievements
  const totalRewardPoints = ALL_ACHIEVEMENTS
    .filter(a => unlockedIds.includes(a.id))
    .reduce((sum, a) => sum + a.rewardPoints, 0);

  const filteredAchievements = ALL_ACHIEVEMENTS.filter(ach => {
    const isUnlocked = unlockedIds.includes(ach.id);
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });

  const getAchievementProgress = (ach: Achievement): { current: number; max: number; text: string; percent: number } => {
    const isUnlocked = unlockedIds.includes(ach.id);

    if (ach.id === 'streak_10') {
      const best = Math.max(user.highestCombo || 0, user.currentStreak || 0);
      const current = isUnlocked ? 10 : Math.min(10, best);
      return {
        current,
        max: 10,
        text: isUnlocked ? 'ทำคอมโบสำเร็จ 10 ข้อแล้ว!' : `คอมโบสูงสุด: ${current}/10 ข้อ (ขาดอีก ${10 - current} ข้อ)`,
        percent: Math.min(100, Math.round((current / 10) * 100))
      };
    }

    if (ach.id === 'all_5_modes') {
      const modes = user.modesPlayed || [];
      const current = isUnlocked ? 5 : Math.min(5, modes.length);
      return {
        current,
        max: 5,
        text: isUnlocked ? 'เล่นครบทั้ง 5 โหมดแล้ว!' : `เข้าเล่นแล้ว ${current}/5 โหมด`,
        percent: Math.min(100, Math.round((current / 5) * 100))
      };
    }

    if (ach.id === 'first_correct') {
      const current = isUnlocked || (user.totalAnswered || 0) > 0 ? 1 : 0;
      return {
        current,
        max: 1,
        text: isUnlocked ? 'ตอบถูกข้อแรกสำเร็จแล้ว' : 'ตอบคำถามให้ถูกต้องอย่างน้อย 1 ข้อ',
        percent: isUnlocked ? 100 : 0
      };
    }

    if (ach.id === 'battle_winner') {
      const current = isUnlocked || user.wins > 0 ? 1 : 0;
      return {
        current,
        max: 1,
        text: isUnlocked ? `คว้าชัยชนะในศึกดวลสดแล้ว (${user.wins} ครั้ง)` : 'ชนะคู่ต่อสู้ในโหมดดวลสด 1 ครั้ง',
        percent: isUnlocked ? 100 : 0
      };
    }

    if (ach.id === 'boss_slayer') {
      return {
        current: isUnlocked ? 1 : 0,
        max: 1,
        text: isUnlocked ? 'พิชิตบอส 3/1 สำเร็จแล้ว!' : 'เอาชนะบอส 3/1 ในโหมดแบทเทิลดวลสด',
        percent: isUnlocked ? 100 : 0
      };
    }

    if (ach.id === 'grid_master') {
      const count = user.achievementsProgress?.['grid_master'] || 0;
      const current = isUnlocked ? 3 : Math.min(3, count);
      return {
        current,
        max: 3,
        text: isUnlocked ? 'วางธาตุลงในตารางสำเร็จแล้ว' : `วางธาตุถูกต้อง: ${current}/3 ครั้ง`,
        percent: Math.min(100, Math.round((current / 3) * 100))
      };
    }

    if (ach.id === 'match_expert') {
      return {
        current: isUnlocked ? 1 : 0,
        max: 1,
        text: isUnlocked ? 'จับคู่ธาตุกับคุณสมบัติสำเร็จแล้ว' : 'จับคู่ธาตุให้ถูกต้องในโหมดจับคู่',
        percent: isUnlocked ? 100 : 0
      };
    }

    if (ach.id === 'explorer_scholar') {
      const count = (user.exploredElements || []).length;
      const current = isUnlocked ? 10 : Math.min(10, count);
      return {
        current,
        max: 10,
        text: isUnlocked ? 'สำรวจสารานุกรมครบ 10 ธาตุแล้ว' : `เปิดดูธาตุในสารานุกรม: ${current}/10 ธาตุ`,
        percent: Math.min(100, Math.round((current / 10) * 100))
      };
    }

    if (ach.id === 'score_1000') {
      const current = Math.min(1000, user.totalPoints);
      return {
        current,
        max: 1000,
        text: isUnlocked ? `สะสมทะลุ 1,000 แต้มแล้ว (${user.totalPoints.toLocaleString()} แต้ม)` : `คะแนนสะสม: ${user.totalPoints.toLocaleString()} / 1,000 แต้ม`,
        percent: Math.min(100, Math.round((current / 1000) * 100))
      };
    }

    if (ach.id === 'reviewer_badge') {
      return {
        current: isUnlocked ? 1 : 0,
        max: 1,
        text: isUnlocked ? 'ส่งคะแนนรีวิวเรียบร้อย ขอบคุณครับ!' : 'ให้คะแนนหรือเขียนรีวิวในแท็บรีวิว',
        percent: isUnlocked ? 100 : 0
      };
    }

    return {
      current: isUnlocked ? 1 : 0,
      max: 1,
      text: isUnlocked ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก',
      percent: isUnlocked ? 100 : 0
    };
  };

  const modeChecklist = [
    { key: 'quiz', label: 'ตอบคำถาม', icon: '❓' },
    { key: 'battle', label: 'ดวล 1v1', icon: '⚔️' },
    { key: 'grid', label: 'จัดเรียงตาราง', icon: '🧩' },
    { key: 'match', label: 'จับคู่คุณสมบัติ', icon: '🔗' },
    { key: 'explorer', label: 'สารานุกรม', icon: '📖' }
  ];

  return (
    <div className="space-y-4">
      {/* Overview Statistics Banner */}
      <div className="rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-gradient-to-br from-amber-400/20 via-yellow-400/10 to-amber-500/20 dark:from-amber-950/40 dark:via-zinc-900 dark:to-zinc-900 p-4 shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#27272a] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950 text-xl border-2 border-slate-900 shadow-xs">
              🏆
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>ความสำเร็จของผู้เล่น</span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  ({unlockedCount}/{totalCount})
                </span>
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                ทำภารกิจสะสมเหรียญตราและรับแต้มโบนัสพิเศษ
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">แต้มโบนัสที่ได้รับ</div>
            <div className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
              +{totalRewardPoints.toLocaleString()} แต้ม
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-slate-700 dark:text-slate-300">ความคืบหน้ารวม</span>
            <span className="font-mono text-amber-600 dark:text-amber-400">{percentUnlocked}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden border border-slate-300 dark:border-zinc-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
              style={{ width: `${percentUnlocked}%` }}
            />
          </div>
        </div>

        {/* Unlocked Badges Mini Showcase Strip */}
        <div className="pt-1 border-t border-slate-200/60 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 shrink-0">
            เหรียญที่ปลด:
          </span>
          {ALL_ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlockedIds.includes(ach.id);
            return (
              <span
                key={ach.id}
                title={`${ach.title} - ${ach.description} (${isUnlocked ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก'})`}
                className={`inline-flex items-center justify-center h-7 w-7 rounded-lg text-sm border shrink-0 transition-transform ${
                  isUnlocked
                    ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-400 dark:border-amber-600 text-amber-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 opacity-30 grayscale'
                }`}
              >
                {ach.icon}
              </span>
            );
          })}
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-100 dark:bg-zinc-900 p-1 gap-1 text-xs font-black">
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setFilter('all');
          }}
          className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
            filter === 'all'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          ทั้งหมด ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setFilter('unlocked');
          }}
          className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
            filter === 'unlocked'
              ? 'bg-emerald-500 text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          ปลดล็อกแล้ว ({unlockedCount})
        </button>
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setFilter('locked');
          }}
          className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
            filter === 'locked'
              ? 'bg-slate-700 text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          ยังไม่ปลดล็อก ({totalCount - unlockedCount})
        </button>
      </div>

      {/* Achievements Cards List */}
      <div className="space-y-2.5">
        {filteredAchievements.map(ach => {
          const isUnlocked = unlockedIds.includes(ach.id);
          const rarity = RARITY_INFO[ach.rarity];
          const progress = getAchievementProgress(ach);

          return (
            <div
              key={ach.id}
              onClick={() => {
                soundManager.playClick();
                if (onSelectAchievement) onSelectAchievement(ach);
              }}
              className={`rounded-2xl border-2 p-3.5 transition-all shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a] ${
                isUnlocked
                  ? 'border-amber-400/90 dark:border-amber-500/70 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20'
                  : 'border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Large Badge Icon with Rarity Frame */}
                <div
                  className={`relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border-2 text-2xl shadow-xs transition-transform ${
                    isUnlocked
                      ? `${rarity.border} ${rarity.bg} scale-100`
                      : 'border-slate-300 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 opacity-60'
                  }`}
                >
                  <span>{ach.icon}</span>
                  {!isUnlocked ? (
                    <div className="absolute -bottom-1 -right-1 bg-slate-800 text-slate-200 rounded-full p-0.5 text-[9px] border border-slate-600">
                      <Lock className="h-2.5 w-2.5" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 text-[9px] shadow-xs">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className={`text-sm font-black truncate ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {ach.title}
                      </h4>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${rarity.border} ${rarity.bg}`}>
                        {rarity.label}
                      </span>
                    </div>

                    <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                      +{ach.rewardPoints} แต้ม
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    {ach.description}
                  </p>

                  {/* Special display for all_5_modes */}
                  {ach.id === 'all_5_modes' && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {modeChecklist.map(m => {
                        const hasPlayed = (user.modesPlayed || []).includes(m.key);
                        return (
                          <span
                            key={m.key}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                              hasPlayed
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <span>{m.icon}</span>
                            <span>{m.label}</span>
                            {hasPlayed ? <Check className="h-2.5 w-2.5 text-emerald-600" /> : <span className="text-[8px]">○</span>}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Progress Bar & Status Text */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-850">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      <span>{progress.text}</span>
                      <span className="font-mono text-[10px]">
                        {isUnlocked ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                            <Check className="h-3 w-3" /> สำเร็จแล้ว
                          </span>
                        ) : (
                          `${progress.current}/${progress.max}`
                        )}
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isUnlocked ? 'bg-emerald-500' : 'bg-blue-500 dark:bg-cyan-500'
                        }`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
