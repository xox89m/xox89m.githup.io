import React, { useState } from 'react';
import { LeaderboardEntry, OnlineUser, LiveScoreEvent, UserProfile } from '../types';
import { 
  Trophy, 
  RefreshCw, 
  X, 
  Award, 
  UserCheck, 
  Zap, 
  ShieldCheck,
  BarChart3,
  Target
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  leaderboard: LeaderboardEntry[];
  onlineUsers: OnlineUser[];
  latestEvent: LiveScoreEvent | null;
  onRefresh: () => void;
  isConnected: boolean;
  onViewAnalytics?: (userId: string) => void;
}

export const LeaderboardModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  currentUser,
  leaderboard,
  onlineUsers,
  latestEvent,
  onRefresh,
  isConnected,
  onViewAnalytics
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'online'>('leaderboard');
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleManualRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Find user rank
  const myRank = leaderboard.findIndex(e => e.id === currentUser.id) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-black shadow-2xl border-2 border-slate-900 dark:border-zinc-800 text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 dark:border-zinc-800 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-5 py-3.5 text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm border-2 border-slate-900">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black tracking-tight">กระดานจัดอันดับผู้เล่นจริง</h2>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isConnected ? 'bg-emerald-800 text-emerald-100' : 'bg-rose-800 text-rose-100'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                  {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-[11px] text-amber-950 font-bold">
                จัดอันดับตามคะแนนผู้เล่นที่เข้ามาเล่นจริง สดแบบเรียลไทม์
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-900 hover:bg-black/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Event Ticker if present */}
        {latestEvent && (
          <div className="bg-slate-900 dark:bg-zinc-900 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-700 dark:border-zinc-800 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 truncate">
              <Zap className="h-3.5 w-3.5 text-yellow-400 shrink-0 animate-bounce" />
              <span className="truncate">
                <strong className="text-yellow-300">{latestEvent.userName}</strong> เพิ่งได้ +{latestEvent.pointsAdded} แต้ม ({latestEvent.gameMode})
              </span>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0 ml-2">เมื่อครู่</span>
          </div>
        )}

        {/* Current User Snapshot Card */}
        <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 border-b border-amber-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-700 shadow-xs">
              {currentUser.avatar}
            </span>
            <div>
              <div className="text-xs text-amber-950 dark:text-amber-200 font-black flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                <span>คุณ: {currentUser.name}</span>
                {currentUser.email && (
                  <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" title="บัญชี Google ยืนยันแล้ว" />
                )}
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300/80 font-semibold flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>{myRank > 0 ? `อันดับที่ #${myRank}` : 'ยังไม่มีอันดับ'}</span>
                <span>•</span>
                <span>เลเวล {currentUser.level}</span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">🎯 แม่นยำ {currentUser.accuracy ?? 0}%</span>
                <span>•</span>
                <span>📝 {currentUser.totalAnswered ?? 0} ข้อ</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-right">
              <div className="text-base font-black text-amber-950 dark:text-amber-200">
                {currentUser.totalPoints.toLocaleString()}
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">แต้มสะสมรวม</div>
            </div>
            {onViewAnalytics && (
              <button
                onClick={() => onViewAnalytics(currentUser.id)}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
              >
                <BarChart3 className="w-3 h-3" />
                <span>กราฟของคุณ</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-white dark:bg-black text-blue-700 dark:text-cyan-300 border-2 border-slate-900 dark:border-zinc-700 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>กระดานคะแนน ({leaderboard.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'online'
                ? 'bg-white dark:bg-black text-emerald-700 dark:text-emerald-400 border-2 border-slate-900 dark:border-zinc-700 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>ออนไลน์สด ({onlineUsers.length} คน)</span>
          </button>
        </div>

        {/* Tab 1: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="p-3.5 flex-1 overflow-y-auto space-y-2 max-h-[50vh]">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold px-1 mb-1">
              <span>อันดับยอดนักเคมี</span>
              <button 
                onClick={handleManualRefresh} 
                disabled={refreshing}
                className="flex items-center gap-1 text-blue-600 dark:text-cyan-400 hover:underline transition cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                <span>รีเฟรชสด</span>
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                กำลังโหลดกระดานคะแนนสด...
              </div>
            ) : (
              leaderboard.map((entry, index) => {
                const isMe = entry.id === currentUser.id;
                const isTop5 = index < 5;
                const accuracy = entry.accuracy ?? (entry.id === 'bot-boss-3-1' ? 88 : (entry.wins > 0 ? Math.min(95, 65 + entry.wins * 6) : 0));
                const totalQuestions = entry.totalAnswered ?? (entry.id === 'bot-boss-3-1' ? 35 : (entry.wins * 8 || 1));
                let rankBadge = `${index + 1}`;
                let rankColor = 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-zinc-700';

                if (index === 0) {
                  rankBadge = '🥇 1';
                  rankColor = 'bg-amber-400 text-amber-950 border-amber-600 shadow-sm';
                } else if (index === 1) {
                  rankBadge = '🥈 2';
                  rankColor = 'bg-slate-300 text-slate-900 border-slate-500';
                } else if (index === 2) {
                  rankBadge = '🥉 3';
                  rankColor = 'bg-amber-600 text-white border-amber-800';
                } else if (index < 5) {
                  rankBadge = `#${index + 1}`;
                  rankColor = 'bg-blue-100 dark:bg-zinc-800 text-blue-900 dark:text-cyan-300 border-blue-300 dark:border-zinc-600 font-black';
                }

                return (
                  <React.Fragment key={entry.id || index}>
                    {index === 0 && (
                      <div className="flex items-center justify-between px-1 pt-1 pb-0.5 text-[11px] font-black text-amber-600 dark:text-amber-400">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>5 อันดับแรกที่มีคะแนนสูงสุด (TOP 5)</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">🔴 สดเรียลไทม์</span>
                      </div>
                    )}
                    {index === 5 && (
                      <div className="flex items-center gap-1.5 px-1 pt-2 pb-0.5 text-[11px] font-bold text-slate-400 border-t border-slate-200 dark:border-zinc-800">
                        <span>อันดับผู้เล่นคนอื่นๆ</span>
                      </div>
                    )}
                    <div 
                      className={`flex items-center justify-between p-2.5 rounded-2xl border-2 transition ${
                        isMe 
                          ? 'border-blue-600 dark:border-cyan-400 bg-blue-50 dark:bg-zinc-900 shadow-[2px_2px_0px_#2563eb] dark:shadow-[2px_2px_0px_#06b6d4]' 
                          : isTop5
                            ? 'border-slate-300 dark:border-zinc-750 bg-white dark:bg-zinc-900 hover:border-amber-400 dark:hover:border-amber-500'
                            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-400 dark:hover:border-zinc-700'
                      }`}
                    >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`flex h-7 min-w-7 items-center justify-center rounded-xl border px-1.5 text-xs font-black shrink-0 ${rankColor}`}>
                        {rankBadge}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{entry.avatar}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1 truncate">
                            <span className="truncate">{entry.name}</span>
                            {entry.id === 'bot-boss-3-1' && (
                              <span className="text-[9px] bg-purple-700 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                บอส
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[9px] bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                คุณ
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-medium mt-0.5">
                            <span>Lv.{entry.level}</span>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              ชนะ {entry.wins}
                            </span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              🎯 แม่น {accuracy}%
                            </span>
                            <span>•</span>
                            <span>📝 {totalQuestions} ข้อ</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 ml-2">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {entry.totalPoints.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">คะแนน</div>
                      {onViewAnalytics && (
                        <button
                          onClick={() => onViewAnalytics(entry.id)}
                          title={`ดูกราฟวิเคราะห์ของผู้เล่น ${entry.name}`}
                          className="mt-1 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/60 dark:hover:bg-blue-800 dark:text-blue-200 transition cursor-pointer"
                        >
                          <BarChart3 className="w-3 h-3" />
                          <span>วิเคราะห์</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Live Online Users */}
        {activeTab === 'online' && (
          <div className="p-3.5 flex-1 overflow-y-auto space-y-2 max-h-[50vh]">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold px-1 mb-1">
              <span>ผู้เล่นที่กำลังออนไลน์ขณะนี้ ({onlineUsers.length} คน)</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                อัปเดตอัตโนมัติ
              </span>
            </div>

            {onlineUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                ยังไม่มีผู้เล่นออนไลน์ขณะนี้
              </div>
            ) : (
              onlineUsers.map(onlineUser => {
                const isMe = onlineUser.id === currentUser.id;
                return (
                  <div
                    key={onlineUser.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border-2 transition ${
                      isMe 
                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-zinc-900 shadow-[2px_2px_0px_#059669]' 
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <span className="text-2xl p-1 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 block">
                          {onlineUser.avatar}
                        </span>
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{onlineUser.name}</span>
                          {isMe && (
                            <span className="text-[9px] bg-emerald-700 text-white font-bold px-1.5 py-0.2 rounded-full">
                              คุณเอง
                            </span>
                          )}
                          {onlineUser.email && (
                            <ShieldCheck className="h-3 w-3 text-blue-600 dark:text-cyan-400" title="Google Verified" />
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                          <span>{onlineUser.status || 'ออนไลน์ 🟢'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        {onlineUser.totalPoints.toLocaleString()} แต้ม
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        เลเวล {onlineUser.level}
                      </div>
                      {onViewAnalytics && (
                        <button
                          onClick={() => onViewAnalytics(onlineUser.id)}
                          className="mt-1 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/60 dark:hover:bg-blue-800 dark:text-blue-200 transition cursor-pointer"
                        >
                          <BarChart3 className="w-3 h-3" />
                          <span>วิเคราะห์</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            💡 เล่นควิซและดวล 1v1 เพื่ออัปเดตอันดับแบบสดๆ
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-3 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-zinc-700 transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
