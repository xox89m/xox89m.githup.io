/**
 * Real-time Music Store & Audio Engine
 * Supports curated playlists, YouTube IFrame Player integration, direct audio links,
 * user-added custom songs, auto-next, seekbar, and global real-time synchronization.
 */

export interface LyricLine {
  time: number;
  text: string;
}

export interface PlaylistItem {
  id: string;
  title: string;
  artist: string;
  type: 'youtube' | 'audio' | 'synth';
  src: string; // YouTube Video ID or Audio URL
  lyrics?: LyricLine[];
  duration?: number; // estimated or reported duration in seconds
  isCustom?: boolean;
}

export const LYRICS_STARLOST: LyricLine[] = [
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

export const LYRICS_PERFECT_GOODBYE: LyricLine[] = [
  { time: 0, text: '🎵 ดนตรีเปิดเพลง...' },
  { time: 16.0, text: 'เคยคิดว่าคงไม่เลิกกันจริงจริง' },
  { time: 22.0, text: 'เคยหวังเวลาคงเยียวยาทุกสิ่ง' },
  { time: 28.0, text: 'เคยคิดว่าคงเหมือนเพลงที่ได้ยิน' },
  { time: 33.0, text: 'หากยังรัก เราคงวนมาอีกครา' },
  { time: 40.0, text: 'เปลี่ยนไปไม่เหมือนเก่า' },
  { time: 44.0, text: 'ครั้งนี้ถ้อยคำลา เจ็บปวดกว่าครั้งก่อน' },
  { time: 50.0, text: 'สายตาเธอฟ้องและฉันสัมผัสได้จากอ้อมกอด' },
  { time: 56.0, text: 'บอกฉันว่าต้องพอเท่านี้...' },
  { time: 63.0, text: '🌟 [ท่อนฮุก]' },
  { time: 64.0, text: 'ลาจากกันครั้งนี้ คงเป็นครั้งสุดท้าย' },
  { time: 71.0, text: 'เดินมาไกลเท่านี้ มันก็ดีแค่ไหน' },
  { time: 79.0, text: 'จากนี้ จะไม่มีข้อความส่งไปหาอีก' },
  { time: 87.0, text: 'จากนี้ เราต้องจากกันโดยสมบูรณ์...' },
  { time: 96.0, text: 'และในทุกค่ำคืนที่เราจะไม่ยืนข้างกัน' },
  { time: 102.0, text: 'และในทุกวันสำคัญ คงทำได้แค่คิดถึง' },
  { time: 108.0, text: 'เรื่องราวมากมายผ่าน คอยเตือนให้จำความฝัน' },
  { time: 114.0, text: 'หากวันนี้ต้องจากกัน ขอให้จากกันโดยสมบูรณ์' },
  { time: 132.0, text: 'จากกันด้วยรอยยิ้ม...' },
  { time: 140.0, text: '🌟 [ท่อนฮุก 2]' },
  { time: 141.0, text: 'ลาจากกันครั้งนี้ คงเป็นครั้งสุดท้าย' },
  { time: 148.0, text: 'เดินมาไกลเท่านี้ มันก็ดีแค่ไหน' },
  { time: 155.0, text: 'จากนี้ จะไม่มีข้อความส่งไปหาอีก' },
  { time: 163.0, text: 'จากนี้ เราต้องจากกันโดยสมบูรณ์' },
  { time: 188.0, text: 'เปลี่ยนไปไม่เหมือนเก่า' },
  { time: 193.0, text: 'ครั้งนี้ถ้อยคำลา เจ็บปวดกว่าครั้งก่อน...' },
  { time: 212.0, text: '🌟 [ท่อนฮุกสุดท้าย]' },
  { time: 213.0, text: 'ลาจากกันครั้งนี้ คงเป็นครั้งสุดท้าย' },
  { time: 220.0, text: 'เดินมาไกลเท่านี้ มันก็ดีแค่ไหน' },
  { time: 228.0, text: 'จากนี้ จะไม่มีข้อความส่งไปหาอีก' },
  { time: 235.0, text: 'จากนี้ เราต้องจากกันโดยสมบูรณ์' }
];

export const LYRICS_PHOTOGRAPH_PURPEECH: LyricLine[] = [
  { time: 0, text: '🎵 ดนตรีเปิดเพลง...' },
  { time: 10.0, text: 'ฮู วา ฮ้า ฮา...' },
  { time: 20.0, text: 'เรื่องราวแห่งความรักครั้งหนึ่ง ที่เปื้อนด้วยรอยยิ้มและมีน้ำตาให้กับมัน' },
  { time: 33.0, text: 'หากเปรียบดั่งดวงดาวคงสวยงาม ประดับประดาด้วยเรื่องราวที่คิดถึง' },
  { time: 46.0, text: 'หากเปรียบดั่งฤดูกาลที่เหงาใจ เธอคือลมที่ฉันคิดถึงในหน้าร้อน' },
  { time: 58.0, text: 'ไออุ่นในทุกคราที่ฉันเคยได้วอนขอ ในวันที่ฝนพรำนั้นทำให้ฉันเปียกปอน' },
  { time: 70.0, text: '🌟 [ท่อนฮุก]' },
  { time: 71.0, text: 'ได้โปรดเถอะให้ฉันหนีไปจากตรงนี้ จากความทรงจำแสนดีที่ฉันยังคงเก็บเอาไว้' },
  { time: 83.0, text: 'ได้โปรดเถอะให้ฉันหายไปกับเวลา เพราะเธอยังอยู่ตรงนี้ที่เดิมไม่เคยลาจาก' },
  { time: 95.0, text: 'เป็นดอกไม้ที่งดงามผู้แสนพร่างพราว ที่ยังคอยอยู่ในดาวมืดดำที่ดูว่างเปล่า' },
  { time: 107.0, text: 'ยังมีฉันคอยดูแล ไม่เคยเลือนจางหาย...' },
  { time: 125.0, text: 'เรื่องราวแห่งความรักครั้งใด ที่ถูกซ่อนเก็บไว้แม้วันเวลาได้ผ่านมา' },
  { time: 138.0, text: 'ภาพถ่ายในวันวานถูกขีดเขียนด้วยปากกาฝัน ว่าจะมีกันและกันอยู่ตรงนี้ตลอดไป' },
  { time: 151.0, text: 'หากเปรียบดั่งฤดูกาลที่เปลี่ยนผัน เธอยังคงเป็นลมที่ฉันคิดถึงในหน้าร้อน' },
  { time: 163.0, text: 'ไออุ่นในทุกคราที่ฉันเคยได้วอนขอ และเธอเปรียบดั่งฝนพรำที่ทำให้ฉันเปียกปอน' },
  { time: 175.0, text: '🌟 [ท่อนฮุก 2]' },
  { time: 176.0, text: 'ได้โปรดเถอะให้ฉันหนีไปจากตรงนี้ ไปยังดินแดนแสนไกลที่ไม่มีเธออยู่ในนั้น' },
  { time: 188.0, text: 'ได้โปรดเถอะให้เธอหายไปกับเวลา เพราะเธอยังอยู่ตรงนี้ที่เดิมไม่เคยลาจาก' },
  { time: 200.0, text: 'เป็นดอกไม้ที่งดงามผู้แสนพร่างพราว ที่ยังคอยอยู่ในดาวมืดดำที่ดูว่างเปล่า' },
  { time: 212.0, text: 'ยังมีฉันคอยดูแล อยากพบเธออีกครั้ง...' },
  { time: 228.0, text: 'เพราะทุกความรักใดๆ ที่เคยมีกัน จะงดงามและตรึงติดใจ' },
  { time: 236.0, text: 'พร้อมทิ้งรอยน้ำตาความสุข ซ่อนเก็บไว้ผ่านเรื่องราวที่เราเคย' },
  { time: 246.0, text: 'โอบกอดกันเต้นรำใต้แสงดาว พราวซิบบอกรักกันด้วยเสียงเพลง' },
  { time: 257.0, text: 'บทกวีแห่งรักที่เราได้เขียนเอง ซ่อนเก็บไว้ให้เป็นดั่งวันวาน...' }
];

export const DEFAULT_PLAYLIST: PlaylistItem[] = [
  {
    id: 'guncharlie_perfect_goodbye',
    title: 'จากกันโดยสมบูรณ์',
    artist: 'guncharlie',
    type: 'youtube',
    src: 'Jdzs-qcURQE',
    duration: 242,
    lyrics: LYRICS_PERFECT_GOODBYE
  },
  {
    id: 'purpeech_photograph',
    title: 'ภาพถ่ายวันวาน (1920)',
    artist: 'PURPEECH',
    type: 'youtube',
    src: 'p_ZH_oqoz7k',
    duration: 287,
    lyrics: LYRICS_PHOTOGRAPH_PURPEECH
  },
  {
    id: 'starlost_purpeech',
    title: 'ไม่มีวันไหนที่ไม่คิดถึง (starlost.)',
    artist: 'PURPEECH',
    type: 'youtube',
    src: 'AyfZesBO4Vk',
    duration: 388,
    lyrics: LYRICS_STARLOST
  },
  {
    id: 'periodic_table_song',
    title: 'เพลงตารางธาตุ Periodic Table',
    artist: 'AsapSCIENCE (ซับไทย)',
    type: 'youtube',
    src: 'rz4Dd1I_fX0',
    duration: 180
  },
  {
    id: 'midnight_synthwave_beats',
    title: 'Midnight Quantum Synthwave',
    artist: 'Cyber Chem Ambient',
    type: 'youtube',
    src: '4xDzrJKXOOY',
    duration: 2400
  }
];

export interface MusicState {
  playlist: PlaylistItem[];
  currentTrackIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  seekTarget: number | null;
}

const STORAGE_CUSTOM_TRACKS = 'chem_custom_playlist_v2';
const STORAGE_CURRENT_TRACK_ID = 'chem_music_current_id';

class MusicStoreService {
  private state: MusicState = {
    playlist: [...DEFAULT_PLAYLIST],
    currentTrackIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 242,
    volume: 0.7,
    isMuted: false,
    seekTarget: null
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadPersistedData();
  }

  private loadPersistedData() {
    if (typeof window === 'undefined') return;

    try {
      const customStr = localStorage.getItem(STORAGE_CUSTOM_TRACKS);
      if (customStr) {
        const customTracks: PlaylistItem[] = JSON.parse(customStr);
        if (Array.isArray(customTracks)) {
          // Filter out any Chemistry lofi tracks
          const filteredCustom = customTracks.filter(t => t.id !== 'lofi_chemistry_beats' && !t.title.toLowerCase().includes('chemistry lofi'));
          this.state.playlist = [...DEFAULT_PLAYLIST, ...filteredCustom];
        }
      } else {
        this.state.playlist = [...DEFAULT_PLAYLIST];
      }

      const savedTrackId = localStorage.getItem(STORAGE_CURRENT_TRACK_ID);
      if (savedTrackId && savedTrackId !== 'lofi_chemistry_beats') {
        const idx = this.state.playlist.findIndex(t => t.id === savedTrackId);
        if (idx !== -1) {
          this.state.currentTrackIndex = idx;
          this.state.duration = this.state.playlist[idx].duration || 242;
        } else {
          this.state.currentTrackIndex = 0;
          this.state.duration = this.state.playlist[0].duration || 242;
        }
      } else {
        this.state.currentTrackIndex = 0;
        this.state.duration = this.state.playlist[0].duration || 242;
      }

      const savedVol = localStorage.getItem('chem_music_volume');
      if (savedVol) {
        this.state.volume = parseFloat(savedVol);
      }
      const savedMute = localStorage.getItem('chem_music_muted');
      if (savedMute) {
        this.state.isMuted = savedMute === 'true';
      }
    } catch (e) {
      console.warn('Failed to load persisted music store:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getState(): MusicState {
    return this.state;
  }

  public getCurrentTrack(): PlaylistItem {
    return this.state.playlist[this.state.currentTrackIndex] || this.state.playlist[0];
  }

  public setIsPlaying(playing: boolean) {
    if (this.state.isPlaying !== playing) {
      this.state.isPlaying = playing;
      this.notify();
    }
  }

  public togglePlay() {
    this.state.isPlaying = !this.state.isPlaying;
    this.notify();
  }

  public setProgress(currentTime: number, duration?: number) {
    this.state.currentTime = currentTime;
    if (duration && duration > 0 && duration !== this.state.duration) {
      this.state.duration = duration;
    }
    this.notify();
  }

  public seekTo(seconds: number) {
    this.state.currentTime = seconds;
    this.state.seekTarget = seconds;
    this.notify();
  }

  public clearSeekTarget() {
    this.state.seekTarget = null;
  }

  public setVolume(vol: number) {
    this.state.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('chem_music_volume', this.state.volume.toString());
    } catch {}
    this.notify();
  }

  public toggleMute() {
    this.state.isMuted = !this.state.isMuted;
    try {
      localStorage.setItem('chem_music_muted', this.state.isMuted.toString());
    } catch {}
    this.notify();
  }

  public selectTrack(index: number) {
    if (index >= 0 && index < this.state.playlist.length) {
      this.state.currentTrackIndex = index;
      this.state.currentTime = 0;
      this.state.duration = this.state.playlist[index].duration || 240;
      this.state.isPlaying = true;
      try {
        localStorage.setItem(STORAGE_CURRENT_TRACK_ID, this.state.playlist[index].id);
      } catch {}
      this.notify();
    }
  }

  public selectTrackById(id: string) {
    const idx = this.state.playlist.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.selectTrack(idx);
    }
  }

  public nextTrack() {
    const nextIdx = (this.state.currentTrackIndex + 1) % this.state.playlist.length;
    this.selectTrack(nextIdx);
  }

  public prevTrack() {
    const prevIdx = (this.state.currentTrackIndex - 1 + this.state.playlist.length) % this.state.playlist.length;
    this.selectTrack(prevIdx);
  }

  public addCustomTrack(track: Omit<PlaylistItem, 'id' | 'isCustom'>): PlaylistItem {
    const newTrack: PlaylistItem = {
      ...track,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isCustom: true
    };

    const nextPlaylist = [...this.state.playlist, newTrack];
    this.state.playlist = nextPlaylist;

    // Persist custom tracks
    try {
      const customTracks = nextPlaylist.filter(t => t.isCustom);
      localStorage.setItem(STORAGE_CUSTOM_TRACKS, JSON.stringify(customTracks));
    } catch {}

    // Automatically switch to the newly added song
    this.selectTrack(nextPlaylist.length - 1);
    return newTrack;
  }

  public removeCustomTrack(id: string) {
    const isCurrent = this.getCurrentTrack().id === id;
    const nextPlaylist = this.state.playlist.filter(t => t.id !== id);
    this.state.playlist = nextPlaylist;

    try {
      const customTracks = nextPlaylist.filter(t => t.isCustom);
      localStorage.setItem(STORAGE_CUSTOM_TRACKS, JSON.stringify(customTracks));
    } catch {}

    if (isCurrent) {
      this.selectTrack(0);
    } else {
      // readjust index if needed
      const curId = this.getCurrentTrack()?.id;
      const newIdx = nextPlaylist.findIndex(t => t.id === curId);
      this.state.currentTrackIndex = newIdx !== -1 ? newIdx : 0;
      this.notify();
    }
  }

  /**
   * Helper to extract YouTube ID from standard URLs or direct IDs
   */
  public static extractYouTubeId(urlOrId: string): string | null {
    const trimmed = urlOrId.trim();
    if (!trimmed) return null;

    // If directly an 11-char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    // Match youtube.com or youtu.be patterns
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = trimmed.match(regex);
    return match ? match[1] : null;
  }
}

export const musicStore = new MusicStoreService();
