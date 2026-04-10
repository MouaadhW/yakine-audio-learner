import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio';
import { AppState, AppStateStatus } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  selectAudioPlayer,
  selectCurrentLesson,
  setCurrentLesson,
  setIsPlaying,
  setPosition as syncPosition,
  setDuration as syncDuration,
  setSpeed,
  setIsReady,
  clearPlayer,
} from '@/features/audioPlayerSlice';
import { saveProgress } from '@/lib/services/BacApi';
import { BACLesson } from '@/lib/models';

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const PROGRESS_SAVE_INTERVAL = 15_000;

// ────────────────────────────────────────────────────────────────
// Context interface
// ────────────────────────────────────────────────────────────────
interface AudioContextType {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether the audio source is loading */
  isLoading: boolean;
  /** Current playback position in seconds */
  position: number;
  /** Total duration in seconds */
  duration: number;
  /** Playback rate */
  speed: number;
  /** The lesson currently loaded (null = nothing loaded) */
  currentLesson: BACLesson | null;
  /** Load a lesson and optionally seek to a resume position */
  loadLesson: (lesson: BACLesson, resumePosition?: number) => void;
  /** Toggle play / pause */
  togglePlay: () => void;
  /** Seek to an absolute position (seconds) */
  seekTo: (position: number) => void;
  /** Seek by a relative delta (e.g. +10 or -10) */
  seekBy: (delta: number) => void;
  /** Cycle to the next playback speed */
  cycleSpeed: () => void;
  /** Stop playback and clear the current lesson */
  stop: () => void;
}

const defaultContext: AudioContextType = {
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  speed: 1.0,
  currentLesson: null,
  loadLesson: () => {},
  togglePlay: () => {},
  seekTo: () => {},
  seekBy: () => {},
  cycleSpeed: () => {},
  stop: () => {},
};

const AudioContext = createContext<AudioContextType>(defaultContext);

export const useAudio = () => useContext(AudioContext);

