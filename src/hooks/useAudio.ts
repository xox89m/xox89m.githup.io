import { useState, useEffect, useCallback } from 'react';
import { soundManager, AudioTheme } from '../utils/audio';

export function useAudio() {
  const [isMuted, setIsMuted] = useState(soundManager.getIsMuted());
  const [isBgmEnabled, setIsBgmEnabled] = useState(soundManager.getIsBgmEnabled());
  const [isIdleSongEnabled, setIsIdleSongEnabled] = useState(soundManager.getIsIdleSongEnabled());
  const [isIdleSongPlaying, setIsIdleSongPlaying] = useState(soundManager.getIsIdleSongPlaying());
  const [sfxVolume, setSfxVolumeState] = useState(soundManager.getSfxVolume());
  const [bgmVolume, setBgmVolumeState] = useState(soundManager.getBgmVolume());
  const [theme, setThemeState] = useState<AudioTheme>(soundManager.getTheme());

  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setIsMuted(soundManager.getIsMuted());
      setIsBgmEnabled(soundManager.getIsBgmEnabled());
      setIsIdleSongEnabled(soundManager.getIsIdleSongEnabled());
      setIsIdleSongPlaying(soundManager.getIsIdleSongPlaying());
      setSfxVolumeState(soundManager.getSfxVolume());
      setBgmVolumeState(soundManager.getBgmVolume());
      setThemeState(soundManager.getTheme());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const toggleMute = useCallback(() => {
    return soundManager.toggleMute();
  }, []);

  const toggleBgm = useCallback(() => {
    return soundManager.toggleBgm();
  }, []);

  const toggleIdleSong = useCallback(() => {
    return soundManager.toggleIdleSong();
  }, []);

  const startIdleSong = useCallback(() => {
    soundManager.startIdleSong();
  }, []);

  const stopIdleSong = useCallback(() => {
    soundManager.stopIdleSong();
  }, []);

  const setSfxVolume = useCallback((vol: number) => {
    soundManager.setSfxVolume(vol);
  }, []);

  const setBgmVolume = useCallback((vol: number) => {
    soundManager.setBgmVolume(vol);
  }, []);

  const setTheme = useCallback((newTheme: AudioTheme) => {
    soundManager.setTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    return soundManager.toggleTheme();
  }, []);

  return {
    isMuted,
    isBgmEnabled,
    isIdleSongEnabled,
    isIdleSongPlaying,
    sfxVolume,
    bgmVolume,
    theme,
    toggleMute,
    toggleBgm,
    toggleIdleSong,
    startIdleSong,
    stopIdleSong,
    setSfxVolume,
    setBgmVolume,
    setTheme,
    toggleTheme,
    // Play sound methods
    playClick: () => soundManager.playClick(),
    playCorrect: () => soundManager.playCorrect(),
    playWrong: () => soundManager.playWrong(),
    playCombo: (c: number) => soundManager.playCombo(c),
    playTick: (urgent?: boolean) => soundManager.playTick(urgent),
    playLifeline: () => soundManager.playLifeline(),
    playElementSound: (atomicNumber: number) => soundManager.playElementSound(atomicNumber),
    playVictory: () => soundManager.playVictory(),
    playMatchSuccess: () => soundManager.playMatchSuccess(),
    playBattleStart: () => soundManager.playBattleStart(),
    playThemeSwitch: (toTheme: AudioTheme) => soundManager.playThemeSwitch(toTheme)
  };
}
