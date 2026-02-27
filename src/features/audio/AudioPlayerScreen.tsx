import { Text } from '@/components/ui/Text';
import {
  selectAudioPlayer,
  setCurrentLesson,
  setDuration as syncDuration,
  setIsPlaying,
  setIsReady,
  setPosition as syncPosition,
  setSpeed,
} from '@/features/audioPlayerSlice';
import { selectTheme } from '@/features/themeSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { saveProgress } from '@/lib/services/BacApi';
import { RootStackParamList } from '@/navigations';
import Slider from '@react-native-community/slider';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import {
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
  SearchIcon,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type RNTrackPlayer from 'react-native-track-player';

/** Real type from react-native-track-player (type-only import, erased at compile time) */
type TrackPlayerAPI = typeof RNTrackPlayer;

type Props = NativeStackScreenProps<RootStackParamList, 'AudioPlayer'>;

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

const AudioPlayerScreen = ({ route }: Props) => {
  const { lesson } = route.params;
  const { colors } = useAppSelector(selectTheme);
  const { speed } = useAppSelector(selectAudioPlayer);
  const dispatch = useAppDispatch();
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const [isPlayingLocal, setIsPlayingLocal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(lesson.duration);
  const [isTrackPlayerAvailable, setIsTrackPlayerAvailable] = useState(false);
  const trackPlayerRef = useRef<TrackPlayerAPI | null>(null);
  const speedRef = useRef(speed);

  const [searchQuery, setSearchQuery] = useState('');
  const tabAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<'player' | 'script'>('player');

  // Progress saving refs
  const positionRef = useRef(0);
  const durationRef = useRef(lesson.duration);

  const script = isFr ? lesson.scriptFr : lesson.scriptEn;
  const title = isFr ? lesson.titleFr : lesson.titleEn;

  // ── expo-audio hook (always created — used when TrackPlayer unavailable) ──
  const audioSource = lesson.downloadedPath ?? lesson.audioUrl;
  const expoPlayer = useAudioPlayer(audioSource, { updateInterval: 500 });
  const expoStatus = useAudioPlayerStatus(expoPlayer);
  // Whether we're actually using the expo-audio player (vs TrackPlayer)
  const [useExpoAudio, setUseExpoAudio] = useState(false);

  // Keep refs in sync
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Sync position/duration to Redux for the MiniPlayer
  useEffect(() => {
    dispatch(syncPosition(position));
  }, [position, dispatch]);

  useEffect(() => {
    dispatch(syncDuration(duration));
  }, [duration, dispatch]);

  // ── Sync expo-audio status into local state when using expo-audio ──
  useEffect(() => {
    if (!useExpoAudio) return;
    if (expoStatus.isLoaded && isLoading) {
      setIsLoading(false);
      dispatch(setIsReady(true));
    }
    setPosition(expoStatus.currentTime);
    if (expoStatus.duration > 0) {
      setDuration(expoStatus.duration);
    }
    setIsPlayingLocal(expoStatus.playing);
  }, [useExpoAudio, expoStatus, isLoading, dispatch]);

  useEffect(() => {
    const isExpoGoRuntime = () => {
      try {
        const constantsModule = require('expo-constants') as {
          default?: { appOwnership?: string };
          appOwnership?: string;
        };
        const constants = constantsModule.default ?? constantsModule;
        return constants.appOwnership === 'expo';
      } catch {
        return false;
      }
    };

    const loadTrackPlayer = (): TrackPlayerAPI | null => {
      if (isExpoGoRuntime()) {
        return null;
      }

      try {
        const module = require('react-native-track-player') as {
          default?: TrackPlayerAPI;
        };
        return module.default ?? null;
      } catch {
        return null;
      }
    };

    const loadTrack = async () => {
      dispatch(setCurrentLesson(lesson));
      setIsLoading(true);

      const trackPlayer = loadTrackPlayer();

      if (!trackPlayer) {
        // Use expo-audio (already created via hook)
        setIsTrackPlayerAvailable(false);
        setUseExpoAudio(true);
        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: false,
          });

          expoPlayer.playbackRate = speedRef.current;
          expoPlayer.shouldCorrectPitch = true;
          expoPlayer.play();
          setIsPlayingLocal(true);
          dispatch(setIsPlaying(true));
        } catch (error) {
          console.error('Expo Audio load error:', error);
          setIsLoading(false);
          dispatch(setIsReady(false));
          dispatch(setIsPlaying(false));
        }
        return;
      }

      trackPlayerRef.current = trackPlayer;
      setIsTrackPlayerAvailable(true);
      setUseExpoAudio(false);

      try {
        await trackPlayer.reset();
        await trackPlayer.add({
          id: lesson.id,
          url: lesson.downloadedPath ?? lesson.audioUrl,
          title,
          artist: lesson.teacherName,
          duration: lesson.duration,
        });
        await trackPlayer.setRate(speedRef.current);
        dispatch(setIsReady(true));
        await trackPlayer.play();
        setIsPlayingLocal(true);
        setIsLoading(false);
        dispatch(setIsPlaying(true));
      } catch (error) {
        console.error('TrackPlayer load error:', error);
      }
    };

    void loadTrack();

    return () => {
      // Save progress on unmount
      if (positionRef.current > 0) {
        const isCompleted =
          durationRef.current > 0 && positionRef.current / durationRef.current >= 0.9;
        void saveProgress({
          lessonId: lesson.id,
          position: Math.floor(positionRef.current),
          completed: isCompleted,
        });
      }
      if (trackPlayerRef.current) {
        void trackPlayerRef.current.pause();
      }
      // expo-audio player is auto-released by the hook
      if (expoPlayer) {
        expoPlayer.pause();
      }
      setIsPlayingLocal(false);
      dispatch(setIsPlaying(false));
    };
  }, [dispatch, lesson, title]);

  // Periodic progress save (every 15 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (positionRef.current > 0) {
        const isCompleted =
          durationRef.current > 0 && positionRef.current / durationRef.current >= 0.9;
        void saveProgress({
          lessonId: lesson.id,
          position: Math.floor(positionRef.current),
          completed: isCompleted,
        });
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [lesson.id]);

  useEffect(() => {
    if (!trackPlayerRef.current || !isTrackPlayerAvailable) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!trackPlayerRef.current) {
        return;
      }

      void (async () => {
        try {
          const nextPosition = await trackPlayerRef.current!.getPosition();
          const nextDuration = await trackPlayerRef.current!.getDuration();
          setPosition(nextPosition);
          setDuration(nextDuration || lesson.duration);
        } catch {
          // Ignore polling failures.
        }
      })();
    }, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [isTrackPlayerAvailable, lesson.duration]);

  useEffect(() => {
    dispatch(setIsPlaying(isPlayingLocal));
  }, [dispatch, isPlayingLocal]);

  const togglePlay = useCallback(async () => {
    if (useExpoAudio) {
      if (isPlayingLocal) {
        expoPlayer.pause();
      } else {
        expoPlayer.play();
      }
      return;
    }

    const trackPlayer = trackPlayerRef.current;
    if (!trackPlayer) {
      return;
    }

    if (isPlayingLocal) {
      await trackPlayer.pause();
      setIsPlayingLocal(false);
    } else {
      await trackPlayer.play();
      setIsPlayingLocal(true);
    }
  }, [isPlayingLocal, useExpoAudio, expoPlayer]);

  const seekBy = useCallback(
    async (seconds: number) => {
      const pos = Math.max(0, Math.min(position + seconds, duration));
      if (useExpoAudio) {
        expoPlayer.seekTo(pos);
      } else if (trackPlayerRef.current) {
        await trackPlayerRef.current.seekTo(pos);
      }
      setPosition(pos);
    },
    [duration, position, useExpoAudio, expoPlayer],
  );

  const cycleSpeed = useCallback(async () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    if (useExpoAudio) {
      expoPlayer.playbackRate = next;
    } else if (trackPlayerRef.current) {
      await trackPlayerRef.current.setRate(next);
    }
    dispatch(setSpeed(next));
  }, [dispatch, speed, useExpoAudio, expoPlayer]);

  const switchTab = (tab: 'player' | 'script') => {
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === 'player' ? 0 : 1,
      useNativeDriver: false,
    }).start();
  };

  const renderScript = () => {
    if (!searchQuery.trim()) {
      return <Text style={[styles.scriptText, { color: colors.text }]}>{script}</Text>;
    }

    const parts = script.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <Text style={[styles.scriptText, { color: colors.text }]}>
        {parts.map((part, index) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <Text
              key={index}
              style={[styles.highlight, { backgroundColor: `${colors.primary}40` }]}> 
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          ),
        )}
      </Text>
    );
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}> 
        {(['player', 'script'] as const).map(tab => (
          <TouchableOpacity key={tab} style={styles.tab} onPress={() => switchTab(tab)}>
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab ? colors.primary : colors.muted },
              ]}>
              {tab === 'player' ? `🎧 ${isFr ? 'Lecteur' : 'Player'}` : '📄 Script'}
            </Text>
            {activeTab === tab && (
              <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'player' && (
        <View style={styles.playerSection}>
          <View style={styles.trackInfo}>
            <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.teacherName, { color: colors.muted }]}>🎙️ {lesson.teacherName}</Text>
          </View>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration || 1}
              value={position}
              onSlidingComplete={(val: number) => {
                if (useExpoAudio) {
                  expoPlayer.seekTo(val);
                } else if (trackPlayerRef.current) {
                  void trackPlayerRef.current.seekTo(val);
                }
                setPosition(val);
              }}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: colors.muted }]}>{formatTime(position)}</Text>
              <Text style={[styles.timeText, { color: colors.muted }]}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity onPress={() => seekBy(-10)} style={styles.sideBtn}>
              <RotateCcwIcon size={28} color={colors.text} />
              <Text style={[styles.skipLabel, { color: colors.text }]}>10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlay}
              disabled={isLoading}
              style={[styles.playBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}> 
              {isLoading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : isPlayingLocal ? (
                <PauseIcon size={32} color="#fff" fill="#fff" />
              ) : (
                <PlayIcon size={32} color="#fff" fill="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => seekBy(10)} style={styles.sideBtn}>
              <RotateCwIcon size={28} color={colors.text} />
              <Text style={[styles.skipLabel, { color: colors.text }]}>10</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={cycleSpeed}
            style={[
              styles.speedBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.speedText, { color: colors.primary }]}>{speed}x</Text>
          </TouchableOpacity>

          {useExpoAudio && (
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Using Expo audio fallback in Expo Go.
            </Text>
          )}

          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>
      )}

      {activeTab === 'script' && (
        <View style={styles.scriptSection}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <SearchIcon size={16} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={isFr ? 'Rechercher dans le script...' : 'Search in script...'}
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ color: colors.muted }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.scriptScroll}
            contentContainerStyle={styles.scriptContent}
            showsVerticalScrollIndicator={false}>
            {renderScript()}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 14, fontWeight: '600' },
  tabIndicator: { height: 3, width: '60%', borderRadius: 2, marginTop: 4 },
  playerSection: { flex: 1, padding: 24, alignItems: 'center', gap: 20 },
  trackInfo: { alignItems: 'center', gap: 6 },
  trackTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  teacherName: { fontSize: 14 },
  sliderContainer: { width: '100%' },
  slider: { width: '100%', height: 40 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  timeText: { fontSize: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  sideBtn: { alignItems: 'center', gap: 2 },
  skipLabel: { fontSize: 11, fontWeight: '600' },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  speedBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  speedText: { fontSize: 16, fontWeight: '700' },
  progressBar: { width: '100%', height: 4, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  scriptSection: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  scriptScroll: { flex: 1 },
  scriptContent: { padding: 16, paddingBottom: 32 },
  scriptText: { fontSize: 16, lineHeight: 28 },
  highlight: { borderRadius: 3 },
});

export default AudioPlayerScreen;
