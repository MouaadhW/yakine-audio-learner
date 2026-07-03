import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './Text';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import { useAudio, useAudioPosition } from '@/contexts/AudioContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigations';
import { PauseIcon, PlayIcon, XIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MiniPlayer = () => {
  const { currentLesson, isPlaying, togglePlay, stop } = useAudio();
  const { position, duration } = useAudioPosition();
  const { colors } = useAppSelector(selectTheme);
  const navigation = useNavigation<Nav>();
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  if (!currentLesson) {
    return null;
  }

  const title = isFr ? currentLesson.titleFr : currentLesson.titleEn;
  const progressPercent = duration > 0 ? Math.min((position / duration) * 100, 100) : 0;

  const handlePress = () => {
    navigation.navigate('AudioPlayer', { lesson: currentLesson });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.container, { backgroundColor: colors.cardElevated, borderTopColor: colors.border }]}>
      {/* Progress bar at top edge */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPercent}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.artist, { color: colors.muted }]} numberOfLines={1}>
            🎙️ {currentLesson.teacherName}
          </Text>
        </View>

        <TouchableOpacity
          onPress={e => {
            e.stopPropagation?.();
            togglePlay();
          }}
          style={[styles.playBtn, { backgroundColor: colors.primary + '20' }]}>
          {isPlaying ? (
            <PauseIcon size={18} color={colors.primary} />
          ) : (
            <PlayIcon size={18} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={e => {
            e.stopPropagation?.();
            stop();
          }}
          hitSlop={8}
          style={styles.closeBtn}>
          <XIcon size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0.5,
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  textSection: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    fontSize: 12,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MiniPlayer;
