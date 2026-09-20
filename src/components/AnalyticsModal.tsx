import React, { useState, useEffect } from 'react';
import { 
  fetchAllPlayLogs, 
  computeAnalyticsSummary, 
  PlayLogEvent, 
  AnalyticsSummary,
  getElapsedSessionSeconds,
  getCurrentSessionId
} from '../services/analytics';
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
  HelpCircle
} from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, currentUserId }) => {
  const [logs, setLogs] = useState<PlayLogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [sessionSeconds, setSessionSeconds] = useState(getElapsedSessionSeconds());

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPlayLogs(1000);
      setLogs(data);
    } catch (e) {
      console.warn('Failed to load logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      setSessionSeconds(getElapsedSessionSeconds());
      const timer = setInterval(() => {
        setSessionSeconds(getElapsedSessionSeconds());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = selectedMode === 'all' 
    ? logs 
    : logs.filter(l => (l.gameMode || 'quiz') === selectedMode);

  const summary: AnalyticsSummary = computeAnalyticsSummary(filteredLogs);

  const formatMinSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins} นาที ${s} วิ`;
  };

  const currentSessionMinutes = (sessionSeconds / 60).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        style={{ fontFamily: "'Mali', 'Sarabun', sans-serif" }}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                ระบบวิเคราะห์พฤติกรรมผู้เล่น (Learning Analytics)
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Firestore Event Logs</span>
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                เปรียบเทียบความแม่นยำช่วง 10 นาทีแรก vs หลังจากนั้น พร้อมส่งออกเป็น CSV สำหรับ Excel & Looker Studio
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-100">
          
          {/* Active Session Info Banner */}
          <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>เวลาที่อยู่ในแอปปัจจุบัน: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{formatMinSec(sessionSeconds)} ({currentSessionMinutes} นาที)</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Session: <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-xs">{getCurrentSessionId().slice(0, 16)}...</code></span>
            </div>
            <button 
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              {loading ? 'กำลังดึงข้อมูล...' : 'รีเฟรชข้อมูล'}
            </button>
          </div>

          {/* Core Analytics Cards: 10-Min Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* First 10 Minutes Card */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-blue-800 dark:text-blue-300 mb-2">
                <span className="font-semibold uppercase tracking-wider">ช่วง 10 นาทีแรก</span>
                <span className="bg-blue-200 dark:bg-blue-900 px-2 py-0.5 rounded-full text-[10px]">≤ 10 Min</span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {summary.first10MinAccuracy}%
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  ตอบถูก {summary.first10MinCorrect} จาก {summary.first10MinTotal} ข้อ
                </div>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900/50 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${summary.first10MinAccuracy}%` }} 
                />
              </div>
            </div>

            {/* After 10 Minutes Card */}
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-purple-800 dark:text-purple-300 mb-2">
                <span className="font-semibold uppercase tracking-wider">หลัง 10 นาทีขึ้นไป</span>
                <span className="bg-purple-200 dark:bg-purple-900 px-2 py-0.5 rounded-full text-[10px]">&gt; 10 Min</span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                  {summary.after10MinTotal > 0 ? `${summary.after10MinAccuracy}%` : 'รอข้อมูล'}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {summary.after10MinTotal > 0 
                    ? `ตอบถูก ${summary.after10MinCorrect} จาก ${summary.after10MinTotal} ข้อ`
                    : 'เมื่อผู้เล่นเล่นต่อเนื่องเกิน 10 นาที'}
                </div>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-900/50 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${summary.after10MinAccuracy}%` }} 
                />
              </div>
            </div>

            {/* Learning Curve Trend Card */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 mb-2">
                <span className="font-semibold uppercase tracking-wider">แนวโน้มพัฒนาการ (Trend)</span>
                {summary.accuracyTrendDiff > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : summary.accuracyTrendDiff < 0 ? (
                  <TrendingDown className="w-4 h-4 text-amber-500" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div>
                <div className="text-3xl font-extrabold flex items-center gap-1">
                  {summary.after10MinTotal > 0 ? (
                    summary.accuracyTrendDiff > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">+{summary.accuracyTrendDiff}%</span>
                    ) : summary.accuracyTrendDiff < 0 ? (
                      <span className="text-amber-500">{summary.accuracyTrendDiff}%</span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400">0% (คงที่)</span>
                    )
                  ) : (
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">พร้อมประเมินเมื่อเล่นครบ</span>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {summary.after10MinTotal > 0
                    ? (summary.accuracyTrendDiff > 0 
                        ? '✨ มีแนวโน้มตอบถูกสูงขึ้น หลังคุ้นเคยกับคำถาม!' 
                        : 'ความแม่นยำช่วงต้นและช่วงหลังใกล้เคียงกัน')
                    : 'ระบบจะคำนวณส่วนต่างเมื่อมีข้อมูลทั้ง 2 ช่วงเวลา'}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 flex justify-between">
                <span>เวลาคิดเฉลี่ย: <strong>{summary.avgAnswerTime} วินาที</strong></span>
                <span>รวมทั้งหมด: <strong>{summary.totalAnswered} ข้อ</strong></span>
              </div>
            </div>
          </div>

          {/* Filter and Mode Breakdown */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">กรองตามโหมดเกม:</span>
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
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium ${
                      selectedMode === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              พบ {filteredLogs.length} รายการ
            </div>
          </div>

          {/* Recent Logs Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-2.5">สถานะ</th>
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
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        {loading ? 'กำลังโหลดข้อมูลจาก Firestore...' : 'ยังไม่มีบันทึกข้อมูลการเล่น ลองเข้าเล่นสัก 1-2 ข้อเพื่อดู Log ที่นี่!'}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.slice().reverse().slice(0, 50).map((l, i) => {
                      const mins = (l.sessionDuration / 60).toFixed(1);
                      const timeStr = l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : '-';
                      return (
                        <tr key={l.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-2.5 font-sans font-medium">
                            {l.isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> ถูกต้อง
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full text-[10px]">
                                <XCircle className="w-3 h-3" /> ไม่ถูกต้อง
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-sans text-slate-700 dark:text-slate-300">
                            {l.gameMode || 'quiz'}
                          </td>
                          <td className="p-2.5 font-sans font-medium text-slate-900 dark:text-white">
                            {l.elementSymbol ? `${l.elementSymbol} (${l.questionId})` : l.questionId}
                          </td>
                          <td className="p-2.5 text-center text-slate-600 dark:text-slate-400">
                            {l.answerTime}s
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans ${
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

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Event Tracking ทำงานอยู่เบื้องหลังทุกโหมดเกมโดยอัตโนมัติ</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
