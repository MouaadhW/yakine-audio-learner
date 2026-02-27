import { Text } from '@/components/ui/Text';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppSelector } from '@/lib/hooks';
import { useTranslation } from 'react-i18next';
import { selectTheme } from '../themeSlice';
import { BookOpenIcon, CheckCircleIcon, CircleCheckBigIcon, PlayCircleIcon } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { getProgress } from '@/lib/services/BacApi';
import { ProgressEntry } from '@/lib/models';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigations';
import { enrichLessonWithDownload } from '@/lib/storage/enrichDownload';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) {
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }
  return `${s}s`;
};

const MyCoursesScreen = () => {
  const { colors } = useAppSelector(selectTheme);
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const isFr = i18n.language === 'fr';

  const {
    data: progressList,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['progress'],
    queryFn: ({ signal }) => getProgress(signal),
  });

  const handleResume = (item: ProgressEntry) => {
    const enriched = enrichLessonWithDownload(item.lesson);
    navigation.navigate('AudioPlayer', { lesson: enriched });
  };

  const renderItem = ({ item }: { item: ProgressEntry }) => {
    const title = isFr ? item.lesson.titleFr : item.lesson.titleEn;
    const progressPercent =
      item.lesson.duration > 0
        ? Math.min((item.position / item.lesson.duration) * 100, 100)
        : 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleResume(item)}
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        <View style={styles.cardRow}>
          <View
            style={[
              styles.playIcon,
              {
                backgroundColor: item.completed
                  ? colors.success + '20'
                  : colors.primary + '20',
              },
            ]}>
            {item.completed ? (
              <CircleCheckBigIcon size={24} color={colors.success} />
            ) : (
              <PlayCircleIcon size={24} color={colors.primary} />
            )}
          </View>

          <View style={styles.cardContent}>
            <Text
              style={[styles.cardTitle, { color: colors.text }]}
              numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.cardMeta, { color: colors.muted }]}>
              🎙️ {item.lesson.teacherName}
            </Text>

            <View style={styles.progressRow}>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.border },
                ]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: item.completed
                        ? colors.success
                        : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.muted }]}>
                {item.completed
                  ? t('completed')
                  : `${formatDuration(item.position)} / ${formatDuration(item.lesson.duration)}`}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View
          style={[
            styles.emptyState,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.primary + '14' },
            ]}>
            <BookOpenIcon size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('noProgressYet')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t('startListening')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={progressList ?? []}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          (progressList ?? []).length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          (progressList ?? []).length > 0 ? (
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('continueLearning')}
            </Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 14,
  },
  playIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    minWidth: 70,
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MyCoursesScreen;
