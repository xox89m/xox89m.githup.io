import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchAllPlayLogs, 
  subscribePlayLogs,
  computeAnalyticsSummary, 
  getUniqueUsers,
  PlayLogEvent, 
  AnalyticsSummary,
  getElapsedSessionSeconds,
  getCurrentSessionId,
  downloadPlayLogsCSV
} from '../services/analytics';
import { ELEMENTS } from '../data/elements';
import { 
  BarChart3, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles,
  Database,
  Layers,
  Users,
  AlertTriangle,
  Download,
  Flame,
  Target,
  Maximize2,
  Minimize2,
  BookOpen
} from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

// Quick map for element info lookup
const ELEMENT_MAP = new Map(ELEMENTS.map(el => [el.symbol.toUpperCase(), el]));

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, currentUserId }) => {
  const [logs, setLogs] = useState<PlayLogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [sessionSeconds, setSessionSeconds] = useState(getElapsedSessionSeconds());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveSyncActive, setLiveSyncActive] = useState(true);

  // Load initial logs and subscribe to real-time updates
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    // Initial fetch
    fetchAllPlayLogs(1000).then(data => {
      setLogs(data);
      setLoading(false);
    }).catch(err => {
      console.warn('Initial fetch error:', err);
      setLoading(false);
    });

    // Real-time Firestore sync
    const unsubscribe = subscribePlayLogs((updatedLogs) => {
      setLogs(updatedLogs);
      setLiveSyncActive(true);
    }, 1000);

    // Active session timer
    setSessionSeconds(getElapsedSessionSeconds());
    const timer = setInterval(() => {
      setSessionSeconds(getElapsedSessionSeconds());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [isOpen]);

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPlayLogs(1000);
      setLogs(data);
    } catch (e) {
      console.warn('Manual refresh failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // Get unique users list
  const usersList = useMemo(() => getUniqueUsers(logs), [logs]);

  // Filter logs by selected user and game mode
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesUser = selectedUserId === 'all' || (log.userId || 'anonymous') === selectedUserId;
      const matchesMode = selectedMode === 'all' || (log.gameMode || 'quiz') === selectedMode;
      return matchesUser && matchesMode;
    });
  }, [logs, selectedUserId, selectedMode]);

  // Compute summary for current selection
  const summary: AnalyticsSummary = useMemo(() => {
    return computeAnalyticsSummary(filteredLogs);
  }, [filteredLogs]);

  if (!isOpen) return null;

  const formatMinSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins} นาที ${s} วิ`;
  };

  // SVG Pie/Donut Chart calculation
  const totalAnswers = summary.totalAnswered;
  const correctCount = summary.totalCorrect;
  const wrongCount = summary.totalWrong;
  const correctPercent = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
  const wrongPercent = totalAnswers > 0 ? 100 - correctPercent : 0;

  // Donut geometry
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffsetCorrect = 0;
  const strokeDasharrayCorrect = (correctPercent / 100) * circumference;
  const strokeDashoffsetWrong = -strokeDasharrayCorrect;
  const strokeDasharrayWrong = (wrongPercent / 100) * circumference;

  // Top mistaken element item
  const topWrongElement = summary.topMistakenElements[0] || null;
  const topWrongElementInfo = topWrongElement ? ELEMENT_MAP.get(topWrongElement.symbol.toUpperCase()) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`bg-white dark:bg-slate-900 w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-2 sm:inset-4 max-w-none max-h-none h-[calc(100vh-16px)] sm:h-[calc(100vh-32px)]' 
            : 'max-w-5xl max-h-[92vh]'
        }`}
        style={{ fontFamily: "'Mali', 'Sarabun', sans-serif" }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md shadow-inner">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  แดชบอร์ดวิเคราะห์ผู้เรียน (Admin Analytics Dashboard)
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/30 border border-emerald-400/40 text-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Firestore Sync
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                ดึงข้อมูลสดจาก collection <code className="bg-black/20 px-1 py-0.5 rounded font-mono">play_logs</code> วิเคราะห์รายบุคคลและเปรียบเทียบพัฒนาการ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={isFullscreen ? 'ย่อหน้าต่าง' : 'ขยายเต็มจอ'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Control Bar: User Selector & Game Mode Filter */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* User Selector Dropdown */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">เลือกผู้เรียน:</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 max-w-sm px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option value="all">👥 ผู้เล่นทุกคน (ภาพรวมทั้งหมด - All Users) [{logs.length} logs]</option>
              {usersList.map(u => {
                const isCurrentUser = currentUserId && u.userId === currentUserId;
                return (
                  <option key={u.userId} value={u.userId}>
                    👤 {isCurrentUser ? `(คุณ) ` : ''}{u.userId.slice(0, 20)} — {u.total} ข้อ (แม่นยำ {u.accuracy}%)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Action Tools: Refresh & CSV */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              <span>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</span>
            </button>

            <button
              onClick={() => downloadPlayLogsCSV(filteredLogs, `chem_analytics_${selectedUserId}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition active:scale-98"
              title="ส่งออกข้อมูลเป็น CSV สำหรับ Excel และ Looker Studio"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-100">

          {/* User Context Banner if specific user selected */}
          {selectedUserId !== 'all' && (
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[11px]">กำลังแสดงข้อมูลผู้เรียน</span>
                <code className="font-mono text-blue-900 dark:text-blue-300 font-bold">{selectedUserId}</code>
              </div>
              <button
                onClick={() => setSelectedUserId('all')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
              >
                ดูภาพรวมทุกคนทั้งหมด
              </button>
            </div>
          )}

          {/* 1. สถิติสรุป (Summary Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Card 1: จำนวนข้อที่ตอบทั้งหมด */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span className="font-bold">ข้อที่ตอบทั้งหมด</span>
                <Target className="w-4 h-4 text-blue-500" />
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {summary.totalAnswered} <span className="text-sm font-medium text-slate-500">ข้อ</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">ถูก {summary.totalCorrect}</span>
                <span>•</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">ผิด {summary.totalWrong}</span>
              </div>
            </div>

            {/* Card 2: อัตราความแม่นยำรวม */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span className="font-bold">ความแม่นยำรวม</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="my-1">
                <div className={`text-3xl font-black ${
                  summary.overallAccuracy >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                  summary.overallAccuracy >= 50 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-500'
                }`}>
                  {summary.overallAccuracy}%
                </div>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                {summary.totalAnswered === 0 ? 'ยังไม่มีข้อมูล' :
                 summary.overallAccuracy >= 80 ? '🌟 ยอดเยี่ยม เข้าใจตารางธาตุดี' :
                 summary.overallAccuracy >= 60 ? '👍 ผ่านเกณฑ์ ทบทวนเพิ่มอีกนิด' :
                 '📚 ควรฝึกฝนและทบทวนเพิ่มเติม'}
              </div>
            </div>

            {/* Card 3: เวลาเฉลี่ยที่ใช้คิดต่อข้อ (answerTime) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span className="font-bold">เวลาเฉลี่ยต่อข้อ</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="my-1">
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {summary.avgAnswerTime} <span className="text-sm font-medium text-slate-500">วินาที</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                {summary.avgAnswerTime > 0 && summary.avgAnswerTime <= 3 ? '⚡ ตัดสินใจและจำได้รวดเร็วมาก' :
                 summary.avgAnswerTime > 3 && summary.avgAnswerTime <= 8 ? '⏱️ อยู่ในเกณฑ์คิดและตอบปกติ' :
                 summary.totalAnswered > 0 ? '🧐 วิเคราะห์และพิจารณาอย่างรอบคอบ' : 'ยังไม่มีข้อมูล'}
              </div>
            </div>

            {/* Card 4: ธาตุที่ตอบผิดบ่อยที่สุด */}
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs mb-1">
                <span className="font-bold">ธาตุที่ตอบผิดบ่อยสุด</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="my-1">
                {topWrongElement ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                      {topWrongElement.symbol}
                    </span>
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                      ({topWrongElementInfo?.nameTH || 'ธาตุ'})
                    </span>
                  </div>
                ) : (
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {summary.totalAnswered > 0 ? 'ไม่มีข้อผิด 🎉' : 'รอข้อมูล'}
                  </div>
                )}
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-400 pt-1 border-t border-rose-200/60 dark:border-rose-900/40">
                {topWrongElement 
                  ? `ผิดสะสม ${topWrongElement.count} ครั้ง (${topWrongElement.percentage}% ของข้อผิด)` 
                  : summary.totalAnswered > 0 
                    ? 'ความแม่นยำเต็ม 100% สมบูรณ์แบบ' 
                    : 'เมื่อเริ่มตอบคำถามจะแสดงผล'}
              </div>
            </div>

          </div>

          {/* 2. Charts Section: Pie Chart & Comparison Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* 2.1 แผนภูมิวงกลม (Pie / Donut Chart) - สัดส่วน 'ตอบถูก vs ตอบผิด' (%) */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-500" />
                    แผนภูมิสัดส่วน ตอบถูก vs ตอบผิด (Accuracy Ratio)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    สัดส่วนเปอร์เซ็นต์คำตอบที่ถูกต้องเทียบกับคำตอบที่ไม่ถูกต้อง
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {totalAnswers} ข้อ
                </span>
              </div>

              {totalAnswers === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Flame className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 animate-bounce" />
                  <span>ยังไม่มีข้อมูลคำตอบสำหรับผู้เล่นกลุ่มนี้</span>
                  <span className="text-[11px] text-slate-500 mt-1">ลองเข้าเล่นควิซหรือโหมดอื่นๆ เพื่อเริ่มวิเคราะห์</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                  {/* SVG Donut Chart */}
                  <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                      {/* Background circle track */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        className="text-slate-100 dark:text-slate-800"
                        strokeWidth="20"
                        stroke="currentColor"
                        fill="transparent"
                      />

                      {/* Correct Answers Arc (Emerald) */}
                      {correctPercent > 0 && (
                        <circle
                          cx="80"
                          cy="80"
                          r={radius}
                          className="text-emerald-500 transition-all duration-700 ease-out"
                          strokeWidth="20"
                          strokeDasharray={`${strokeDasharrayCorrect} ${circumference}`}
                          strokeDashoffset={strokeDashoffsetCorrect}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                        />
                      )}

                      {/* Incorrect Answers Arc (Rose) */}
                      {wrongPercent > 0 && (
                        <circle
                          cx="80"
                          cy="80"
                          r={radius}
                          className="text-rose-500 transition-all duration-700 ease-out"
                          strokeWidth="20"
                          strokeDasharray={`${strokeDasharrayWrong} ${circumference}`}
                          strokeDashoffset={strokeDashoffsetWrong}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                        />
                      )}
                    </svg>

                    {/* Center Text inside Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                        {correctPercent}%
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        ความแม่นยำ
                      </span>
                    </div>
                  </div>

                  {/* Legend & Breakdown */}
                  <div className="space-y-3 w-full max-w-[220px]">
                    {/* Correct item */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          ตอบถูก (Correct)
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">{correctPercent}%</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 flex justify-between font-mono">
                        <span>{correctCount} ข้อ</span>
                        <span>สัดส่วนหลัก</span>
                      </div>
                    </div>

                    {/* Wrong item */}
                    <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-900 dark:text-rose-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          ตอบผิด (Mistakes)
                        </span>
                        <span className="font-black text-rose-600 dark:text-rose-400">{wrongPercent}%</span>
                      </div>
                      <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 flex justify-between font-mono">
                        <span>{wrongCount} ข้อ</span>
                        <span>จุดที่ต้องเสริม</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2.2 กราฟแท่งเปรียบเทียบพัฒนาการ (Comparison Bar Chart) - ช่วง 10 นาทีแรก vs หลังจากนั้น */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    กราฟเปรียบเทียบพัฒนาการ (10 นาทีแรก vs หลังจากนั้น)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    เปรียบเทียบความแม่นยำช่วง ≤ 600 วินาทีแรก กับหลังจาก 10 นาทีขึ้นไป
                  </p>
                </div>
                {summary.after10MinTotal > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    summary.accuracyTrendDiff > 0 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : summary.accuracyTrendDiff < 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {summary.accuracyTrendDiff > 0 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-amber-600" />}
                    {summary.accuracyTrendDiff > 0 ? `+${summary.accuracyTrendDiff}%` : `${summary.accuracyTrendDiff}%`}
                  </span>
                )}
              </div>

              {/* Bar Comparison Stage */}
              <div className="py-2">
                <div className="relative h-44 flex items-end justify-around px-4 border-b border-slate-200 dark:border-slate-700 pt-6">
                  {/* Horizontal Guideline 50% & 100% */}
                  <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-200 dark:border-slate-800 pointer-events-none flex justify-end">
                    <span className="text-[9px] text-slate-400 pr-1">100%</span>
                  </div>
                  <div className="absolute inset-x-0 top-[calc(50%+12px)] border-b border-dashed border-slate-200 dark:border-slate-800 pointer-events-none flex justify-end">
                    <span className="text-[9px] text-slate-400 pr-1">50%</span>
                  </div>

                  {/* Bar 1: ช่วง 10 นาทีแรก */}
                  <div className="flex flex-col items-center gap-1 w-28 sm:w-32 z-10">
                    <div className="text-xs font-black text-blue-700 dark:text-blue-300">
                      {summary.first10MinAccuracy}%
                    </div>
                    <div 
                      className="w-full rounded-t-xl bg-gradient-to-t from-blue-700 to-blue-500 shadow-md transition-all duration-700 hover:brightness-110 flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ height: `${Math.max(16, (summary.first10MinAccuracy / 100) * 128)}px` }}
                    >
                      {summary.first10MinCorrect}/{summary.first10MinTotal}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1 text-center">
                      ช่วง 10 นาทีแรก
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">
                      ≤ 600 วินาที ({summary.first10MinTotal} ข้อ)
                    </span>
                  </div>

                  {/* Bar 2: หลัง 10 นาทีขึ้นไป */}
                  <div className="flex flex-col items-center gap-1 w-28 sm:w-32 z-10">
                    <div className="text-xs font-black text-violet-700 dark:text-violet-300">
                      {summary.after10MinTotal > 0 ? `${summary.after10MinAccuracy}%` : 'รอข้อมูล'}
                    </div>
                    <div 
                      className={`w-full rounded-t-xl shadow-md transition-all duration-700 hover:brightness-110 flex items-center justify-center text-white text-[10px] font-bold ${
                        summary.after10MinTotal > 0 
                          ? 'bg-gradient-to-t from-violet-700 to-purple-500' 
                          : 'bg-slate-200 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                      }`}
                      style={{ 
                        height: summary.after10MinTotal > 0 
                          ? `${Math.max(16, (summary.after10MinAccuracy / 100) * 128)}px` 
                          : '48px' 
                      }}
                    >
                      {summary.after10MinTotal > 0 ? `${summary.after10MinCorrect}/${summary.after10MinTotal}` : '-'}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1 text-center">
                      หลัง 10 นาทีขึ้นไป
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">
                      &gt; 600 วินาที ({summary.after10MinTotal} ข้อ)
                    </span>
                  </div>
                </div>

                {/* Pedagogy Insight Note */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs">
                  {summary.after10MinTotal > 0 ? (
                    summary.accuracyTrendDiff > 0 ? (
                      <p className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span><strong>พัฒนาการดีขึ้นชัดเจน (+{summary.accuracyTrendDiff}%):</strong> ความแม่นยำสูงขึ้นหลังจากเล่นเกิน 10 นาที บ่งชี้ว่าผู้เรียนเริ่มจดจำสัญลักษณ์และตำแหน่งธาตุได้แม่นยำขึ้นจากการทำซ้ำ</span>
                      </p>
                    ) : summary.accuracyTrendDiff < 0 ? (
                      <p className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span><strong>ความแม่นยำลดลงเล็กน้อย ({summary.accuracyTrendDiff}%):</strong> อาจเกิดจากคำถามระดับยากขึ้น หรือผู้เรียนเริ่มมีความเหนื่อยล้าหลังเล่นต่อเนื่อง</span>
                      </p>
                    ) : (
                      <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                        <Minus className="w-4 h-4 text-slate-400 shrink-0" />
                        <span><strong>ผลงานคงที่สม่ำเสมอ:</strong> อัตราความแม่นยำคงที่ทั้งสองช่วงเวลา</span>
                      </p>
                    )
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>ยังไม่มีข้อมูลช่วงหลัง 10 นาที (ระบบจะเปรียบเทียบอัตโนมัติเมื่อผู้เล่นตอบคำถามสะสมเกิน 10 นาทีในเซสชัน)</span>
                    </p>
                  )}
                </div>

              </div>

            </div>

          </div>

          {/* 3. ธาตุที่ตอบผิดบ่อย Top 5 พร้อมคำแนะนำช่วยจำ (Top Mistaken Elements with Memory Hints) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  ธาตุที่ตอบผิดบ่อยที่สุด (Top 5 Mistaken Elements) & จุดควรทบทวน
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  วิเคราะห์ธาตุที่มีอัตราการตอบผิดสูงสุด เพื่อช่วยครูผู้สอนและผู้เรียนเจาะลึกจุดอ่อน
                </p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ผิดทั้งหมด {summary.totalWrong} ครั้ง
              </span>
            </div>

            {summary.topMistakenElements.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                {summary.totalAnswered > 0 ? '✨ ยอดเยี่ยมมาก! ยังไม่มีประวัติการตอบผิดในตัวเลือกปัจจุบัน' : 'ยังไม่มีข้อมูลคำตอบ'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                {summary.topMistakenElements.map((item, idx) => {
                  const el = ELEMENT_MAP.get(item.symbol.toUpperCase());
                  return (
                    <div 
                      key={item.symbol} 
                      className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                            อันดับ #{idx + 1}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400">
                            ผิด {item.count} ครั้ง
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 my-1">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {item.symbol}
                          </span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {el?.nameTH || 'ธาตุ'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {el ? `หมู่ ${el.group} คาบ ${el.period}` : 'ตารางธาตุ'}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        💡 {el?.hint || 'ทบทวนสัญลักษณ์และการจำแนกหมู่'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Filter by Game Mode and Recent Answer Logs Table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">กรองโหมดเกม:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'quiz', label: 'ควิซปรนัย' },
                    { id: 'property-match', label: 'จับคู่สมบัติธาตุ' },
                    { id: 'grid-placement', label: 'ลากวางตารางธาตุ' },
                    { id: 'battle', label: 'ประลอง Realtime' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedMode(tab.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg transition font-medium cursor-pointer ${
                        selectedMode === tab.id
                          ? 'bg-blue-600 text-white shadow-sm font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                แสดง {filteredLogs.length} รายการ
              </div>
            </div>

            {/* Table of Recent Firestore Play Logs */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-2.5">สถานะ</th>
                      <th className="p-2.5">ผู้เรียน (userId)</th>
                      <th className="p-2.5">โหมด</th>
                      <th className="p-2.5">คำถาม / ธาตุ</th>
                      <th className="p-2.5 text-center">เวลาคิด</th>
                      <th className="p-2.5 text-center">นาทีในเซสชัน</th>
                      <th className="p-2.5 text-right">เวลาที่ตอบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          {loading ? 'กำลังโหลดข้อมูลจาก Firestore...' : 'ยังไม่มีบันทึกข้อมูลการเล่นในตัวกรองนี้'}
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.slice().reverse().slice(0, 50).map((l, i) => {
                        const mins = (l.sessionDuration / 60).toFixed(1);
                        const timeStr = l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : '-';
                        const el = l.elementSymbol ? ELEMENT_MAP.get(l.elementSymbol.toUpperCase()) : null;
                        return (
                          <tr key={l.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-2.5 font-sans font-medium">
                              {l.isCorrect ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> ถูกต้อง
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <XCircle className="w-3 h-3" /> ไม่ถูกต้อง
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                              {(l.userId || 'anonymous').slice(0, 12)}
                            </td>
                            <td className="p-2.5 font-sans text-slate-700 dark:text-slate-300">
                              {l.gameMode || 'quiz'}
                            </td>
                            <td className="p-2.5 font-sans font-medium text-slate-900 dark:text-white">
                              {l.elementSymbol ? (
                                <span>
                                  <strong>{l.elementSymbol}</strong> {el ? `(${el.nameTH})` : ''}
                                </span>
                              ) : (
                                l.questionId
                              )}
                            </td>
                            <td className="p-2.5 text-center text-slate-600 dark:text-slate-400">
                              {l.answerTime}s
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold ${
                                l.sessionDuration <= 600
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              }`}>
                                {mins} นาที ({l.sessionDuration <= 600 ? '≤10m' : '>10m'})
                              </span>
                            </td>
                            <td className="p-2.5 text-right text-slate-500 dark:text-slate-400">
                              {timeStr}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>เชื่อมต่อ Firestore: <strong className="font-mono text-slate-700 dark:text-slate-300">my-is-game / play_logs</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold cursor-pointer transition"
          >
            ปิดแดชบอร์ด
          </button>
        </div>

      </div>
    </div>
  );
};
