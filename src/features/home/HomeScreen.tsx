import { PostRecentItem } from '@/components/blog/PostRecentItem';
import { TopCourseItem } from '@/components/course/TopCourseItem';
import { DefaultStyles } from '@/components/styles';
import { Chip } from '@/components/ui/Chip';
import { ErrorView } from '@/components/ui/ErrorView';
import { Loading } from '@/components/ui/Loading';
import { Spacer } from '@/components/ui/Spacer';
import { Text } from '@/components/ui/Text';
import { useAppSelector } from '@/lib/hooks';
import { sampleCategoryPage, sampleCoursePage, samplePostPage } from '@/lib/mockData';
import { Course, Post } from '@/lib/models';
import { getActiveAnnouncements, Announcement } from '@/lib/services/AdminApi';
import { getPosts } from '@/lib/services/BlogApi';
import { getCategories } from '@/lib/services/CategoryApi';
import { getCourses } from '@/lib/services/CourseApi';
import { BottomTabParamList, RootStackParamList } from '@/navigations';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { SearchIcon, InfoIcon, AlertTriangleIcon, XIcon } from 'lucide-react-native';
import type { PropsWithChildren } from 'react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { selectTheme } from '../themeSlice';

const fetchHomeData = async (signal?: AbortSignal) => {
  const categoriesPromise = getCategories(
    {
      limit: 5,
    },
    signal,
  );

  const topCoursesPromise = getCourses(
    { orderBy: 'enrollment', limit: 5 },
    signal,
  );

  const recentPostsPromise = getPosts(
    {
      orderBy: 'publishedAt',
      limit: 5,
    },
    signal,
  );

  return await Promise.all([
    categoriesPromise,
    topCoursesPromise,
    recentPostsPromise,
  ]);
};

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
  const { t } = useTranslation();
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

  const themeStyle = {
    backgroundColor: colors.background,
  };

  const { data, error, isFetching, isLoadingError, refetch } = useQuery({
    queryKey: ['/content/home'],
    queryFn: ({ signal }) => fetchHomeData(signal),
    placeholderData: [sampleCategoryPage, sampleCoursePage, samplePostPage],
  });

  const renderCourseItem = (info: ListRenderItemInfo<Course>) => {
    return <TopCourseItem value={info.item} />;
  };

  const renderPostItem = (info: ListRenderItemInfo<Post>) => {
    return <PostRecentItem value={info.item} />;
  };

  const listItemSeparator = () => <View style={{ width: 10 }} />;

  const content = () => {
    const homeData = data ?? [sampleCategoryPage, sampleCoursePage, samplePostPage];
    const [homeCategories, homeCourses, homePosts] = homeData;
    const showOfflineNotice = !!error && isLoadingError;

    const categories =
      homeCategories.contents.length > 0 ? homeCategories : sampleCategoryPage;
    const courses =
      homeCourses.contents.length > 0 ? homeCourses : sampleCoursePage;
    const posts = homePosts.contents.length > 0 ? homePosts : samplePostPage;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            colors={[colors.primary]}
            tintColor={colors.primary}
            onRefresh={() => {
              refetch();
            }}
          />
        }>
        <View style={[themeStyle, styles.container]}>
          <Text
            style={{
              ...styles.searchTitle,
              color: colors.text,
            }}>
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
            const BannerIcon =
              ann.type === 'warning' ? AlertTriangleIcon : InfoIcon;
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
                  <Text
                    style={{
                      fontWeight: '600',
                      fontSize: 14,
                      color: tc.fg,
                    }}>
                    {ann.title}
                  </Text>
                  {ann.body ? (
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.text,
                        marginTop: 2,
                      }}>
                      {ann.body}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setDismissedIds(prev => new Set(prev).add(ann.id))
                  }
                  hitSlop={8}>
                  <XIcon size={16} color={colors.muted} />
                </TouchableOpacity>
              </View>
            );
          })}

          {showOfflineNotice && (
            <>
              <Spacer orientation="vertical" spacing={8} />
              <Text style={{ color: colors.muted }}>
                {t('offlineNotice')}
              </Text>
            </>
          )}

          <Spacer orientation="vertical" spacing={10} />

          <TouchableWithoutFeedback
            onPress={() => {
              rootNavigation.navigate('CourseList');
            }}>
            <View
              style={{
                ...styles.searchContainer,
                backgroundColor: colors.inputBackground,
              }}>
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

          <Heading title={t('categories')} seeAll={() => {}} />

          <Spacer orientation="vertical" spacing={12} />

          <View style={styles.categoryContainer}>
            {categories.contents.map((c, i) => {
              return <Chip key={i} title={c.name} onPress={() => {}} />;
            })}
          </View>

          <Spacer orientation="vertical" spacing={24} />

          <Heading
              title={t('topCourses')}
            seeAll={() => {
              rootNavigation.navigate('CourseList');
            }}
          />

          <Spacer orientation="vertical" spacing={12} />

          <FlatList
            data={courses.contents}
            renderItem={renderCourseItem}
            keyExtractor={item => item.id.toString()}
            horizontal={true}
            ItemSeparatorComponent={listItemSeparator}
            showsHorizontalScrollIndicator={false}
          />

          <Spacer orientation="vertical" spacing={24} />

          <Heading
              title={t('recentPosts')}
            seeAll={() => {
              tabNavigation.navigate('Subjects');
            }}
          />

          <Spacer orientation="vertical" spacing={12} />

          <FlatList
            data={posts.contents}
            renderItem={renderPostItem}
            keyExtractor={item => item.id.toString()}
            horizontal={true}
            ItemSeparatorComponent={listItemSeparator}
            showsHorizontalScrollIndicator={false}
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

export default HomeScreen;
