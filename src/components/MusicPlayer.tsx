import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Upload, 
  Music, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FileAudio, 
  Youtube, 
  Radio, 
  Trash2,
  ListMusic
} from 'lucide-react';
import { loadCustomAudio, saveCustomAudio, deleteCustomAudio } from '../utils/audioStorage';
import { soundManager } from '../utils/audio';

interface Props {
  isGameActive?: boolean;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
  onRequestOpenModal?: () => void;
}

export type MusicSource = 'youtube' | 'local' | 'synth';

export const LYRICS_STARLOST = [
  { time: 0, text: '🎵 ดนตรีเปิดเพลง...' },
  { time: 1.5, text: 'เคยได้ยินนิทานเรื่องหนึ่ง' },
  { time: 5.5, text: 'พูดถึงดวงดาวที่อยู่แสนไกล' },
  { time: 9.5, text: 'ว่าเราจะได้พบใคร' },
  { time: 12.0, text: 'สักคนที่ใจยังคิดถึง' },
  { time: 15.5, text: 'นานแล้วที่ไม่ได้เจอ' },
  { time: 19.5, text: 'เธอยังจำฉันได้หรือเปล่า' },
  { time: 23.5, text: 'ยังคงเป็นคนเดิม ยังงดงามอยู่เหมือนเดิม' },
  { time: 28.0, text: 'เหมือนวันเก่าไหม...' },
  { time: 30.5, text: 'ยังเปิดฟังเสียงเพลง' },
  { time: 33.5, text: 'เพลงเก่ายังร้องเอง' },
  { time: 37.0, text: 'และบางครั้งที่ฉันก็ยังมีน้ำตา...' },
  { time: 45.0, text: '🌟 [ท่อนฮุก]' },
  { time: 46.5, text: 'เพราะฉันไม่รู้ว่าเธออยู่ไหน' },
  { time: 50.0, text: 'ไม่รู้ว่าตอนนี้เป็นอย่างไร' },
  { time: 53.5, text: 'สักวันหนึ่งจะได้พบกันไหม' },
  { time: 56.5, text: 'เธอจะยิ้มให้ฉันอย่างเมื่อวาน...' },
  { time: 60.5, text: 'ก่อนที่ดาวเต็มฟ้าจะร่ำลาจากกันแสนไกล' },
  { time: 67.0, text: 'เรื่องที่ตรงนั้นมีอยู่จริงใช่ไหม' },
  { time: 70.5, text: 'ให้เธอหันมามองกันตรงนี้มันยังไกลตา...' },
  { time: 128.0, text: 'ข้อความที่เธอเคยส่งมา บางครั้งฉันไม่ได้ตอบไป' },
  { time: 135.0, text: 'เธออยู่รอใช่ไหม ขอโทษที่ทำให้ต้องรอ' },
  { time: 142.0, text: 'สิ่งของที่เธอเคยพร่ำบ่น ในครั้งที่ฉันทำหล่นหาย' },
  { time: 149.0, text: 'แต่ต่างคนตรงสุดท้าย วันนี้ฉันไม่มีทางค้นเจอ' },
  { time: 156.0, text: 'ยังเปิดฟังเสียงเพลง เพลงเก่ายังร้องเอง' },
  { time: 163.0, text: 'และทุกครั้งที่ฉันก็ยังมีน้ำตา...' },
  { time: 209.0, text: '🌟 [ท่อนฮุก 2]' },
  { time: 210.5, text: 'เพราะฉันไม่รู้ว่าเธออยู่ไหน ไม่รู้ว่าตอนนี้เป็นอย่างไร' },
  { time: 217.5, text: 'สักวันหนึ่งจะได้พบกันไหม เธอจะยิ้มให้ฉันอย่างเมื่อวาน' },
  { time: 225.0, text: 'ก่อนที่ดาวเต็มฟ้าจะร่ำลาจากกันแสนไกล' },
  { time: 231.5, text: 'เรื่องที่ตรงนั้นมีอยู่จริงใช่ไหม' },
  { time: 235.0, text: 'ให้เธอหันมามองกันตรงนี้มันยังไกลตา...' },
  { time: 243.0, text: '💫 ฉันไม่เคยจะเสียใจ ที่ได้บอกรักไป' },
  { time: 250.0, text: 'แต่บางครั้งฉันยังแอบเสียดาย ที่มันอาจดูน้อยไป' },
  { time: 256.5, text: 'หากในวันนั้นไม่มีเธอข้างกาย ฉันคงยืนไม่ไหว' },
  { time: 263.0, text: 'มาในวันนี้ไม่มีเธอข้างกาย เธอคงอยากเห็นฉันยืนให้ไหว...' },
  { time: 337.0, text: '🌌 [เสียงบรรยายบทสรุป]' },
  { time: 338.0, text: '"และเวลานั้นเอง... นักบินอวกาศหญิงก็รู้ว่า"' },
  { time: 344.0, text: '"ต่อให้ดาวบางดวงจะดับไป แต่แสงของมัน"' },
  { time: 350.0, text: '"ก็ยังเดินทางมาหาเธอเสมอ..."' },
  { time: 358.0, text: 'เพราะฉันไม่รู้ว่าเธออยู่ไหน...' }
];

