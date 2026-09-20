import { useState, useEffect } from 'react';
import { musicStore, MusicState, PlaylistItem } from '../services/musicStore';

export function useMusic() {
  const [state, setState] = useState<MusicState>(() => musicStore.getState());

  useEffect(() => {
    const unsubscribe = musicStore.subscribe(() => {
      setState({ ...musicStore.getState() });
    });
    return unsubscribe;
  }, []);

  const currentTrack: PlaylistItem = state.playlist[state.currentTrackIndex] || state.playlist[0];

  return {
    ...state,
    currentTrack,
    togglePlay: () => musicStore.togglePlay(),
    setIsPlaying: (playing: boolean) => musicStore.setIsPlaying(playing),
    nextTrack: () => musicStore.nextTrack(),
    prevTrack: () => musicStore.prevTrack(),
    selectTrack: (idx: number) => musicStore.selectTrack(idx),
    selectTrackById: (id: string) => musicStore.selectTrackById(id),
    seekTo: (sec: number) => musicStore.seekTo(sec),
    clearSeekTarget: () => musicStore.clearSeekTarget(),
    setVolume: (vol: number) => musicStore.setVolume(vol),
    toggleMute: () => musicStore.toggleMute(),
    addCustomTrack: (track: Omit<PlaylistItem, 'id' | 'isCustom'>) => musicStore.addCustomTrack(track),
    removeCustomTrack: (id: string) => musicStore.removeCustomTrack(id),
    setProgress: (cur: number, dur?: number) => musicStore.setProgress(cur, dur)
  };
}