// ────────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────────
export const AudioProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useAppDispatch();
  const currentLesson = useAppSelector(selectCurrentLesson);
  const { speed } = useAppSelector(selectAudioPlayer);

  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);

  // Refs that survive renders / are readable inside callbacks & intervals
  const speedRef = useRef(speed);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);
  const lastLessonIdRef = useRef<string | null>(null);
  const lastSourceRef = useRef<string | null>(null);
  const shouldAutoPlayRef = useRef(false);

  // The audio source derived from the current lesson stored in Redux
  const source =
    currentLesson?.downloadedPath ?? currentLesson?.audioUrl ?? null;

  // expo-audio hook — persists as long as the Provider is mounted.
  // When `source` changes the hook internally tears down the old player
  // and creates a fresh one for the new URL.
  const player = useAudioPlayer(source as any, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  // ── Keep refs in sync ──────────────────────────────────────────
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // ── Detect new lesson → trigger loading & auto-play ────────────
  useEffect(() => {
    const currentSource =
      currentLesson?.downloadedPath ?? currentLesson?.audioUrl ?? null;

    if (
      currentLesson &&
      (currentLesson.id !== lastLessonIdRef.current ||
        currentSource !== lastSourceRef.current)
    ) {
      lastLessonIdRef.current = currentLesson.id;
      lastSourceRef.current = currentSource;
      setIsLoading(true);
      shouldAutoPlayRef.current = true;
      dispatch(setIsReady(false));
      setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      }).catch(console.error);
    } else if (!currentLesson) {
      lastLessonIdRef.current = null;
      lastSourceRef.current = null;
      setIsLoading(false);
      setPosition(0);
      setDuration(0);
      setIsPlayingLocal(false);
    }
  }, [currentLesson, dispatch]);

  // ── Sync expo-audio status → local + Redux state ───────────────
  useEffect(() => {
    if (!source) return;

    if (status.isLoaded) {
      // First time loaded after source change
      if (isLoading) {
        setIsLoading(false);
        dispatch(setIsReady(true));

        // Apply playback rate
        player.playbackRate = speedRef.current;
        player.shouldCorrectPitch = true;

        // Resume seek
        if (
          pendingSeekRef.current !== null &&
          pendingSeekRef.current > 0
        ) {
          player.seekTo(pendingSeekRef.current);
          setPosition(pendingSeekRef.current);
          pendingSeekRef.current = null;
        }

        // Auto-play
        if (shouldAutoPlayRef.current) {
          player.play();
          shouldAutoPlayRef.current = false;
        }
      }

      setPosition(status.currentTime);
      dispatch(syncPosition(status.currentTime));

      if (status.duration > 0) {
        setDuration(status.duration);
        dispatch(syncDuration(status.duration));
      }

      setIsPlayingLocal(status.playing);
      dispatch(setIsPlaying(status.playing));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, status]);

  // ── Periodic progress save (every 15 s) ────────────────────────
  useEffect(() => {
    if (!currentLesson) return;

    const intervalId = setInterval(() => {
      if (positionRef.current > 0) {
        const isCompleted =
          durationRef.current > 0 &&
          positionRef.current / durationRef.current >= 0.9;
        void saveProgress({
          lessonId: currentLesson.id,
          position: Math.floor(positionRef.current),
          completed: isCompleted,
        });
      }
    }, PROGRESS_SAVE_INTERVAL);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson?.id]);

  // ── Save progress when app backgrounds ─────────────────────────
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (
        nextState === 'background' &&
        currentLesson &&
        positionRef.current > 0
      ) {
        const isCompleted =
          durationRef.current > 0 &&
          positionRef.current / durationRef.current >= 0.9;
        void saveProgress({
          lessonId: currentLesson.id,
          position: Math.floor(positionRef.current),
          completed: isCompleted,
        });
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [currentLesson]);

  // ── Actions ────────────────────────────────────────────────────
  const loadLesson = useCallback(
    (lesson: BACLesson, resumePosition?: number) => {
      // Save current lesson's progress before switching
      if (
        currentLesson &&
        currentLesson.id !== lesson.id &&
        positionRef.current > 0
      ) {
        const isCompleted =
          durationRef.current > 0 &&
          positionRef.current / durationRef.current >= 0.9;
        void saveProgress({
          lessonId: currentLesson.id,
          position: Math.floor(positionRef.current),
          completed: isCompleted,
        });
      }

      pendingSeekRef.current = resumePosition ?? null;
      dispatch(setCurrentLesson(lesson));
    },
    [currentLesson, dispatch],
  );

  const togglePlay = useCallback(() => {
    if (!source) return;
    if (isPlayingLocal) {
      player.pause();
    } else {
      player.play();
    }
  }, [source, isPlayingLocal, player]);

  const seekTo = useCallback(
    (pos: number) => {
      if (!source) return;
      const clamped = Math.max(0, Math.min(pos, durationRef.current));
      player.seekTo(clamped);
      setPosition(clamped);
    },
    [source, player],
  );

  const seekBy = useCallback(
    (delta: number) => {
      seekTo(positionRef.current + delta);
    },
    [seekTo],
  );

  const cycleSpeed = useCallback(() => {
    const idx = SPEEDS.indexOf(speedRef.current);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    player.playbackRate = next;
    dispatch(setSpeed(next));
  }, [player, dispatch]);

  const stop = useCallback(() => {
    if (currentLesson && positionRef.current > 0) {
      const isCompleted =
        durationRef.current > 0 &&
        positionRef.current / durationRef.current >= 0.9;
      void saveProgress({
        lessonId: currentLesson.id,
        position: Math.floor(positionRef.current),
        completed: isCompleted,
      });
    }
    player.pause();
    dispatch(clearPlayer());
    lastLessonIdRef.current = null;
    lastSourceRef.current = null;
  }, [currentLesson, player, dispatch]);

  // ── Memoised context value ─────────────────────────────────────
  const contextValue = useMemo<AudioContextType>(
    () => ({
      isPlaying: isPlayingLocal,
      isLoading,
      position,
      duration,
      speed,
      currentLesson,
      loadLesson,
      togglePlay,
      seekTo,
      seekBy,
      cycleSpeed,
      stop,
    }),
    [
      isPlayingLocal,
      isLoading,
      position,
      duration,
      speed,
      currentLesson,
      loadLesson,
      togglePlay,
      seekTo,
      seekBy,
      cycleSpeed,
      stop,
    ],
  );

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};
