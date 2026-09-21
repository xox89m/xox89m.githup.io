import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Upload, 
  Music, 
  Sparkles, 
  X, 
  Plus, 
  Trash2, 
  ListMusic, 
  Youtube, 
  Radio, 
  ExternalLink,
  Disc3,
  Sliders,
  CheckCircle2,
  FileAudio,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Eye,
  GripVertical,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMusic } from '../hooks/useMusic';
import { musicStore, PlaylistItem, LYRICS_STARLOST, LYRICS_PERFECT_GOODBYE, LYRICS_PHOTOGRAPH_PURPEECH } from '../services/musicStore';
import { loadCustomAudio, saveCustomAudio, deleteCustomAudio } from '../utils/audioStorage';
import { soundManager } from '../utils/audio';

interface Props {
  isGameActive?: boolean;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
  onRequestOpenModal?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const MusicPlayer: React.FC<Props> = ({
  isGameActive = false,
  isOpenModal = false,
  onCloseModal,
  onRequestOpenModal
}) => {
  const {
    playlist,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    seekTarget,
    togglePlay,
    setIsPlaying,
    nextTrack,
    prevTrack,
    selectTrack,
    seekTo,
    clearSeekTarget,
    setVolume,
    toggleMute,
    addCustomTrack,
    removeCustomTrack,
    setProgress
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'playlist' | 'add' | 'lyrics'>('playlist');
  const [showLyricsDrawer, setShowLyricsDrawer] = useState<boolean>(false);

  // Toggle hiding the floating bottom bar during gameplay
  const [isBarHidden, setIsBarHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chem_music_bar_hidden') === 'true';
    } catch {
      return false;
    }
  });

