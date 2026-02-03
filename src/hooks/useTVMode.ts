import { useState, useEffect, useCallback, useMemo } from 'react';
import { TVScene, DEFAULT_TV_SCENES } from '@/types/tvMode';

interface UseTVModeReturn {
  scenes: TVScene[];
  currentSceneIndex: number;
  currentScene: TVScene;
  isPlaying: boolean;
  remainingSeconds: number;
  play: () => void;
  pause: () => void;
  nextScene: () => void;
  previousScene: () => void;
  goToScene: (index: number) => void;
  setScenes: (scenes: TVScene[]) => void;
}

export function useTVMode(): UseTVModeReturn {
  const [scenes, setScenes] = useState<TVScene[]>(DEFAULT_TV_SCENES);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const currentScene = useMemo(() => {
    return scenes[currentSceneIndex] || scenes[0];
  }, [scenes, currentSceneIndex]);

  // Initialize remaining seconds when scene changes
  useEffect(() => {
    setRemainingSeconds(currentScene.duracaoSegundos);
  }, [currentScene.duracaoSegundos, currentSceneIndex]);

  // Timer countdown
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Move to next scene
          setCurrentSceneIndex((idx) => (idx + 1) % scenes.length);
          return scenes[(currentSceneIndex + 1) % scenes.length]?.duracaoSegundos || 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, scenes, currentSceneIndex]);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const nextScene = useCallback(() => {
    setCurrentSceneIndex((idx) => (idx + 1) % scenes.length);
  }, [scenes.length]);

  const previousScene = useCallback(() => {
    setCurrentSceneIndex((idx) => (idx - 1 + scenes.length) % scenes.length);
  }, [scenes.length]);

  const goToScene = useCallback((index: number) => {
    if (index >= 0 && index < scenes.length) {
      setCurrentSceneIndex(index);
    }
  }, [scenes.length]);

  return {
    scenes,
    currentSceneIndex,
    currentScene,
    isPlaying,
    remainingSeconds,
    play,
    pause,
    nextScene,
    previousScene,
    goToScene,
    setScenes,
  };
}
