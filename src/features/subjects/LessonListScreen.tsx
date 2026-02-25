import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { BACLesson } from '@/lib/models';
import { downloadLessonAudio } from '@/lib/audio/downloadService';
import { bacLessons } from '@/lib/mockData';
import {
  getAllLessonDownloadMetadata,
  upsertLessonDownloadMetadata,
} from '@/lib/storage/downloadMetadata';
import { RootStackParamList } from '@/navigations';
import { CheckCircleIcon, DownloadIcon, PlayCircleIcon } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonList'>;
const PROGRESS_UPDATE_BUCKETS = 20;

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const LessonListScreen = ({ route, navigation }: Props) => {
  const { chapterId } = route.params;
  const { colors } = useAppSelector(selectTheme);
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [downloadMap, setDownloadMap] = useState(getAllLessonDownloadMetadata());

  const lessons = useMemo(
    () =>
      bacLessons
        .filter(l => l.chapterId === chapterId)
        .map(lesson => {
          const metadata = downloadMap[lesson.id];
          return {
            ...lesson,
            downloadedPath:
              metadata?.status === 'downloaded' ? metadata.localPath : undefined,
            downloadStatus: metadata?.status ?? 'not_downloaded',
            downloadProgress: metadata?.progress ?? 0,
          };
        }),
    [chapterId, downloadMap],
  );

  const updateDownloadState = (
    lessonId: string,
    patch: Parameters<typeof upsertLessonDownloadMetadata>[1],
  ) => {
    setDownloadMap(current => ({
      ...current,
      [lessonId]: upsertLessonDownloadMetadata(lessonId, patch),
    }));
  };

  const handleDownload = async (item: BACLesson) => {
    if (downloadMap[item.id]?.status === 'downloading') {
      return;
    }
    updateDownloadState(item.id, { status: 'downloading', progress: 0 });

    try {
      let lastProgressBucket = 0;
      const task = downloadLessonAudio(item, progress => {
        const nextBucket = Math.floor(progress * PROGRESS_UPDATE_BUCKETS);
        if (nextBucket !== lastProgressBucket || progress >= 1) {
          lastProgressBucket = nextBucket;
          updateDownloadState(item.id, {
            status: 'downloading',
            progress,
          });
        }
      });
      const { localPath } = await task.start();
      updateDownloadState(item.id, {
        status: 'downloaded',
        progress: 1,
        localPath,
      });
    } catch (error) {
      console.error('Lesson download failed', item.id, error);
      updateDownloadState(item.id, {
        status: 'failed',
        progress: 0,
      });
    }
  };

  const getStatusLabel = (item: BACLesson) => {
    if (item.downloadStatus === 'downloaded') {
      return isFr ? 'Téléchargé' : 'Downloaded';
    }
    if (item.downloadStatus === 'downloading') {
      return `${Math.round((item.downloadProgress ?? 0) * 100)}%`;
    }
    if (item.downloadStatus === 'failed') {
      return isFr ? 'Échec' : 'Failed';
    }
    return isFr ? 'En ligne' : 'Online';
  };

  const renderItem = ({ item }: { item: BACLesson }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('AudioPlayer', { lesson: item })}
      activeOpacity={0.7}>
      <View style={styles.cardLeft}>
        {item.completed ? (
          <CheckCircleIcon size={28} color={colors.primary} />
        ) : (
          <PlayCircleIcon size={28} color={colors.primary} />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {isFr ? item.titleFr : item.titleEn}
        </Text>
        <Text style={[styles.meta, { color: 'gray' }]}>
          🎙️ {item.teacherName} • ⏱️ {formatDuration(item.duration)}
        </Text>
        <Text style={[styles.status, { color: colors.primary }]}>
          {getStatusLabel(item)}
        </Text>
        {item.downloadStatus === 'downloading' && (
          <View style={[styles.downloadProgressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.downloadProgressFill,
                {
                  width: `${Math.round((item.downloadProgress ?? 0) * 100)}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.downloadAction}
        onPress={event => {
          event.stopPropagation();
          if (!item.downloadedPath) {
            handleDownload(item);
          }
        }}
        disabled={item.downloadStatus === 'downloading' || !!item.downloadedPath}>
        {item.downloadedPath ? (
          <Text style={styles.downloadBadge}>📥</Text>
        ) : (
          <DownloadIcon
            size={18}
            color={item.downloadStatus === 'downloading' ? 'gray' : colors.primary}
          />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={lessons}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16, backgroundColor: colors.background }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardLeft: { justifyContent: 'center' },
  cardBody: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 12 },
  status: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  downloadProgressTrack: {
    marginTop: 6,
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
  downloadProgressFill: { height: 4, borderRadius: 2 },
  downloadAction: { padding: 6 },
  downloadBadge: { fontSize: 18 },
});

export default LessonListScreen;