  const toggleBarHidden = () => {
    setIsBarHidden(prev => {
      const next = !prev;
      try {
        localStorage.setItem('chem_music_bar_hidden', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  // Form for adding custom track
  const [inputUrl, setInputUrl] = useState<string>('');
  const [inputTitle, setInputTitle] = useState<string>('');
  const [inputArtist, setInputArtist] = useState<string>('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [audioPlaybackError, setAudioPlaybackError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Time tracking refs to guarantee 100% accurate time display without freeze or drift
  const localElapsedRef = useRef<number>(currentTime);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const isDraggingRef = useRef<boolean>(false);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);

  // Load custom local audio from IndexedDB if stored
  useEffect(() => {
    // Scan all tracks in playlist that need blob reconstruction from IndexedDB
    playlist.forEach(track => {
      if (track.type === 'audio' && (!track.src || track.src.startsWith('blob:'))) {
        loadCustomAudio(track.id).then(res => {
          if (res) {
            const url = URL.createObjectURL(res.blob);
            musicStore.updateTrackSrc(track.id, url);
          }
        });
      }
    });

    // Also check default offline audio slot
    loadCustomAudio().then(res => {
      if (res) {
        const url = URL.createObjectURL(res.blob);
        const exists = playlist.some(t => t.id === 'stored_offline_audio');
        if (!exists) {
          addCustomTrack({
            id: 'stored_offline_audio',
            title: res.name || 'ไฟล์เพลงของฉัน (ออฟไลน์)',
            artist: 'ผู้เล่นอัปโหลด',
            type: 'audio',
            src: url,
            duration: 240
          });
        } else {
          musicStore.updateTrackSrc('stored_offline_audio', url);
        }
      }
    });
  }, []);

  // Send listening handshake to YouTube IFrame once loaded
  const sendListeningHandshake = () => {
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      try {
        ytIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: 1 }),
          '*'
        );
      } catch {}
    }
  };

  // PostMessage command to YouTube IFrame and direct YT API
  const sendYtCommand = (command: string, args: any[] = []) => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current[command] === 'function') {
      try {
        ytPlayerRef.current[command](...args);
      } catch {}
    }
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      try {
        ytIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: command, args }),
          '*'
        );
      } catch {}
    }
  };

  // YouTube player state listener & accurate time sync
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            localElapsedRef.current = data.info.currentTime;
            lastSyncTimeRef.current = Date.now();
            const dur = typeof data.info.duration === 'number' && data.info.duration > 0
              ? data.info.duration
              : (currentTrack.duration || 242);
            setProgress(data.info.currentTime, dur);
          }
          if (typeof data.info.playerState === 'number') {
            // 0 = ENDED, 1 = PLAYING, 2 = PAUSED
            if (data.info.playerState === 0) {
              nextTrack();
            } else if (data.info.playerState === 1 && !isPlaying) {
              setIsPlaying(true);
            }
          }
        } else if (data.event === 'onStateChange') {
          if (data.info === 0) {
            nextTrack();
          } else if (data.info === 1 && !isPlaying) {
            setIsPlaying(true);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [isPlaying, nextTrack, setProgress, setIsPlaying, currentTrack.duration]);

  // High-frequency accurate time polling (updates every 250ms)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      lastSyncTimeRef.current = Date.now();
      localElapsedRef.current = currentTime;

      interval = setInterval(() => {
        if (currentTrack.type === 'youtube') {
          let updatedFromInstance = false;
          if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
            try {
              const cur = ytPlayerRef.current.getCurrentTime();
              const dur = ytPlayerRef.current.getDuration();
              if (typeof cur === 'number' && !isNaN(cur) && cur >= 0) {
                localElapsedRef.current = cur;
                lastSyncTimeRef.current = Date.now();
                setProgress(cur, dur > 0 ? dur : (currentTrack.duration || 242));
                updatedFromInstance = true;
              }
            } catch {}
          }

          if (!updatedFromInstance) {
            sendListeningHandshake();
            // High-precision smooth ticker based on real wall clock
            const now = Date.now();
            const deltaSec = (now - lastSyncTimeRef.current) / 1000;
            if (deltaSec >= 0.25) {
              localElapsedRef.current += deltaSec;
              lastSyncTimeRef.current = now;
              const dur = currentTrack.duration || 242;
              if (localElapsedRef.current >= dur) {
                nextTrack();
              } else {
                setProgress(localElapsedRef.current, dur);
              }
            }
          }
        } else if (currentTrack.type === 'audio' && audioRef.current) {
          const cur = audioRef.current.currentTime;
          const dur = audioRef.current.duration;
          if (typeof cur === 'number' && !isNaN(cur)) {
            setProgress(cur, dur > 0 ? dur : (currentTrack.duration || 240));
          }
        } else if (currentTrack.type === 'synth') {
          const now = Date.now();
          const deltaSec = (now - lastSyncTimeRef.current) / 1000;
          localElapsedRef.current += deltaSec;
          lastSyncTimeRef.current = now;
          const dur = currentTrack.duration || 2400;
          setProgress(localElapsedRef.current, dur);
        }
      }, 250);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTrack.id, currentTrack.type, currentTrack.duration, nextTrack, setProgress]);

  // Handle track switches and play command
  useEffect(() => {
    localElapsedRef.current = 0;
    lastSyncTimeRef.current = Date.now();

    if (currentTrack.type === 'youtube') {
      if (audioRef.current) audioRef.current.pause();
      soundManager.stopIdleSong();

      if (isPlaying) {
        sendYtCommand('setVolume', [isMuted ? 0 : Math.round(volume * 100)]);
        sendYtCommand('playVideo');
      } else {
        sendYtCommand('pauseVideo');
      }
    } else if (currentTrack.type === 'audio') {
      sendYtCommand('pauseVideo');
      soundManager.stopIdleSong();

      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
        if (isPlaying) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setAudioPlaybackError(null);
              })
              .catch((err) => {
                console.warn('Audio play request blocked or failed:', err);
                if (err.name === 'NotAllowedError') {
                  setAudioPlaybackError('เบราว์เซอร์บล็อกการเล่นเพลงอัตโนมัติ กรุณากดปุ่ม "เล่น" เพื่อเปิดเสียง');
                } else if (!currentTrack.src) {
                  setAudioPlaybackError('ไม่พบไฟล์เสียงหรือลิงก์ไม่ถูกต้อง');
                }
              });
          }
        } else {
          audioRef.current.pause();
        }
      }
    } else if (currentTrack.type === 'synth') {
      sendYtCommand('pauseVideo');
      if (audioRef.current) audioRef.current.pause();
      if (isPlaying) {
        soundManager.startIdleSong();
      } else {
        soundManager.stopIdleSong();
      }
    }
  }, [currentTrack.id, currentTrack.src, isPlaying]);

  // Sync volume & mute changes
  useEffect(() => {
    if (currentTrack.type === 'youtube') {
      sendYtCommand('setVolume', [isMuted ? 0 : Math.round(volume * 100)]);
    } else if (currentTrack.type === 'audio' && audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, currentTrack.type]);

  // Handle Seek requests
  useEffect(() => {
    if (seekTarget !== null) {
      localElapsedRef.current = seekTarget;
      lastSyncTimeRef.current = Date.now();
      if (currentTrack.type === 'youtube') {
        sendYtCommand('seekTo', [seekTarget, true]);
      } else if (currentTrack.type === 'audio' && audioRef.current) {
        audioRef.current.currentTime = seekTarget;
      }
      clearSeekTarget();
    }
  }, [seekTarget, currentTrack.type, clearSeekTarget]);

  // Auto-pause when playing game, resume in menu
  useEffect(() => {
    if (isGameActive) {
      if (isPlaying) {
        sendYtCommand('pauseVideo');
        if (audioRef.current) audioRef.current.pause();
        soundManager.stopIdleSong();
      }
    } else {
      if (isPlaying) {
        if (currentTrack.type === 'youtube') {
          sendYtCommand('playVideo');
        } else if (currentTrack.type === 'audio' && audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    }
  }, [isGameActive]);

  // Handle adding user custom track
  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    const trimmedUrl = inputUrl.trim();
    if (!trimmedUrl) {
      setAddError('กรุณาระบุ URL ของ YouTube หรือลิงก์ไฟล์เสียง');
      return;
    }

    // Try detecting YouTube
    const ytId = musicStore.constructor['extractYouTubeId']
      ? (musicStore.constructor as any).extractYouTubeId(trimmedUrl)
      : trimmedUrl;

    if (ytId) {
      const added = addCustomTrack({
        title: inputTitle.trim() || `YouTube Track (${ytId})`,
        artist: inputArtist.trim() || 'Custom Added',
        type: 'youtube',
        src: ytId,
        duration: 240
      });
      setInputUrl('');
      setInputTitle('');
      setInputArtist('');
      setAddSuccess(`เพิ่มเพลง "${added.title}" สำเร็จแล้ว!`);
      setTimeout(() => setAddSuccess(null), 3500);
      return;
    }

    // Check if direct audio link
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      const added = addCustomTrack({
        title: inputTitle.trim() || 'สตรีมเพลงออนไลน์',
        artist: inputArtist.trim() || 'Audio URL',
        type: 'audio',
        src: trimmedUrl,
        duration: 240
      });
      setInputUrl('');
      setInputTitle('');
      setInputArtist('');
      setAddSuccess(`เพิ่มเพลง "${added.title}" สำเร็จแล้ว!`);
      setTimeout(() => setAddSuccess(null), 3500);
      return;
    }

    setAddError('ไม่พบรหัสวิดีโอ YouTube หรือลิงก์เสียงที่ถูกต้อง (เช่น https://youtu.be/... หรือ https://www.youtube.com/watch?v=...)');
  };

  // Upload local MP3 file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const trackId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await saveCustomAudio(file, file.name, trackId);
      // Also save to default offline key for backward compatibility
      await saveCustomAudio(file, file.name);

      const url = URL.createObjectURL(file);
      const added = addCustomTrack({
        id: trackId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'ไฟล์ของคุณในเครื่อง (ออฟไลน์)',
        type: 'audio',
        src: url,
        duration: 240
      });
      setAudioPlaybackError(null);
      setAddSuccess(`อัปโหลดเพลง "${added.title}" สำเร็จแล้ว!`);
      setTimeout(() => setAddSuccess(null), 3500);
    } catch (err) {
      setAddError('เกิดข้อผิดพลาดในการบันทึกไฟล์เสียงลงในเครื่อง');
    }
  };

  // Active lyric calculation
  const lyricsList = currentTrack.lyrics || (currentTrack.id === 'starlost_purpeech' ? LYRICS_STARLOST : null);
  const activeLyric = lyricsList
    ? lyricsList.reduce((prev, curr) => (curr.time <= currentTime ? curr : prev), lyricsList[0])
    : null;

  return (
    <>
      {/* Hidden HTML5 Audio Element for Audio URLs / Local Files */}
      {currentTrack.type === 'audio' && (
        <audio
          ref={audioRef}
          src={currentTrack.src}
          preload="auto"
          onCanPlay={() => {
            if (isPlaying && audioRef.current) {
              audioRef.current.play().catch(err => {
                if (err.name === 'NotAllowedError') {
                  setAudioPlaybackError('เบราว์เซอร์บล็อกการเล่นอัตโนมัติ กรุณากดปุ่มเล่นเพลง');
                }
              });
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setProgress(audioRef.current.currentTime, audioRef.current.duration);
            }
          }}
          onError={(e) => {
            console.warn('HTML5 Audio error on currentTrack:', e);
            if (!currentTrack.src) {
              setAudioPlaybackError('ยังไม่พบลำธารเสียง (กำลังโหลดไฟล์เสียง...)');
            } else {
              setAudioPlaybackError('ไม่สามารถโหลดเสียงจากไฟล์หรือลิงก์นี้ได้');
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setProgress(audioRef.current.currentTime, audioRef.current.duration || 240);
            }
          }}
          onEnded={() => nextTrack()}
        />
      )}

      {/* Off-screen YouTube IFrame container (keeps background audio and JS API active without throttling) */}
      <div className="fixed -top-[9999px] -left-[9999px] w-48 h-48 opacity-0 pointer-events-none z-[-1] overflow-hidden" aria-hidden="true">
        <iframe
          key={currentTrack.type === 'youtube' ? currentTrack.src : 'yt-iframe-default'}
          ref={ytIframeRef}
          id="chem-game-yt-player"
          width="200"
          height="200"
          src={`https://www.youtube-nocookie.com/embed/${currentTrack.type === 'youtube' ? currentTrack.src : 'Jdzs-qcURQE'}?enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&playsinline=1&autoplay=${isPlaying ? 1 : 0}`}
          title={currentTrack.title}
          allow="autoplay; encrypted-media"
          onLoad={() => {
            sendListeningHandshake();
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* FLOATING BOTTOM MUSIC PLAYER BAR / COMPACT MINI BADGE                     */}
      {/* ========================================================================= */}
      {isBarHidden ? (
        /* Draggable mini floating widget when player bar is hidden */
        <motion.div 
          drag
          dragMomentum={false}
          dragElastic={0.15}
          onDragStart={() => {
            isDraggingRef.current = true;
          }}
          onDragEnd={() => {
            // Keep isDragging true for a moment to swallow the click event from drag release
            setTimeout(() => {
              isDraggingRef.current = false;
            }, 120);
          }}
          whileDrag={{ scale: 1.06, cursor: 'grabbing' }}
          className="fixed bottom-4 right-4 z-40 touch-none select-none"
        >
          <div className="flex items-center gap-1.5 bg-slate-900/95 dark:bg-black/95 text-white border-2 border-pink-500/80 rounded-full pl-1.5 pr-2 py-1 shadow-[0_4px_20px_rgba(0,0,0,0.4),3px_3px_0px_#0f172a] backdrop-blur-md cursor-grab active:cursor-grabbing hover:border-pink-400 transition-colors">
            {/* Visual Drag Handle Icon */}
            <div 
              className="text-pink-400/80 hover:text-pink-300 flex items-center justify-center pl-0.5 cursor-grab active:cursor-grabbing" 
              title="ลากเพื่อย้ายตำแหน่ง (Drag to move)"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            <button
              onClick={() => {
                // If user just dragged the widget, do not trigger opening modal
                if (isDraggingRef.current) return;
                soundManager.playClick();
                onRequestOpenModal ? onRequestOpenModal() : null;
              }}
              className="flex items-center gap-2 cursor-pointer group"
              title="คลิกเพื่อเปิดเครื่องเล่นเพลงเต็ม"
            >
              <div className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
                <Disc3 className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left pointer-events-none">
                <span className="text-[11px] font-black text-pink-200 max-w-[95px] sm:max-w-[130px] truncate leading-tight">
                  {currentTrack.title}
                </span>
                <span className="text-[9px] font-mono text-pink-400 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </button>

            {/* Quick Play/Pause button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClick();
                togglePlay();
              }}
              className={`h-7 w-7 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
                isPlaying ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
              }`}
              title={isPlaying ? 'หยุดเล่น' : 'เล่นต่อ'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-slate-950 ml-0.5" />}
            </button>

            {/* Expand Full Bar Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClick();
                toggleBarHidden();
              }}
              className="h-7 w-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              title="แสดงแถบเพลงเต็ม"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        /* Full Floating Player Bar */
        <div className="fixed bottom-3 left-3 right-3 max-w-xl mx-auto z-40 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-slate-900/95 dark:bg-black/95 text-white border-2 border-slate-800 dark:border-zinc-700 backdrop-blur-md rounded-2xl p-2.5 shadow-[4px_4px_0px_#0f172a] transition-all">
            
            {/* Top Row: Track info & Quick Open Modal */}
            <div className="flex items-center justify-between gap-2">
              {/* Vinyl / Cover Art */}
              <div 
                onClick={() => {
                  soundManager.playClick();
                  onRequestOpenModal ? onRequestOpenModal() : null;
                }}
                className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 group"
              >
                <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 border border-white/20 shadow-md ${isPlaying ? 'animate-pulse' : ''}`}>
                  <Disc3 className={`h-5 w-5 text-white ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
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
                      {currentTrack.title}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700 shrink-0">
                      {currentTrack.type === 'youtube' ? 'YouTube' : 'Audio'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5">
                    <span className="text-slate-300 font-bold truncate">{currentTrack.artist}</span>
                    <span>·</span>
                    <span className="text-pink-400 font-bold tabular-nums">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transport Controls (Prev, Play, Next, Playlist, Hide) */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Previous Track Button */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    prevTrack();
                  }}
                  title="เพลงก่อนหน้า"
                  className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                {/* Play / Pause Button */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    togglePlay();
                  }}
                  title={isPlaying ? 'หยุดเล่น' : 'เล่นเพลง'}
                  className={`h-9 px-3 rounded-xl border-2 flex items-center justify-center gap-1 font-black text-xs shadow-sm transition active:scale-95 cursor-pointer ${
                    isPlaying 
                      ? 'bg-pink-600 hover:bg-pink-700 border-pink-400 text-white' 
                      : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-300 text-slate-950 font-black'
                  }`}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-slate-950" />}
                </button>

                {/* Next Track Button */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    nextTrack();
                  }}
                  title="เพลงถัดไป"
                  className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <SkipForward className="h-4 w-4" />
                </button>

                {/* Playlist Modal Button */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onRequestOpenModal ? onRequestOpenModal() : null;
                  }}
                  title="เปิดรายการเพลง (Playlist)"
                  className="h-8 px-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700 flex items-center gap-1 text-purple-200 text-[11px] font-bold transition cursor-pointer"
                >
                  <ListMusic className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black">{playlist.length}</span>
                </button>

                {/* Hide / Minimize Player Bar Button */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    toggleBarHidden();
                  }}
                  title="ซ่อนแถบเพลง (ยุบเป็นปุ่มลอย)"
                  className="h-8 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition active:scale-95 cursor-pointer"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">ซ่อน</span>
                </button>
              </div>
            </div>

            {/* Interactive Seekbar Slider */}
            <div className="mt-1.5 flex items-center gap-2 px-1">
              <input
                type="range"
                min={0}
                max={Math.max(1, duration)}
                step={1}
                value={currentTime}
                onChange={(e) => {
                  const targetSec = parseFloat(e.target.value);
                  seekTo(targetSec);
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-hidden"
              />
            </div>

            {/* Audio Playback Autoplay / Error Notice */}
            {audioPlaybackError && (
              <div 
                onClick={() => {
                  soundManager.playClick();
                  if (audioRef.current) {
                    audioRef.current.play().then(() => setAudioPlaybackError(null)).catch(() => {});
                  }
                  if (!isPlaying) togglePlay();
                }}
                className="mt-1.5 text-center py-1 px-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl cursor-pointer hover:bg-amber-500/30 transition flex items-center justify-center gap-1.5 text-amber-300 text-[11px] font-bold"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span className="truncate">{audioPlaybackError}</span>
                <span className="underline ml-1 shrink-0 text-white font-black">(แตะเพื่อเปิดเสียง)</span>
              </div>
            )}

            {/* Live Lyrics Subtitle ticker */}
            {!audioPlaybackError && lyricsList && activeLyric && (
              <div 
                onClick={() => {
                  soundManager.playClick();
                  onRequestOpenModal ? onRequestOpenModal() : null;
                }}
                className="mt-1 text-center py-0.5 px-2 bg-slate-800/60 rounded-lg cursor-pointer hover:bg-slate-800 transition"
              >
                <p className="text-[10px] text-pink-300 font-bold truncate animate-pulse">
                  🎶 {activeLyric.text}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PLAYLIST & MUSIC CONTROLLER FULL MODAL / DRAWER                           */}
      {/* ========================================================================= */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-3 border-slate-900 dark:border-zinc-700 bg-slate-900 text-white p-5 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                  <Music className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                    เครื่องเล่นเพลง & เพลย์ลิสต์
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ฟังเพลงขณะฝึกท่องตารางธาตุ สลับเพลงและเพิ่มเพลงได้อิสระ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    toggleBarHidden();
                  }}
                  title={isBarHidden ? 'แสดงแถบเพลงด้านล่าง' : 'ซ่อนแถบเพลงด้านล่าง'}
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition active:scale-95"
                >
                  {isBarHidden ? <Eye className="h-3 w-3 text-emerald-400" /> : <EyeOff className="h-3 w-3 text-slate-400" />}
                  <span>{isBarHidden ? 'แสดงแถบล่าง' : 'ซ่อนแถบล่าง'}</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    onCloseModal && onCloseModal();
                  }}
                  className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Currently Playing Hero Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-900/50 to-slate-800/70 border border-purple-700/50 flex flex-col items-center text-center space-y-3 shadow-inner">
              <div className={`relative w-28 h-28 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center shadow-xl ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center border-2 border-white/40">
                  <Disc3 className="h-6 w-6 text-white" />
                </div>
                {/* Vinyl Grooves */}
                <div className="absolute inset-2 rounded-full border border-slate-800/80 pointer-events-none" />
                <div className="absolute inset-5 rounded-full border border-slate-800/80 pointer-events-none" />
              </div>

              <div>
                <h4 className="font-black text-base text-white">{currentTrack.title}</h4>
                <p className="text-xs text-pink-300 font-bold mt-0.5">{currentTrack.artist}</p>
              </div>

              {/* Audio Playback Error Alert inside Modal */}
              {audioPlaybackError && (
                <div 
                  onClick={() => {
                    soundManager.playClick();
                    if (audioRef.current) {
                      audioRef.current.play().then(() => setAudioPlaybackError(null)).catch(() => {});
                    }
                    if (!isPlaying) togglePlay();
                  }}
                  className="w-full text-center py-2 px-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl cursor-pointer hover:bg-amber-500/30 transition flex items-center justify-center gap-2 text-amber-300 text-xs font-bold"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>{audioPlaybackError}</span>
                  <span className="underline text-white font-black">(คลิกเพื่อเปิดเสียง)</span>
                </div>
              )}

              {/* Progress Slider & Timestamps */}
              <div className="w-full space-y-1">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, duration)}
                  step={1}
                  value={currentTime}
                  onChange={(e) => {
                    seekTo(parseFloat(e.target.value));
                  }}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Transport Control Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    prevTrack();
                  }}
                  title="เพลงก่อนหน้า"
                  className="h-10 w-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 transition active:scale-95 cursor-pointer"
                >
                  <SkipBack className="h-5 w-5" />
                </button>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    togglePlay();
                  }}
                  title={isPlaying ? 'หยุดเล่น' : 'เล่นเพลง'}
                  className={`h-12 w-12 rounded-2xl border-2 flex items-center justify-center shadow-md transition active:scale-95 cursor-pointer ${
                    isPlaying 
                      ? 'bg-pink-600 hover:bg-pink-700 border-pink-400 text-white' 
                      : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-300 text-slate-950'
                  }`}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-slate-950" />}
                </button>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    nextTrack();
                  }}
                  title="เพลงถัดไป"
                  className="h-10 w-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 transition active:scale-95 cursor-pointer"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>

              {/* Volume Slider & Mute */}
              <div className="flex items-center gap-2.5 w-full max-w-xs pt-2">
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <span className="text-[10px] text-slate-400 font-bold tabular-nums w-8">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('playlist')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'playlist' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListMusic className="h-3.5 w-3.5" />
                <span>รายการ ({playlist.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('add')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'add' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>เพิ่มเพลงเอง</span>
              </button>

              <button
                onClick={() => setActiveTab('lyrics')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'lyrics' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>เนื้อเพลง</span>
              </button>
            </div>

            {/* TAB 1: PLAYLIST */}
            {activeTab === 'playlist' && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {playlist.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <div
                      key={track.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                        isCurrent 
                          ? 'bg-pink-950/70 border-pink-500 text-white shadow-sm' 
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          selectTrack(idx);
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isCurrent ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {isCurrent && isPlaying ? (
                            <span className="flex gap-0.5 items-end h-3">
                              <span className="w-1 h-3 bg-white animate-bounce" />
                              <span className="w-1 h-2 bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
                              <span className="w-1 h-3.5 bg-white animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </span>
                          ) : (
                            idx + 1
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs truncate">
                              {track.title}
                            </span>
                            {track.isCustom && (
                              <span className="text-[9px] px-1 rounded bg-purple-900 text-purple-200">
                                ผู้ใช้เพิ่ม
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {track.artist} · {track.type === 'youtube' ? 'YouTube' : 'Audio'}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        {track.isCustom && (
                          <button
                            onClick={() => {
                              soundManager.playClick();
                              deleteCustomAudio(track.id);
                              if (track.id === 'stored_offline_audio') {
                                deleteCustomAudio();
                              }
                              removeCustomTrack(track.id);
                            }}
                            title="ลบเพลงนี้"
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/60 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: ADD CUSTOM SONG */}
            {activeTab === 'add' && (
              <div className="space-y-3">
                <div className="p-3 bg-purple-950/50 border border-purple-800/60 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-pink-300 flex items-center gap-1">
                    <Youtube className="h-4 w-4 text-red-500" />
                    รองรับทั้ง YouTube และไฟล์เสียง MP3:
                  </span>
                  <p className="text-[11px] text-slate-300">
                    วางลิงก์ YouTube (เช่น https://youtu.be/...) หรือใส่ URL ไฟล์เสียงเพื่อฟังเพลงที่คุณชื่นชอบขณะเล่นเกม
                  </p>
                </div>

                <form onSubmit={handleAddTrack} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      URL YouTube หรือ ลิงก์ไฟล์เสียง: <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น https://www.youtube.com/watch?v=... หรือ รหัสวิดีโอ"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-pink-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        ชื่อเพลง (ไม่บังคับ):
                      </label>
                      <input
                        type="text"
                        placeholder="ชื่อเพลง"
                        value={inputTitle}
                        onChange={(e) => setInputTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-pink-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        ศิลปิน (ไม่บังคับ):
                      </label>
                      <input
                        type="text"
                        placeholder="ศิลปิน"
                        value={inputArtist}
                        onChange={(e) => setInputArtist(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-pink-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {addError && (
                    <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-700 text-[11px] text-rose-200">
                      {addError}
                    </div>
                  )}

                  {addSuccess && (
                    <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-700 text-[11px] text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{addSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 font-bold text-xs text-white transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    <span>เพิ่มเพลงนี้ลงในเพลย์ลิสต์</span>
                  </button>
                </form>

                {/* Local MP3 File Upload Alternative */}
                <div className="border-t border-slate-800 pt-3">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1.5 text-center">
                    หรืออัปโหลดไฟล์เพลงจากเครื่องของคุณ (MP3/WAV/M4A)
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Upload className="h-4 w-4 text-pink-400" />
                    <span>เลือกไฟล์เสียงจากเครื่อง</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: LYRICS */}
            {activeTab === 'lyrics' && (
              <div 
                ref={lyricsContainerRef}
                className="max-h-60 overflow-y-auto p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center"
              >
                {lyricsList ? (
                  lyricsList.map((line, idx) => {
                    const isPassed = line.time <= currentTime;
                    const isCurrent = activeLyric && activeLyric.time === line.time;

                    return (
                      <p
                        key={idx}
                        className={`text-xs py-1 transition-all ${
                          isCurrent 
                            ? 'text-pink-400 font-black text-sm scale-105 bg-pink-950/40 rounded-lg' 
                            : isPassed 
                            ? 'text-slate-300 font-medium' 
                            : 'text-slate-600'
                        }`}
                      >
                        {line.text}
                      </p>
                    );
                  })
                ) : (
                  <div className="py-8 text-slate-500 text-xs">
                    <Music className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p>ไม่มีข้อมูลเนื้อเพลงสำหรับเพลงนี้</p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      เพลงที่มีเนื้อเพลงแสดงสด: ไม่มีวันไหนที่ไม่คิดถึง (starlost. - PURPEECH)
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};
