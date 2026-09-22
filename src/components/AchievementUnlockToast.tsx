import React, { useEffect, useState } from 'react';
import { subscribeToAchievementUnlocks, AchievementUnlockEvent } from '../utils/achievementSystem';
import { RARITY_INFO } from '../data/achievements';
import { Sparkles, X, Award } from 'lucide-react';

export const AchievementUnlockToast: React.FC = () => {
  const [currentQueue, setCurrentQueue] = useState<AchievementUnlockEvent[]>([]);
  const [activeToast, setActiveToast] = useState<AchievementUnlockEvent | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAchievementUnlocks((event) => {
      setCurrentQueue((prev) => [...prev, event]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeToast && currentQueue.length > 0) {
      const next = currentQueue[0];
      setActiveToast(next);
      setCurrentQueue((prev) => prev.slice(1));

      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4800);

      return () => clearTimeout(timer);
    }
  }, [activeToast, currentQueue]);

  if (!activeToast) return null;

  const { achievement } = activeToast;
  const rarity = RARITY_INFO[achievement.rarity];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`pointer-events-auto max-w-md w-full rounded-2xl border-3 border-slate-900 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-3.5 shadow-[6px_6px_0px_#1e293b] dark:shadow-[6px_6px_0px_#27272a] flex items-center gap-3.5 relative overflow-hidden`}>
        {/* Ambient background glow */}
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Icon with rarity ring */}
        <div className={`relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border-2 ${rarity.border} ${rarity.bg} text-2xl shadow-md`}>
          <span>{achievement.icon}</span>
          <div className="absolute -bottom-1.5 -right-1 bg-slate-900 text-amber-300 text-[9px] px-1 py-0.2 rounded-full font-black border border-slate-700 flex items-center gap-0.5">
            <Sparkles className="h-2 w-2 text-amber-400" />
            <span>{rarity.label}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            <Award className="h-3 w-3" />
            <span>ปลดล็อกความสำเร็จใหม่!</span>
          </div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
            {achievement.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
            {achievement.description}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              +{achievement.rewardPoints} แต้มโบนัส! 🌟
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setActiveToast(null)}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          title="ปิดการแจ้งเตือน"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
