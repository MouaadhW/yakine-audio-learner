import { DefaultStyles } from '@/components/styles';
import { Chip } from '@/components/ui/Chip';
import { Spacer } from '@/components/ui/Spacer';
import { Text } from '@/components/ui/Text';
import { useAppSelector } from '@/lib/hooks';
import { BACSubject, BACLesson } from '@/lib/models';
import { getActiveAnnouncements } from '@/lib/services/AdminApi';
import { getSubjects } from '@/lib/services/BacApi';
import { makeApiRequest } from '@/lib/makeApiRequest';
import { validateApiResponse } from '@/lib/validateApiResponse';
import { QuizApi } from '@/lib/services/QuizApi';
import { GamificationApi } from '@/lib/services/GamificationApi';
import { BottomTabParamList, RootStackParamList } from '@/navigations';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  SearchIcon,
  InfoIcon,
  AlertTriangleIcon,
  XIcon,
  BookOpenIcon,
  HeadphonesIcon,
  ClockIcon,
  LockIcon,
} from 'lucide-react-native';
import type { PropsWithChildren } from 'react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { selectAuthUser } from '@/features/auth/authSlice';
import { selectTheme } from '../themeSlice';

const screen = Dimensions.get('window');

/** Fetch recent lessons from the backend */
async function fetchRecentLessons(signal?: AbortSignal): Promise<BACLesson[]> {
  const resp = await makeApiRequest({
    url: '/api/lessons?limit=6&status=PUBLISHED',
    options: { signal },
  });
  await validateApiResponse(resp);
  const page = await resp.json();
  return (page.contents ?? []) as BACLesson[];
}

type HeadingProps = PropsWithChildren<{
  title: string;
  seeAll?: () => void;
}>;

