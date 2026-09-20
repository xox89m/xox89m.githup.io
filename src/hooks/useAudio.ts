import { useState, useEffect, useCallback } from 'react';
import { soundManager, AudioTheme } from '../utils/audio';

export function useAudio() {
  const [isMuted, setIsMuted] = useState(soundManager.getIsMuted());
  const [isBgmEnabled, setIsBgmEnabled] = useState(soundManager.getIsBgmEnabled());
  const [sfxVolume, setSfxVolumeState] = useState(soundManager.getSfxVolume());
  const [bgmVolume, setBgmVolumeState] = useState(soundManager.getBgmVolume());
  const [theme, setThemeState] = useState<AudioTheme>(soundManager.getTheme());

  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setIsMuted(soundManager.getIsMuted());
      setIsBgmEnabled(soundManager.getIsBgmEnabled());
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
    sfxVolume,
    bgmVolume,
    theme,
    toggleMute,
    toggleBgm,
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