export const MusicPlayer: React.FC<Props> = ({
  isGameActive = false,
  isOpenModal = false,
  onCloseModal,
  onRequestOpenModal
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [source, setSource] = useState<MusicSource>('youtube');
  const [volume, setVolume] = useState<number>(0.65);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(246); // default ~4 mins

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load custom audio from IndexedDB if previously uploaded
  useEffect(() => {
    loadCustomAudio().then(res => {
      if (res) {
        const url = URL.createObjectURL(res.blob);
        setCustomAudioUrl(url);
        setCustomAudioName(res.name);
        // Prefer local audio if uploaded by user
        setSource('local');
      }
    });

    const savedSource = localStorage.getItem('starlost_music_source') as MusicSource | null;
    if (savedSource && ['youtube', 'local', 'synth'].includes(savedSource)) {
      setSource(savedSource);
    }
  }, []);

  // Save source preference
  const handleSelectSource = (s: MusicSource) => {
    setSource(s);
    try {
      localStorage.setItem('starlost_music_source', s);
    } catch {}

    if (isPlaying) {
      // Pause others and start selected
      if (s === 'synth') {
        stopNativeAudio();
        soundManager.startIdleSong();
      } else if (s === 'youtube') {
        soundManager.stopIdleSong();
        if (audioRef.current) audioRef.current.pause();
        sendYtCommand('playVideo');
      } else if (s === 'local') {
        soundManager.stopIdleSong();
        sendYtCommand('pauseVideo');
        if (audioRef.current && customAudioUrl) {
          audioRef.current.play().catch(() => {});
        }
      }
    }
  };

  // Helper to send postMessage to YouTube IFrame
  const sendYtCommand = (command: string, args: any[] = []) => {
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args }),
        '*'
      );
    }
  };

  const stopNativeAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    sendYtCommand('pauseVideo');
  };

  // Auto-pause music when entering game (quiz/battle) and auto-resume in home/menu
  useEffect(() => {
    if (isGameActive) {
      if (isPlaying) {
        stopNativeAudio();
        soundManager.stopIdleSong();
      }
    } else {
      if (isPlaying) {
        resumePlay();
      }
    }
  }, [isGameActive]);

  const resumePlay = () => {
    if (source === 'youtube') {
      sendYtCommand('setVolume', [isMuted ? 0 : Math.round(volume * 100)]);
      sendYtCommand('playVideo');
    } else if (source === 'local') {
      if (audioRef.current && customAudioUrl) {
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current.play().catch(() => {});
      }
    } else {
      soundManager.startIdleSong();
    }
  };

  const togglePlay = () => {
    soundManager.playClick();
    if (isPlaying) {
      setIsPlaying(false);
      stopNativeAudio();
      soundManager.stopIdleSong();
    } else {
      setIsPlaying(true);
      resumePlay();
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVol;
    }
    sendYtCommand('setVolume', [isMuted ? 0 : Math.round(newVol * 100)]);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) {
      audioRef.current.volume = next ? 0 : volume;
    }
    sendYtCommand('setVolume', [next ? 0 : Math.round(volume * 100)]);
  };

  // Handle user uploading custom MP3 / audio file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await saveCustomAudio(file, file.name);
      if (customAudioUrl) {
        URL.revokeObjectURL(customAudioUrl);
      }
      const url = URL.createObjectURL(file);
      setCustomAudioUrl(url);
      setCustomAudioName(file.name);
      setSource('local');
      setIsPlaying(true);

      // Play local audio immediately
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.volume = isMuted ? 0 : volume;
          audioRef.current.play().catch(() => {});
        }
      }, 150);
    } catch (err) {
      console.error('Error saving audio file', err);
    }
  };

  const handleDeleteCustomAudio = async () => {
    await deleteCustomAudio();
    if (customAudioUrl) {
      URL.revokeObjectURL(customAudioUrl);
    }
    setCustomAudioUrl(null);
    setCustomAudioName(null);
    setSource('youtube');
  };

  // Current active lyric line
  const activeLyric = LYRICS_STARLOST.reduce((prev, curr) => {
    return curr.time <= currentTime ? curr : prev;
  }, LYRICS_STARLOST[0]);

  return (
    <>
      {/* Hidden HTML5 Audio Element for Local MP3 files */}
      {customAudioUrl && (
        <audio
          ref={audioRef}
          src={customAudioUrl}
          loop
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
              setDuration(audioRef.current.duration || 246);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Hidden YouTube IFrame with API controls */}
      <div className="hidden">
        <iframe
          ref={ytIframeRef}
          id="starlost-yt-iframe"
          width="100"
          height="100"
          src="https://www.youtube-nocookie.com/embed/AyfZesBO4Vk?enablejsapi=1&origin=*&playsinline=1&loop=1&playlist=AyfZesBO4Vk"
          title="PURPEECH - ไม่มีวันไหนที่ไม่คิดถึง"
          allow="autoplay; encrypted-media"
        />
      </div>

      {/* Floating Bottom Music Player Bar */}
      <div className="fixed bottom-3 left-3 right-3 max-w-xl mx-auto z-40">
        <div className="bg-slate-900/95 dark:bg-black/95 text-white border-2 border-slate-800 dark:border-zinc-700 backdrop-blur-md rounded-2xl p-2.5 shadow-[4px_4px_0px_#0f172a] flex items-center justify-between gap-2.5 transition-all">
          {/* Vinyl / Cover Art */}
          <div 
            onClick={onRequestOpenModal}
            className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 group"
          >
            <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 border border-white/20 shadow-md ${isPlaying ? 'animate-pulse' : ''}`}>
              <Music className={`h-5 w-5 text-white ${isPlaying ? 'animate-bounce' : ''}`} />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs text-pink-300 truncate">
                  {source === 'local' && customAudioName 
                    ? customAudioName 
                    : 'ไม่มีวันไหนที่ไม่คิดถึง (starlost.)'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700 shrink-0">
                  {source === 'youtube' ? 'MV Official' : source === 'local' ? 'ไฟล์ของคุณ' : 'Synth'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 group-hover:text-slate-200 transition">
                {isPlaying ? `🎶 ${activeLyric.text}` : 'PURPEECH · แตะเพื่อเปิดแผงควบคุม & เนื้อเพลง'}
              </p>
            </div>
          </div>

          {/* Quick Player Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Lyrics toggle */}
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              title="ดูเนื้อเพลง"
              className={`h-8 px-2 rounded-xl border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition ${showLyrics ? 'bg-pink-600 text-white border-pink-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <ListMusic className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">เนื้อเพลง</span>
            </button>

            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
              className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 transition"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-slate-300" />}
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              title={isPlaying ? 'หยุดเล่น' : 'เปิดเพลง'}
              className={`h-9 px-3.5 rounded-xl border-2 flex items-center justify-center gap-1.5 font-black text-xs shadow-sm transition active:scale-95 cursor-pointer ${
                isPlaying 
                  ? 'bg-pink-600 hover:bg-pink-700 border-pink-400 text-white' 
                  : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-300 text-slate-950 font-black'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 fill-white" />
                  <span>หยุด</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-slate-950" />
                  <span>เปิดเพลง</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mini Lyrics Floating Overlay */}
        {showLyrics && (
          <div className="mt-2 bg-slate-900/95 dark:bg-black/95 border-2 border-pink-500/50 rounded-2xl p-3 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-black text-pink-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                เนื้อเพลง: ไม่มีวันไหนที่ไม่คิดถึง (PURPEECH)
              </span>
              <button
                onClick={() => setShowLyrics(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ ปิด
              </button>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-1.5 pt-2 text-xs text-slate-300 scrollbar-thin">
              {LYRICS_STARLOST.map((line, idx) => {
                const isActive = activeLyric.time === line.time;
                return (
                  <div
                    key={idx}
                    className={`p-1 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-pink-950/70 text-pink-300 font-bold border-l-2 border-pink-400 pl-2' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FULL MUSIC MODAL / SETTINGS DIALOG */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border-2 border-slate-900 dark:border-zinc-800 rounded-3xl p-5 shadow-[6px_6px_0px_#1e293b] dark:shadow-[6px_6px_0px_#27272a] text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500 text-white font-bold shadow-sm">
                  🎵
                </div>
                <div>
                  <h3 className="font-black text-base">เครื่องเล่นเพลงบรรเลง & เพลงคลอ</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    เพลงไม่มีวันไหนที่ไม่คิดถึง (starlost.)
                  </p>
                </div>
              </div>
              <button
                onClick={onCloseModal}
                className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 border border-slate-300 dark:border-zinc-700 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Song Cover Card with Starlost Cosmic Art */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 border-2 border-slate-900 text-white relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-amber-400 flex items-center justify-center text-3xl shadow-lg border-2 border-white/30 shrink-0 ${isPlaying ? 'animate-spin-slow' : ''}`}>
                  👩‍🚀
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 block">
                    PURPEECH ft. Starlost
                  </span>
                  <h4 className="font-black text-base truncate text-white">
                    ไม่มีวันไหนที่ไม่คิดถึง
                  </h4>
                  <p className="text-[11px] text-purple-200 italic mt-0.5 line-clamp-2">
                    "ต่อให้ดาวบางดวงจะดับไป แต่แสงของมัน ก็ยังเดินทางมาหาเธอเสมอ..."
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  <span className="font-bold text-slate-300">
                    {isPlaying ? 'กำลังเปิดเพลง' : 'หยุดชั่วคราว'}
                  </span>
                </div>
                <span className="text-[11px] text-pink-300 font-mono">
                  {source === 'youtube' ? 'YouTube Official' : source === 'local' ? 'ไฟล์ในเครื่อง' : 'Web Audio'}
                </span>
              </div>
            </div>

            {/* Source Selector Options */}
            <div className="mt-4 space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                เลือกแหล่งที่มาของเพลง (Music Source)
              </label>

              {/* Option 1: Official YouTube MV (Real Voice & Song) */}
              <button
                onClick={() => handleSelectSource('youtube')}
                className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between transition cursor-pointer text-left ${
                  source === 'youtube'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-600 text-rose-950 dark:text-rose-100 shadow-sm'
                    : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Youtube className="h-5 w-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-black text-xs block">
                      เพลงต้นฉบับ MV Official (PURPEECH)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      เสียงร้องจริงเต็มเพลง + เสียงบรรยายนักบินอวกาศ
                    </span>
                  </div>
                </div>
                {source === 'youtube' && <span className="text-xs font-black text-rose-600">✓ เลือกอยู่</span>}
              </button>

              {/* Option 2: Upload Custom MP3 / Audio File */}
              <div
                className={`w-full p-3 rounded-2xl border-2 transition ${
                  source === 'local'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-600 text-purple-950 dark:text-purple-100 shadow-sm'
                    : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div 
                    onClick={() => handleSelectSource('local')}
                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                  >
                    <FileAudio className="h-5 w-5 text-purple-600 shrink-0" />
                    <div>
                      <span className="font-black text-xs block">
                        ไฟล์เสียงที่คุณมีในเครื่อง (MP3 / Audio File)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {customAudioName ? `📂 ${customAudioName}` : 'อัปโหลดไฟล์เพลงของคุณเพื่อเก็บไว้ในเบราว์เซอร์'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{customAudioName ? 'เปลี่ยน' : 'เลือกไฟล์'}</span>
                    </button>
                    {customAudioName && (
                      <button
                        onClick={handleDeleteCustomAudio}
                        title="ลบไฟล์เสียงที่บันทึกไว้"
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Option 3: Synthesized Acoustic Web Audio Chime */}
              <button
                onClick={() => handleSelectSource('synth')}
                className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between transition cursor-pointer text-left ${
                  source === 'synth'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-100 shadow-sm'
                    : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-black text-xs block">
                      เสียงเปียโนอะคูสติกสังเคราะห์ (Offline Synth)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ทำนองเปียโนกล่องดนตรีอะคูสติกเบาๆ เล่นได้ 100% แม้ไม่มีเน็ต
                    </span>
                  </div>
                </div>
                {source === 'synth' && <span className="text-xs font-black text-amber-600">✓ เลือกอยู่</span>}
              </button>
            </div>

            {/* Volume Control */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700 dark:text-slate-300">ระดับเสียงเพลงคลอ</span>
                <span className="text-slate-500 font-mono">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <VolumeX className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <Volume2 className="h-4 w-4 text-pink-500 shrink-0" />
              </div>
            </div>

            {/* Main Action Toggle Play Button */}
            <div className="mt-5">
              <button
                onClick={togglePlay}
                className={`w-full py-3.5 rounded-2xl border-2 border-slate-900 text-sm font-black shadow-[3px_3px_0px_#1e293b] flex items-center justify-center gap-2 transition active:translate-y-0.5 cursor-pointer ${
                  isPlaying
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 fill-white" />
                    <span>หยุดเล่นเพลง</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-slate-950" />
                    <span>เริ่มเปิดเพลง "ไม่มีวันไหนที่ไม่คิดถึง"</span>
                  </>
                )}
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-slate-500 dark:text-slate-400">
              💡 ระบบจะหยุดเพลงชั่วคราวอัตโนมัติเมื่อเข้าสู่โหมดทำข้อสอบหรือดวลคำถาม
            </p>
          </div>
        </div>
      )}
    </>
  );
};
