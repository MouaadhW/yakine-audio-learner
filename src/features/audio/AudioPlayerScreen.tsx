import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { getProgress } from '@/lib/services/BacApi';
import { useAudio } from '@/contexts/AudioContext';
import { RootStackParamList } from '@/navigations';
import Slider from '@react-native-community/slider';
import {
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
  SearchIcon,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'AudioPlayer'>;

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
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  // ── Global audio context (persistent across screens) ──
  const {
    isPlaying,
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
  } = useAudio();

  // ── Local UI state ──
  const [searchQuery, setSearchQuery] = useState('');
  const tabAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<'player' | 'script'>('player');

  const script = isFr ? lesson.scriptFr : lesson.scriptEn;
  const title = isFr ? lesson.titleFr : lesson.titleEn;

  // ── Load lesson on mount (with resume position from saved progress) ──
  useEffect(() => {
    // Only load if it's a different lesson than what's currently playing
    if (!currentLesson || currentLesson.id !== lesson.id) {
      const fetchAndLoad = async () => {
        try {
          const progress = await getProgress();
          const entry = progress.find(p => p.lessonId === lesson.id);
          const resumePos =
            entry && !entry.completed ? entry.position : 0;
          loadLesson(lesson, resumePos);
        } catch {
          // Couldn't fetch progress — just start from beginning
          loadLesson(lesson, 0);
        }
      };
      void fetchAndLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  // ── Tab switching ──
  const switchTab = (tab: 'player' | 'script') => {
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === 'player' ? 0 : 1,
      useNativeDriver: false,
    }).start();
  };

  // ── Script search / highlight ──
  const renderScript = () => {
    if (!searchQuery.trim()) {
      return (
        <Text style={[styles.scriptText, { color: colors.text }]}>
          {script}
        </Text>
      );
    }

    const parts = script.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <Text style={[styles.scriptText, { color: colors.text }]}>
        {parts.map((part, index) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <Text
              key={index}
              style={[
                styles.highlight,
                { backgroundColor: `${colors.primary}40` },
              ]}>
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
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => switchTab(tab)}>
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === tab ? colors.primary : colors.muted,
                },
              ]}>
              {tab === 'player'
                ? `🎧 ${isFr ? 'Lecteur' : 'Player'}`
                : '📄 Script'}
            </Text>
            {activeTab === tab && (
              <View
                style={[
                  styles.tabIndicator,
                  { backgroundColor: colors.primary },
                ]}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'player' && (
        <View style={styles.playerSection}>
          <View style={styles.trackInfo}>
            <Text
              style={[styles.trackTitle, { color: colors.text }]}
              numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.teacherName, { color: colors.muted }]}>
              🎙️ {lesson.teacherName}
            </Text>
          </View>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration || 1}
              value={position}
              onSlidingComplete={(val: number) => seekTo(val)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: colors.muted }]}>
                {formatTime(position)}
              </Text>
              <Text style={[styles.timeText, { color: colors.muted }]}>
                {formatTime(duration)}
              </Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => seekBy(-10)}
              style={styles.sideBtn}>
              <RotateCcwIcon size={28} color={colors.text} />
              <Text style={[styles.skipLabel, { color: colors.text }]}>
                10
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlay}
              disabled={isLoading}
              style={[
                styles.playBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : isPlaying ? (
                <PauseIcon size={32} color="#fff" fill="#fff" />
              ) : (
                <PlayIcon size={32} color="#fff" fill="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => seekBy(10)}
              style={styles.sideBtn}>
              <RotateCwIcon size={28} color={colors.text} />
              <Text style={[styles.skipLabel, { color: colors.text }]}>
                10
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={cycleSpeed}
            style={[
              styles.speedBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            <Text style={[styles.speedText, { color: colors.primary }]}>
              {speed}x
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.border },
            ]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: colors.primary,
                },
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
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            <SearchIcon size={16} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={
                isFr
                  ? 'Rechercher dans le script...'
                  : 'Search in script...'
              }
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
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
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
