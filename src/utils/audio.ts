/**
 * Audio Engine for Periodic Table Chemistry Game
 * Built with Web Audio API for zero-latency, 100% offline-ready sound effects & ambient lab music.
 * Features dual sound profiles:
 * - 'light' (Daylight Lab): Bright, cheerful, acoustic crystalline chime & upbeat morning lab jazz
 * - 'dark' (Cyber Neon Lab): Sci-fi cyberpunk synths, neon laser pulses, quantum resonance & ambient synthwave
 */

export type AudioTheme = 'light' | 'dark';

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public sfxVolume: number = 0.8;
  public bgmVolume: number = 0.35;
  public isBgmPlaying: boolean = false;
  public isBgmEnabled: boolean = false;
  public isIdleSongEnabled: boolean = true;
  public isIdleSongPlaying: boolean = false;
  private idleSongTimeout: any = null;
  private currentTheme: AudioTheme = 'light';
  private bgmInterval: NodeJS.Timeout | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('chem_sound_muted');
        if (savedMute !== null) this.isMuted = savedMute === 'true';

        const savedBgm = localStorage.getItem('chem_bgm_enabled');
        if (savedBgm !== null) this.isBgmEnabled = savedBgm === 'true';

        const savedIdle = localStorage.getItem('chem_idle_song_enabled');
        if (savedIdle !== null) this.isIdleSongEnabled = savedIdle === 'true';

        const savedSfxVol = localStorage.getItem('chem_sfx_volume');
        if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);

        const savedBgmVol = localStorage.getItem('chem_bgm_volume');
        if (savedBgmVol !== null) this.bgmVolume = parseFloat(savedBgmVol);

        const savedTheme = localStorage.getItem('chem_theme') as AudioTheme | null;
        if (savedTheme === 'light' || savedTheme === 'dark') {
          this.currentTheme = savedTheme;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          this.currentTheme = 'dark';
        }
      } catch (e) {
        console.warn('Could not load audio preferences:', e);
      }

      // Auto-unlock Web Audio on first user interaction
      const unlock = () => {
        this.initContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        if (this.isIdleSongEnabled && !this.isMuted && !this.isIdleSongPlaying) {
          this.startIdleSong();
        } else if (this.isBgmEnabled && !this.isMuted && !this.isBgmPlaying) {
          this.startBgm();
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };

      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
  }

  public initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // Settings getters & setters
  public getTheme(): AudioTheme {
    return this.currentTheme;
  }

  public setTheme(theme: AudioTheme) {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    try {
      localStorage.setItem('chem_theme', theme);
    } catch {}

    // If BGM is playing, seamlessly switch track to the new theme
    if (this.isBgmPlaying && !this.isMuted && this.isBgmEnabled) {
      this.stopBgm();
      this.startBgm();
    }
    this.notify();
  }

  public toggleTheme(): AudioTheme {
    const nextTheme: AudioTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
    this.playThemeSwitch(nextTheme);
    return nextTheme;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('chem_sound_muted', String(this.isMuted));
    } catch {}
    
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.initContext();
      this.playClick();
      if (this.isBgmEnabled) {
        this.startBgm();
      }
    }
    this.notify();
    return this.isMuted;
  }

  public getIsBgmEnabled(): boolean {
    return this.isBgmEnabled;
  }

  public getIsIdleSongEnabled(): boolean {
    return this.isIdleSongEnabled;
  }

  public getIsIdleSongPlaying(): boolean {
    return this.isIdleSongPlaying;
  }

  public toggleIdleSong(): boolean {
    this.isIdleSongEnabled = !this.isIdleSongEnabled;
    try {
      localStorage.setItem('chem_idle_song_enabled', String(this.isIdleSongEnabled));
    } catch {}

    if (this.isIdleSongEnabled && !this.isMuted) {
      this.initContext();
      this.startIdleSong();
    } else {
      this.stopIdleSong();
    }
    this.notify();
    return this.isIdleSongEnabled;
  }

  public toggleBgm(): boolean {
    this.isBgmEnabled = !this.isBgmEnabled;
    try {
      localStorage.setItem('chem_bgm_enabled', String(this.isBgmEnabled));
    } catch {}

    if (this.isBgmEnabled && !this.isMuted) {
      this.initContext();
      this.startBgm();
    } else {
      this.stopBgm();
    }
    this.notify();
    return this.isBgmEnabled;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('chem_sfx_volume', String(this.sfxVolume));
    } catch {}
    this.notify();
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('chem_bgm_volume', String(this.bgmVolume));
    } catch {}
    this.notify();
  }

  /* ---------------- SOUND EFFECTS (THEMED) ---------------- */

  /**
   * Sound on toggling Dark / Light theme
   */
  public playThemeSwitch(toTheme: AudioTheme) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      if (toTheme === 'dark') {
        // Futuristic Cyber Activation - Sub sweep down then resonant neon chirp
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2500, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.28);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Daylight Sunrise Chime - Shimmering upward crystal chime
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);

          const startTime = now + idx * 0.04;
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.22 * this.sfxVolume, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.25);
        });
      }
    } catch (e) {
      console.warn('Audio theme switch error', e);
    }
  }

  /**
   * Button click / tap sound:
   * - Light: Soft, organic wooden acoustic pop
   * - Dark: Sharp cyber laser blip
   */
  public playClick() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (this.currentTheme === 'dark') {
        // Cyber Neon Blip
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.035);

        gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      } else {
        // Daylight Soft Pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + (this.currentTheme === 'dark' ? 0.04 : 0.05));
    } catch (e) {
      console.warn('Audio click error', e);
    }
  }

  /**
   * Correct Answer Chime:
   * - Light: C-Major acoustic crystal bell (C5 -> E5 -> G5 -> C6)
   * - Dark: Cyberpunk power synth chord (D4 -> A4 -> F#5 -> C#6 with analog filter)
   */
  public playCorrect() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentTheme === 'dark') {
        // Neon Cyber Synth Chord (Detuned futuristic vibe)
        const notes = [293.66, 440.00, 739.99, 1108.73]; // D4, A4, F#5, C#6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(3200, now);
          filter.frequency.exponentialRampToValueAtTime(600, now + 0.35);

          const startTime = now + idx * 0.04;
          const duration = 0.32;

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.18 * this.sfxVolume, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });
      } else {
        // Daylight Cheerful Major Bell
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          const startTime = now + idx * 0.05;
          const duration = 0.25;

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.24 * this.sfxVolume, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });
      }
    } catch (e) {
      console.warn('Audio correct error', e);
    }
  }

  /**
   * Combo streak sound:
   * - Light: Melodic sparkling arpeggio scaling pitch with combo
   * - Dark: High-tech laser overdrive energy beam with harmonic pulse
   */
  public playCombo(comboCount: number) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentTheme === 'dark') {
        // Cyber Overdrive Pulse
        const baseFreq = 440 + Math.min(comboCount * 90, 900);
        const frequencies = [baseFreq, baseFreq * 1.333, baseFreq * 1.666];

        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + idx * 0.04 + 0.15);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(freq * 1.5, now);
          filter.Q.setValueAtTime(3, now);

          const startTime = now + idx * 0.04;
          gain.gain.setValueAtTime(0.2 * this.sfxVolume, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.22);
        });
      } else {
        // Daylight Sparkle Bell
        const baseFreq = 500 + Math.min(comboCount * 70, 700);
        const frequencies = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          const startTime = now + idx * 0.05;
          gain.gain.setValueAtTime(0.22 * this.sfxVolume, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.2);
        });
      }
    } catch (e) {
      console.warn('Audio combo error', e);
    }
  }

  /**
   * Wrong Answer:
   * - Light: Cartoonish descending boing/wobble
   * - Dark: Digital glitch error / low sub-bass warning buzz
   */
  public playWrong() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentTheme === 'dark') {
        // Digital Cyber Glitch / Sub-bass Error
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.setValueAtTime(90, now + 0.08);

        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(65, now);
        sub.frequency.linearRampToValueAtTime(45, now + 0.24);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(filter);
        sub.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        sub.start(now);
        osc.stop(now + 0.25);
        sub.stop(now + 0.25);
      } else {
        // Daylight Descending Tone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(155.56, now);
        osc1.frequency.linearRampToValueAtTime(130, now + 0.22);

        osc2.frequency.setValueAtTime(146.83, now);
        osc2.frequency.linearRampToValueAtTime(120, now + 0.22);

        gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Audio wrong error', e);
    }
  }

  /**
   * Countdown Tick:
   * - Light: Soft clock tick
   * - Dark: Tactical electronic sonar ping
   */
  public playTick(isUrgent: boolean = false) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (this.currentTheme === 'dark') {
        // Electronic Sonar Ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isUrgent ? 1100 : 700, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

        gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      } else {
        // Daylight Clock Tick
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isUrgent ? 880 : 550, now);

        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + (this.currentTheme === 'dark' ? 0.06 : 0.04));
    } catch (e) {
      console.warn('Audio tick error', e);
    }
  }

  /**
   * Lifeline Hint:
   * - Light: Magical celestial sparkle
   * - Dark: Quantum data stream / laser scanner sweep
   */
  public playLifeline() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentTheme === 'dark') {
        // Cyber Quantum Scan
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.22);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.Q.setValueAtTime(4, now);

        gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.24);
      } else {
        // Daylight Fairy Sparkle
        const sparkles = [784, 987.77, 1174.66, 1567.98];
        sparkles.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);

          const startTime = now + idx * 0.04;
          gain.gain.setValueAtTime(0.18 * this.sfxVolume, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.22);
        });
      }
    } catch (e) {
      console.warn('Audio lifeline error', e);
    }
  }

  /**
   * Element Tap Resonance (Based on Atomic Number 1..118)
   * - Light: Pure crystalline bell chime
   * - Dark: Deep neon pulse with sub-harmonic body
   */
  public playElementSound(atomicNumber: number) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const normalized = Math.min(Math.max(atomicNumber, 1), 118) / 118;

      if (this.currentTheme === 'dark') {
        // Deep Cyber Wave with Sub-Harmonic
        const baseFreq = 180 + normalized * 520;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(baseFreq, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 0.5, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(baseFreq * 2.5, now);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.38);
        osc2.stop(now + 0.38);
      } else {
        // Daylight Crystal Resonance
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const baseFreq = 260 + normalized * 600;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn('Audio element error', e);
    }
  }

  /**
   * Victory Fanfare:
   * - Light: Triumphant Major Brass & Bells (C4, G4, C5, E5, G5, C6)
   * - Dark: Epic Synthwave Anthem / 80s Cyber Victory Power Arpeggio
   */
  public playVictory() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentTheme === 'dark') {
        // Epic Synthwave Victory Anthem (Minor Pentatonic Power)
        const fanfare = [
          { f: 220.00, d: 0.12, t: 0 },    // A3
          { f: 329.63, d: 0.12, t: 0.1 },  // E4
          { f: 440.00, d: 0.12, t: 0.2 },  // A4
          { f: 554.37, d: 0.14, t: 0.3 },  // C#5
          { f: 659.25, d: 0.16, t: 0.42 }, // E5
          { f: 880.00, d: 0.65, t: 0.58 }  // A5
        ];

        fanfare.forEach(note => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(note.f, now + note.t);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2800, now + note.t);

          const startTime = now + note.t;
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.22 * this.sfxVolume, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + note.d);
        });
      } else {
        // Daylight Brass Fanfare
        const fanfare = [
          { f: 261.63, d: 0.12, t: 0 },
          { f: 392.00, d: 0.12, t: 0.1 },
          { f: 523.25, d: 0.12, t: 0.2 },
          { f: 659.25, d: 0.15, t: 0.3 },
          { f: 783.99, d: 0.18, t: 0.42 },
          { f: 1046.50, d: 0.6, t: 0.58 }
        ];

        fanfare.forEach(note => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.f, now + note.t);

          const startTime = now + note.t;
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.25 * this.sfxVolume, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + note.d);
        });
      }
    } catch (e) {
      console.warn('Audio victory error', e);
    }
  }

  /**
   * Match success / Pair Connection:
   * - Light: Dual bell (D5 -> A5)
   * - Dark: Holographic lock-in beam
   */
  public playMatchSuccess() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (this.currentTheme === 'dark') {
        // Holographic Lock-in Beam
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12); // E6

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      } else {
        // Daylight Dual Bell
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio match error', e);
    }
  }

  /**
   * Battle Start:
   * - Light: Rallying trumpet fanfare
   * - Dark: Warp-drive power charge & ignition
   */
  public playBattleStart() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (this.currentTheme === 'dark') {
        // Plasma Hyperdrive Charge
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      } else {
        // Daylight Brass Call
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.3);

        gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.48);
    } catch (e) {
      console.warn('Audio battle start error', e);
    }
  }

  /* ---------------- BACKGROUND MUSIC (LIGHT VS DARK) ---------------- */

  public startBgm() {
    if (this.isBgmPlaying || this.isMuted || !this.isBgmEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.isBgmPlaying = true;

    // Distinct Chords for Light vs Dark
    // Light Mode: Daylight Lo-fi Chemistry Lab (Cmaj7 -> Am7 -> Fmaj7 -> G7)
    const lightChords = [
      [261.63, 329.63, 392.00, 493.88], // C, E, G, B
      [220.00, 261.63, 329.63, 392.00], // A, C, E, G
      [174.61, 220.00, 261.63, 329.63], // F, A, C, E
      [196.00, 246.94, 293.66, 349.23]  // G, B, D, F
    ];

    // Dark Mode: Cyber Neon Lab Synthwave (Dm9 -> Bbmaj7 -> Gm9 -> Asus4)
    const darkChords = [
      [146.83, 220.00, 261.63, 329.63], // D, A, C, E (Dm9)
      [116.54, 174.61, 220.00, 293.66], // Bb, F, A, D (Bbmaj7)
      [98.00,  146.83, 196.00, 261.63], // G, D, G, C  (Gm9)
      [110.00, 164.81, 220.00, 293.66]  // A, E, A, D  (Asus4)
    ];

    let chordIndex = 0;

    const playChordStep = () => {
      if (!this.isBgmPlaying || this.isMuted || !this.ctx) return;
      try {
        const isDark = this.currentTheme === 'dark';
        const chords = isDark ? darkChords : lightChords;
        const chord = chords[chordIndex % chords.length];
        const now = this.ctx.currentTime;

        if (isDark) {
          // Cyber Neon Atmosphere: Low resonant saw/triangle with sub-bass
          chord.forEach((freq, nIdx) => {
            const osc = this.ctx!.createOscillator();
            const filter = this.ctx!.createBiquadFilter();
            const gain = this.ctx!.createGain();

            osc.type = nIdx === 0 ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(freq, now + nIdx * 0.22);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.frequency.exponentialRampToValueAtTime(500, now + 1.2);

            const startTime = now + nIdx * 0.22;
            const duration = 1.1;

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(0.03 * this.bgmVolume, startTime + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx!.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
          });
        } else {
          // Daylight Arpeggiated Soft Sine Notes
          chord.forEach((freq, nIdx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + nIdx * 0.2);

            const startTime = now + nIdx * 0.2;
            const duration = 0.8;

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(0.035 * this.bgmVolume, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx!.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
          });
        }

        chordIndex++;
      } catch (e) {
        console.warn('BGM step error', e);
      }
    };

    // Play initial step & loop
    playChordStep();
    this.bgmInterval = setInterval(playChordStep, this.currentTheme === 'dark' ? 2000 : 1800);
    this.notify();
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.notify();
  }

  /**
   * Play gentle melody of "ไม่มีวันไหนที่ไม่คิดถึง" softly when idle/in menu
   */
  public startIdleSong() {
    if (this.isIdleSongPlaying || this.isMuted || !this.isIdleSongEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.isIdleSongPlaying = true;
    this.notify();

    const loopDurationMs = 17500; // 17.5 seconds per loop

    const playCycle = () => {
      if (!this.isIdleSongPlaying || this.isMuted || !this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const vol = Math.max(0.01, this.bgmVolume * 0.45); // gentle & soft (เบาๆ)

        // Melody notes of "ไม่มีวันไหนที่ไม่คิดถึง" (Key of G Major)
        const melody = [
          // ไม่-มี-วัน-ไหน
          { f: 293.66, t: 0.0, d: 0.35 },  // D4 (ไม่)
          { f: 392.00, t: 0.4, d: 0.35 },  // G4 (มี)
          { f: 440.00, t: 0.8, d: 0.35 },  // A4 (วัน)
          { f: 493.88, t: 1.2, d: 0.75 },  // B4 (ไหน)
          // ที่-ไม่-คิด-ถึง-เธอ
          { f: 493.88, t: 2.1, d: 0.32 },  // B4 (ที่)
          { f: 440.00, t: 2.5, d: 0.32 },  // A4 (ไม่)
          { f: 392.00, t: 2.9, d: 0.32 },  // G4 (คิด)
          { f: 440.00, t: 3.3, d: 0.85 },  // A4 (ถึง-เธอ)
          // หลับ-ตา-ทุก-ครั้ง-ยัง-เห็น-เธอ
          { f: 293.66, t: 4.4, d: 0.35 },  // D4 (หลับ)
          { f: 392.00, t: 4.8, d: 0.35 },  // G4 (ตา)
          { f: 440.00, t: 5.2, d: 0.35 },  // A4 (ทุก)
          { f: 493.88, t: 5.6, d: 0.55 },  // B4 (ครั้ง)
          { f: 587.33, t: 6.2, d: 0.65 },  // D5 (ยัง)
          { f: 493.88, t: 6.9, d: 0.45 },  // B4 (เห็น)
          { f: 440.00, t: 7.4, d: 1.10 },  // A4 (เธอ...)
          // แม้-วัน-เว-ลา-จะ-ผ่าน-ไป
          { f: 493.88, t: 8.8, d: 0.32 },  // B4 (แม้)
          { f: 523.25, t: 9.2, d: 0.32 },  // C5 (วัน)
          { f: 493.88, t: 9.6, d: 0.32 },  // B4 (เว)
          { f: 440.00, t: 10.0, d: 0.32 }, // A4 (ลา)
          { f: 392.00, t: 10.4, d: 0.45 }, // G4 (จะ)
          { f: 329.63, t: 10.9, d: 0.55 }, // E4 (ผ่าน)
          // แสน-นาน-แต่
          { f: 392.00, t: 11.6, d: 0.50 }, // G4 (ไป)
          { f: 440.00, t: 12.2, d: 0.45 }, // A4 (แสน)
          { f: 493.88, t: 12.7, d: 0.55 }, // B4 (นาน)
          // ใจ-ดวง-นี้-ยัง-คง-คิด-ถึง-เธอ
          { f: 440.00, t: 13.4, d: 0.35 }, // A4 (แต่)
          { f: 493.88, t: 13.8, d: 0.35 }, // B4 (ใจ)
          { f: 440.00, t: 14.2, d: 0.45 }, // A4 (ยัง)
          { f: 392.00, t: 14.7, d: 1.80 }  // G4 (มี-แต่-เธอ...)
        ];

        // Soft Acoustic Piano/Chime Synth for Melody
        melody.forEach(note => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.f, now + note.t);

          const startTime = now + note.t;
          gain.gain.setValueAtTime(0.0001, startTime);
          gain.gain.linearRampToValueAtTime(0.06 * vol, startTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.d + 0.2);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(startTime);
          osc.stop(startTime + note.d + 0.25);
        });

        // Warm chord roots and arpeggios in the background
        const chords = [
          { t: 0.0, notes: [98.00, 196.00, 246.94] },  // G
          { t: 2.1, notes: [123.47, 185.00, 293.66] }, // Bm
          { t: 4.4, notes: [130.81, 196.00, 329.63] }, // C
          { t: 6.9, notes: [146.83, 220.00, 369.99] }, // D
          { t: 8.8, notes: [164.81, 196.00, 246.94] }, // Em
          { t: 11.6, notes: [130.81, 196.00, 329.63] }, // C
          { t: 13.4, notes: [146.83, 220.00, 293.66] }, // D
          { t: 14.7, notes: [98.00, 146.83, 196.00] }   // G
        ];

        chords.forEach(chord => {
          chord.notes.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + chord.t + idx * 0.12);

            const startTime = now + chord.t + idx * 0.12;
            const duration = 1.6;

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(0.025 * vol, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx!.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
          });
        });
      } catch (e) {
        console.warn('Idle song error', e);
      }

      if (this.isIdleSongPlaying) {
        this.idleSongTimeout = setTimeout(playCycle, loopDurationMs);
      }
    };

    playCycle();
  }

  public stopIdleSong() {
    this.isIdleSongPlaying = false;
    if (this.idleSongTimeout) {
      clearTimeout(this.idleSongTimeout);
      this.idleSongTimeout = null;
    }
    this.notify();
  }
}

// Export singleton
export const soundManager = new SoundEngine();