const Heading = ({ title, seeAll }: HeadingProps) => {
  const { colors } = useAppSelector(selectTheme);
  const { t } = useTranslation();

  return (
    <View style={styles.headingContainer}>
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            ...styles.headingTitle,
            color: colors.text,
          }}>
          {title}
        </Text>
      </View>
      {seeAll && (
        <TouchableOpacity activeOpacity={0.5} onPress={seeAll}>
          <Text
            style={{
              color: colors.primary,
              ...DefaultStyles.fonts.medium,
            }}>
            {t('seeAll')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const HomeScreen = () => {
  const { colors } = useAppSelector(selectTheme);
  const user = useAppSelector(selectAuthUser);
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const tabNavigation =
    useNavigation<BottomTabNavigationProp<BottomTabParamList>>();

  const { data: announcements } = useQuery({
    queryKey: ['/announcements/active'],
    queryFn: () => getActiveAnnouncements(),
    staleTime: 5 * 60 * 1000,
  });

  const visibleAnnouncements = (announcements ?? []).filter(
    a => !dismissedIds.has(a.id),
  );

  const {
    data: subjects,
    error: subjectsError,
    isFetching: subjectsFetching,
    refetch: refetchSubjects,
  } = useQuery({
    queryKey: ['subjects'],
    queryFn: ({ signal }) => getSubjects(signal),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: recentLessons,
    isFetching: lessonsFetching,
    refetch: refetchLessons,
  } = useQuery({
    queryKey: ['recent-lessons'],
    queryFn: ({ signal }) => fetchRecentLessons(signal),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: resurfaceLessons,
    isFetching: resurfaceFetching,
    refetch: refetchResurface,
  } = useQuery({
    queryKey: ['resurface-lessons'],
    queryFn: () => QuizApi.getResurfaceLessons(),
    staleTime: 60 * 1000,
  });

  const {
    data: gamificationStats,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: () => GamificationApi.getMyStats(),
    staleTime: 60 * 1000,
  });

  const isFetching = subjectsFetching || lessonsFetching || resurfaceFetching || statsFetching;

  const categoryChips = useMemo(() => (subjects ?? []).slice(0, 4), [subjects]);

  const recentLessonsForHome = useMemo(() => {
    const list = recentLessons ?? [];
    if (
      user?.role === 'STUDENT' &&
      user.subscriptionTier !== 'PREMIUM'
    ) {
      return list.filter(l => !l.locked);
    }
    return list;
  }, [recentLessons, user]);

  const handleRefresh = () => {
    refetchSubjects();
    refetchLessons();
    refetchResurface();
    refetchStats();
  };

  const themeStyle = { backgroundColor: colors.background };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderSubjectCard = ({ item }: { item: BACSubject }) => (
    <TouchableOpacity
      style={[
        homeStyles.subjectCard,
        { backgroundColor: (item.color ?? colors.primary) + '14', borderColor: (item.color ?? colors.primary) + '30' },
      ]}
      activeOpacity={0.7}
      onPress={() => rootNavigation.navigate('ChapterList', { subjectId: item.id })}>
      <Text style={homeStyles.subjectIcon}>{item.icon ?? '📚'}</Text>
      <Text style={[homeStyles.subjectName, { color: colors.text }]} numberOfLines={1}>
        {isFr ? item.nameFr : item.nameEn}
      </Text>
      <Text style={[homeStyles.subjectMeta, { color: colors.muted }]}>
        {item.chapterCount ?? 0} {t('chapters') ?? 'chapters'}
      </Text>
    </TouchableOpacity>
  );

  const renderLessonCard = ({ item }: { item: BACLesson }) => {
    const locked = !!item.locked;
    return (
      <TouchableOpacity
        style={[
          homeStyles.lessonCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: locked ? 0.92 : 1,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          if (locked) {
            Alert.alert(
              isFr ? 'Contenu Premium' : 'Premium',
              isFr
                ? 'Cette lecon est reservee aux abonnes Premium.'
                : 'This lesson is for Premium subscribers.',
            );
            return;
          }
          rootNavigation.navigate('AudioPlayer', { lesson: item });
        }}>
        <View
          style={[
            homeStyles.lessonIconCircle,
            {
              backgroundColor: locked ? colors.muted + '22' : colors.primary + '18',
            },
          ]}>
          {locked ? (
            <LockIcon size={20} color={colors.muted} />
          ) : (
            <HeadphonesIcon size={20} color={colors.primary} />
          )}
        </View>
        <Text style={[homeStyles.lessonTitle, { color: colors.text }]} numberOfLines={2}>
          {isFr ? item.titleFr : item.titleEn}
        </Text>
        {locked ? (
          <View style={homeStyles.premiumPill}>
            <Text style={homeStyles.premiumPillText}>Premium</Text>
          </View>
        ) : null}
        <View style={homeStyles.lessonFooter}>
          <ClockIcon size={12} color={colors.muted} />
          <Text style={[homeStyles.lessonDuration, { color: colors.muted }]}>
            {formatDuration(item.duration)}
          </Text>
        </View>
        {item.teacherName ? (
          <Text style={[homeStyles.lessonTeacher, { color: colors.muted }]} numberOfLines={1}>
            🎙️ {item.teacherName}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const listItemSeparator = () => <View style={{ width: 10 }} />;

  const content = () => {
    const showOfflineNotice = !!subjectsError;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            colors={[colors.primary]}
            tintColor={colors.primary}
            onRefresh={handleRefresh}
          />
        }>
        <View style={[themeStyle, styles.container]}>
          {gamificationStats && (
            <View style={styles.gamificationHeader}>
              <TouchableOpacity style={styles.gamificationBadge} onPress={() => rootNavigation.navigate('Leaderboard')}>
                <Text style={styles.gamificationIcon}>🔥</Text>
                <Text style={[styles.gamificationText, { color: colors.text }]}>{gamificationStats.currentStreak} Streak</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gamificationBadge} onPress={() => rootNavigation.navigate('Leaderboard')}>
                <Text style={styles.gamificationIcon}>⭐</Text>
                <Text style={[styles.gamificationText, { color: colors.text }]}>{gamificationStats.xp} XP</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={{ ...styles.searchTitle, color: colors.text }}>
            {t('whatDoYouWantToLearn')}
          </Text>

          {/* ─── Announcement Banners ─── */}
          {visibleAnnouncements.map(ann => {
            const typeColors: Record<string, { bg: string; fg: string }> = {
              info: { bg: '#3b82f620', fg: '#3b82f6' },
              warning: { bg: '#f59e0b20', fg: '#f59e0b' },
              success: { bg: '#22c55e20', fg: '#22c55e' },
              error: { bg: '#ef444420', fg: '#ef4444' },
            };
            const tc = typeColors[ann.type] ?? typeColors.info;
            const BannerIcon = ann.type === 'warning' ? AlertTriangleIcon : InfoIcon;
            return (
              <View
                key={ann.id}
                style={{
                  backgroundColor: tc.bg,
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                }}>
                <BannerIcon size={18} color={tc.fg} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: tc.fg }}>
                    {ann.title}
                  </Text>
                  {ann.body ? (
                    <Text style={{ fontSize: 13, color: colors.text, marginTop: 2 }}>
                      {ann.body}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => setDismissedIds(prev => new Set(prev).add(ann.id))}
                  hitSlop={8}>
                  <XIcon size={16} color={colors.muted} />
                </TouchableOpacity>
              </View>
            );
          })}

          {showOfflineNotice && (
            <>
              <Spacer orientation="vertical" spacing={8} />
              <Text style={{ color: colors.muted }}>{t('offlineNotice')}</Text>
            </>
          )}

          <Spacer orientation="vertical" spacing={10} />

          <TouchableWithoutFeedback
            onPress={() => rootNavigation.navigate('SubjectList')}>
            <View style={{ ...styles.searchContainer, backgroundColor: colors.inputBackground }}>
              <SearchIcon color={colors.muted} />
              <TextInput
                style={{ ...styles.searchInput, color: colors.text }}
                placeholderTextColor={colors.muted}
                placeholder={t('browseCourses')}
                readOnly
                pointerEvents="none"
              />
            </View>
          </TouchableWithoutFeedback>

          <Spacer orientation="vertical" spacing={24} />

          {/* ─── Subjects (Categories) ─── */}
          <Heading title={t('categories')} seeAll={() => rootNavigation.navigate('SubjectList')} />
          <Spacer orientation="vertical" spacing={12} />
          <View style={styles.categoryContainer}>
            {categoryChips.map(s => (
              <Chip
                key={s.id}
                title={`${s.icon ?? '📚'} ${isFr ? s.nameFr : s.nameEn}`}
                onPress={() => rootNavigation.navigate('ChapterList', { subjectId: s.id })}
              />
            ))}
          </View>

          <Spacer orientation="vertical" spacing={24} />

          {/* ─── Subjects Cards ─── */}
          <Heading
            title={t('topCourses')}
            seeAll={() => rootNavigation.navigate('SubjectList')}
          />
          <Spacer orientation="vertical" spacing={12} />
          <FlatList
            data={subjects ?? []}
            renderItem={renderSubjectCard}
            keyExtractor={item => item.id}
            horizontal
            ItemSeparatorComponent={listItemSeparator}
            showsHorizontalScrollIndicator={false}
          />

          <Spacer orientation="vertical" spacing={24} />

          {/* ─── Review Suggested (Spaced Repetition) ─── */}
          {resurfaceLessons && resurfaceLessons.length > 0 && (
            <>
              <Heading
                title={t('reviewSuggested') || 'Review Suggested'}
              />
              <Spacer orientation="vertical" spacing={12} />
              <FlatList
                data={resurfaceLessons}
                renderItem={({ item }) => renderLessonCard({ item: item.lesson as BACLesson })}
                keyExtractor={item => item.lessonId}
                horizontal
                ItemSeparatorComponent={listItemSeparator}
                showsHorizontalScrollIndicator={false}
              />
              <Spacer orientation="vertical" spacing={24} />
            </>
          )}

          {/* ─── Recent Lessons ─── */}
          <Heading
            title={t('recentPosts')}
            seeAll={() => tabNavigation.navigate('Subjects')}
          />
          <Spacer orientation="vertical" spacing={12} />
          <FlatList
            data={recentLessonsForHome}
            renderItem={renderLessonCard}
            keyExtractor={item => item.id}
            horizontal
            ItemSeparatorComponent={listItemSeparator}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {t('noLessonsYet') ?? 'No lessons yet'}
              </Text>
            }
          />
        </View>
      </ScrollView>
    );
  };

  return <View style={styles.root}>{content()}</View>;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    padding: 16,
    paddingBottom: 32,
  },
  headingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  headingTitle: {
    fontSize: 18,
    ...DefaultStyles.fonts.semiBold,
  },
  searchTitle: {
    fontSize: 24,
    ...DefaultStyles.fonts.semiBold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 23,
    paddingHorizontal: 16,
    height: 46,
  },
  searchInput: {
    flex: 1,
    ...DefaultStyles.fonts.regular,
  },
  categoryContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});

const homeStyles = StyleSheet.create({
  subjectCard: {
    width: screen.width * 0.38,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  subjectIcon: { fontSize: 28 },
  subjectName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  subjectMeta: { fontSize: 12 },
  lessonCard: {
    width: screen.width * 0.56,
    borderRadius: 14,
    borderWidth: 0.7,
    padding: 14,
    gap: 6,
  },
  lessonIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonTitle: { fontSize: 14, fontWeight: '600' },
  premiumPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#a855f728',
  },
  premiumPillText: { fontSize: 10, fontWeight: '700', color: '#a855f7', letterSpacing: 0.3 },
  lessonFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lessonDuration: { fontSize: 12 },
  lessonTeacher: { fontSize: 11, marginTop: 2 },
  gamificationHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 8,
  },
  gamificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0000000A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  gamificationIcon: {
    fontSize: 16,
  },
  gamificationText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default HomeScreen;
