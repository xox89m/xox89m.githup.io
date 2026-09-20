import React from 'react';
import { useAudio } from '../hooks/useAudio';
import { 
  Volume2, 
  VolumeX, 
  Music, 
  Sparkles, 
  X, 
  Check, 
  Flame, 
  Award, 
  Sun, 
  Moon, 
  Zap, 
  Radio 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    isMuted,
    isBgmEnabled,
    sfxVolume,
    bgmVolume,
    theme,
    toggleMute,
    toggleBgm,
    setSfxVolume,
    setBgmVolume,
    setTheme,
    playThemeSwitch,
    playCorrect,
    playCombo,
    playLifeline,
    playVictory,
    playWrong,
    playBattleStart
  } = useAudio();

  if (!isOpen) return null;

  const handleSelectTheme = (newTheme: 'light' | 'dark') => {
    if (theme !== newTheme) {
      setTheme(newTheme);
      playThemeSwitch(newTheme);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-black shadow-2xl border-2 border-slate-900 dark:border-zinc-800 text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className={`flex items-center justify-between border-b-2 border-slate-900 dark:border-zinc-800 px-5 py-4 ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-indigo-950 via-purple-950 to-black text-white' 
            : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 dark:bg-zinc-900 text-2xl shadow-sm border-2 border-slate-900 dark:border-zinc-700">
              {theme === 'dark' ? '🌙' : '🔊'}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">ตั้งค่าระบบเสียง & โหมด</h2>
              <p className={`text-xs font-bold ${theme === 'dark' ? 'text-purple-200' : 'text-amber-950'}`}>
                สลับโหมดมืด/สว่าง พร้อมระบบเสียงเฉพาะตัว
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-current hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* THEME & DUAL SOUND PROFILE SELECTOR (REQUESTED FEATURE) */}
          <div className="rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  โหมดการแสดงผล & โทนเสียง (Dual Audio Mode)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-cyan-950 text-blue-700 dark:text-cyan-300 border border-blue-300 dark:border-cyan-800">
                {theme === 'dark' ? '🌙 โหมดมืด' : '☀️ โหมดสว่าง'}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3">
              เมื่อเปลี่ยนโหมด ทั้งธีมภาพและเสียงประกอบ (SFX + เพลง BGM) จะปรับเปลี่ยนสไตล์โดยสิ้นเชิง!
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Light Mode */}
              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                className={`p-3 rounded-2xl border-2 text-left transition relative cursor-pointer active:scale-98 ${
                  theme === 'light'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-[2px_2px_0px_#f59e0b]'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
                    <Sun className="h-4 w-4 text-amber-500 fill-amber-400" />
                    <span>โหมดสว่าง</span>
                  </div>
                  {theme === 'light' && (
                    <span className="h-4 w-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Daylight Lab
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  เสียงระฆังแก้วใส คอร์ด C-Major แจ๊สแล็บยามเช้า
                </div>
              </button>

              {/* Option 2: Dark Mode */}
              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                className={`p-3 rounded-2xl border-2 text-left transition relative cursor-pointer active:scale-98 ${
                  theme === 'dark'
                    ? 'border-cyan-400 bg-indigo-950/60 shadow-[2px_2px_0px_#06b6d4]'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
                    <Moon className="h-4 w-4 text-cyan-400 fill-cyan-400" />
                    <span>โหมดมืด</span>
                  </div>
                  {theme === 'dark' && (
                    <span className="h-4 w-4 rounded-full bg-cyan-400 text-slate-900 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-bold text-slate-100">
                  Cyber Neon Lab
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                  เสียงไซไฟ ซินธ์เวฟ เลเซอร์นีออน ดนตรีไซเบอร์พังก์
                </div>
              </button>
            </div>
          </div>

          {/* Master Sound Toggle */}
          <div className="flex items-center justify-between rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 dark:border-zinc-700 ${
                isMuted 
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' 
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
              }`}>
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {isMuted ? 'ปิดเสียงทั้งหมด (Muted)' : 'เปิดเสียงทั้งหมด (Sound On)'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  ควบคุมเสียงเอฟเฟกต์และดนตรีทุกประเภท
                </div>
              </div>
            </div>

            <button
              onClick={toggleMute}
              className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 border-slate-900 dark:border-zinc-700 transition active:scale-95 cursor-pointer ${
                isMuted 
                  ? 'bg-rose-500 text-white shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]' 
                  : 'bg-emerald-500 text-white shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]'
              }`}
            >
              {isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            </button>
          </div>

          {/* Sound Effects (SFX) Volume */}
          <div className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 dark:text-cyan-400" />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  ความดังเอฟเฟกต์เสียง ({theme === 'dark' ? 'Cyber SFX' : 'Daylight SFX'})
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                {Math.round(sfxVolume * 100)}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              disabled={isMuted}
              onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
              className="w-full accent-blue-600 dark:accent-cyan-400 cursor-pointer disabled:opacity-50"
            />

            {/* Test SFX Buttons (Will play current theme sound!) */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                ทดลองฟังเสียงสไตล์ <span className="text-blue-600 dark:text-cyan-400 underline">{theme === 'dark' ? 'โหมดมืด (Cyber)' : 'โหมดสว่าง (Daylight)'}</span>:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isMuted}
                  onClick={() => playCorrect()}
                  className="py-2 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>ตอบถูก ✓</span>
                </button>

                <button
                  type="button"
                  disabled={isMuted}
                  onClick={() => playCombo(3)}
                  className="py-2 px-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Flame className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  <span>คอมโบ 🔥</span>
                </button>

                <button
                  type="button"
                  disabled={isMuted}
                  onClick={() => playWrong()}
                  className="py-2 px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span className="text-xs">❌</span>
                  <span>ตอบผิด</span>
                </button>

                <button
                  type="button"
                  disabled={isMuted}
                  onClick={() => playBattleStart()}
                  className="py-2 px-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>เริ่มดวล ⚡</span>
                </button>

                <button
                  type="button"
                  disabled={isMuted}
                  onClick={() => playLifeline()}
                  className="py-2 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>ตัวช่วย 💡</span>
                </button>

                <button
                  type="button"
                  disabled={isMuted}
                  onClick={() => playVictory()}
                  className="py-2 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>ฉลองชัย 🏆</span>
                </button>
              </div>
            </div>
          </div>

          {/* Background Music (BGM) */}
          <div className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    ดนตรีห้องแล็บ (BGM: {theme === 'dark' ? 'Cyber Synthwave' : 'Daylight Lo-fi'})
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {theme === 'dark' 
                      ? 'ท่วงทำนองซินธ์เวฟ คอร์ด Dm9 อวกาศลึกลับ' 
                      : 'เพลงสังเคราะห์สไตล์ Lo-fi คอร์ด Cmaj7 ผ่อนคลาย'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isMuted}
                onClick={toggleBgm}
                className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 border-slate-900 dark:border-zinc-700 transition active:scale-95 cursor-pointer disabled:opacity-50 ${
                  isBgmEnabled && !isMuted
                    ? 'bg-purple-600 text-white shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {isBgmEnabled && !isMuted ? 'กำลังเล่น 🎵' : 'เปิดดนตรี'}
              </button>
            </div>

            {isBgmEnabled && !isMuted && (
              <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  <span>ความดังดนตรีประกอบ</span>
                  <span className="font-mono">{Math.round(bgmVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 dark:accent-purple-400 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black px-5 py-3 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 font-black text-white text-xs transition cursor-pointer"
          >
            บันทึก & ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
