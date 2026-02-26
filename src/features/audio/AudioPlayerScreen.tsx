import { Text } from '@/components/ui/Text';
import {
  selectAudioPlayer,
  setCurrentLesson,
  setIsPlaying,
  setIsReady,
  setSpeed,
} from '@/features/audioPlayerSlice';
import { selectTheme } from '@/features/themeSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { RootStackParamList } from '@/navigations';
import Slider from '@react-native-community/slider';
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

type TrackPlayerLike = {
  reset: () => Promise<void>;
  add: (track: {
    id: string;
    url: string;
    title: string;
    artist: string;
    duration: number;
  }) => Promise<void>;
  setRate: (value: number) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (value: number) => Promise<void>;
  getPosition: () => Promise<number>;
  getDuration: () => Promise<number>;
};

type ExpoAvLike = {
  Audio: {
    setAudioModeAsync: (mode: {
      playsInSilentModeIOS?: boolean;
      staysActiveInBackground?: boolean;
    }) => Promise<void>;
    Sound: {
      createAsync: (
        source: { uri: string },
        initialStatus: {
          shouldPlay?: boolean;
          rate?: number;
          shouldCorrectPitch?: boolean;
          progressUpdateIntervalMillis?: number;
        },
        onPlaybackStatusUpdate?: (status: {
          isLoaded: boolean;
          isPlaying?: boolean;
          positionMillis?: number;
          durationMillis?: number | null;
        }) => void,
      ) => Promise<{ sound: ExpoSoundLike }>;
    };
  };
};

type ExpoSoundLike = {
  pauseAsync: () => Promise<unknown>;
  playAsync: () => Promise<unknown>;
  setPositionAsync: (value: number) => Promise<unknown>;
  setRateAsync: (
    rate: number,
    shouldCorrectPitch: boolean,
  ) => Promise<unknown>;
  unloadAsync: () => Promise<unknown>;
};

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

  const [isPlaying, setIsPlayingLocal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(lesson.duration);
  const [isTrackPlayerAvailable, setIsTrackPlayerAvailable] = useState(false);
  const trackPlayerRef = useRef<TrackPlayerLike | null>(null);
  const expoSoundRef = useRef<ExpoSoundLike | null>(null);
  const speedRef = useRef(speed);

  const [searchQuery, setSearchQuery] = useState('');
  const tabAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<'player' | 'script'>('player');

  const script = isFr ? lesson.scriptFr : lesson.scriptEn;
  const title = isFr ? lesson.titleFr : lesson.titleEn;

  // Keep speedRef in sync so cycleSpeed and initial load use the latest value
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

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

    const loadTrackPlayer = (): TrackPlayerLike | null => {
      if (isExpoGoRuntime()) {
        return null;
      }

      try {
        const module = require('react-native-track-player') as {
          default?: TrackPlayerLike;
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
        setIsTrackPlayerAvailable(false);
        try {
          const expoAv = require('expo-av') as ExpoAvLike;

          await expoAv.Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });

          const { sound } = await expoAv.Audio.Sound.createAsync(
            { uri: lesson.downloadedPath ?? lesson.audioUrl },
            {
              shouldPlay: true,
              rate: speedRef.current,
              shouldCorrectPitch: true,
              progressUpdateIntervalMillis: 500,
            },
            status => {
              if (!status.isLoaded) {
                return;
              }

              setPosition((status.positionMillis ?? 0) / 1000);
              setDuration((status.durationMillis ?? lesson.duration * 1000) / 1000);
              setIsPlayingLocal(status.isPlaying === true);
            },
          );

          expoSoundRef.current = sound;
          setDuration(lesson.duration);
          setPosition(0);
          setIsPlayingLocal(true);
          setIsLoading(false);
          dispatch(setIsReady(true));
          dispatch(setIsPlaying(true));
        } catch (error) {
          console.error('Expo AV load error:', error);
          setDuration(lesson.duration);
          setPosition(0);
          setIsPlayingLocal(false);
          setIsLoading(false);
          dispatch(setIsReady(false));
          dispatch(setIsPlaying(false));
        }
        return;
      }

      trackPlayerRef.current = trackPlayer;
      setIsTrackPlayerAvailable(true);

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
      if (trackPlayerRef.current) {
        void trackPlayerRef.current.pause();
      }
      if (expoSoundRef.current) {
        void expoSoundRef.current.unloadAsync();
        expoSoundRef.current = null;
      }
      setIsPlayingLocal(false);
      dispatch(setIsPlaying(false));
    };
  }, [dispatch, lesson, title]);

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
    dispatch(setIsPlaying(isPlaying));
  }, [dispatch, isPlaying]);

  const togglePlay = useCallback(async () => {
    if (!trackPlayerRef.current && !expoSoundRef.current) {
      return;
    }

    if (expoSoundRef.current) {
      if (isPlaying) {
        await expoSoundRef.current.pauseAsync();
        setIsPlayingLocal(false);
      } else {
        await expoSoundRef.current.playAsync();
        setIsPlayingLocal(true);
      }
      return;
    }

    const trackPlayer = trackPlayerRef.current;
    if (!trackPlayer) {
      return;
    }

    if (isPlaying) {
      await trackPlayer.pause();
      setIsPlayingLocal(false);
    } else {
      await trackPlayer.play();
      setIsPlayingLocal(true);
    }
  }, [isPlaying]);

  const seekBy = useCallback(
    async (seconds: number) => {
      if (!trackPlayerRef.current && !expoSoundRef.current) {
        return;
      }

      const pos = Math.max(0, Math.min(position + seconds, duration));
      if (expoSoundRef.current) {
        await expoSoundRef.current.setPositionAsync(pos * 1000);
      } else if (trackPlayerRef.current) {
        await trackPlayerRef.current.seekTo(pos);
      }
      setPosition(pos);
    },
    [duration, position],
  );

  const cycleSpeed = useCallback(async () => {
    if (!trackPlayerRef.current && !expoSoundRef.current) {
      return;
    }

    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    if (expoSoundRef.current) {
      await expoSoundRef.current.setRateAsync(next, true);
    } else if (trackPlayerRef.current) {
      await trackPlayerRef.current.setRate(next);
    }
    dispatch(setSpeed(next));
  }, [dispatch, speed]);

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
                if (expoSoundRef.current) {
                  void expoSoundRef.current.setPositionAsync(val * 1000);
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
              ) : isPlaying ? (
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

          {!isTrackPlayerAvailable && (
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
