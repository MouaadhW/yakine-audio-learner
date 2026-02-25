import { PostListItem } from '@/components/blog/PostListItem';
import { Divider, ListDivider } from '@/components/ui/Divider';
import { ErrorView } from '@/components/ui/ErrorView';
import { Loading } from '@/components/ui/Loading';
import { useAppSelector, useResetInfiniteQuery } from '@/lib/hooks';
import { samplePostPage } from '@/lib/mockData';
import { Page, Post } from '@/lib/models';
import { getPosts } from '@/lib/services/BlogApi';
import { RootStackParamList } from '@/navigations';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import React from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { selectTheme } from '../themeSlice';

const PostListScreen = () => {
  const { colors } = useAppSelector(selectTheme);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoadingError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['/content/posts'],
    initialPageParam: 1,
    queryFn: ({ queryKey, pageParam, signal }) => {
      return getPosts({ page: pageParam, limit: 15 }, signal);
    },
    initialData: {
      pages: [samplePostPage],
      pageParams: [1],
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.currentPage === lastPage.totalPage) {
        return undefined;
      }
      return lastPage.currentPage + 1;
    },
  });

  const { resetQuery } = useResetInfiniteQuery<Page<Post>>(['/content/posts']);

  // useEffect(() => {
  //   navigation.setOptions({
  //     headerRight: PostListHeaderRight,
  //   });
  // }, [navigation]);

  const renderItem = (info: ListRenderItemInfo<Post>) => {
    return <PostListItem value={info.item} />;
  };

  const content = () => {
    const pages =
      data?.pages && data.pages.length > 0
        ? data.pages
        : [samplePostPage as Page<Post>];

    if (error && isLoadingError) {
      return (
        <FlatList
          data={samplePostPage.contents}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              colors={[colors.primary]}
              tintColor={colors.primary}
              onRefresh={() => {
                resetQuery();
                refetch();
              }}
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={ListDivider}
          ListHeaderComponent={
            <View style={{ padding: 12 }}>
              <ErrorView
                error={error}
                action={() => {
                  refetch();
                }}
              />
            </View>
          }
        />
      );
    }

    return (
      <FlatList
        data={pages.flatMap(d => d.contents)}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            colors={[colors.primary]}
            tintColor={colors.primary}
            onRefresh={() => {
              resetQuery();
              refetch();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ListDivider}
        ListFooterComponent={
          <>
            {pages.length > 0 && (
              <Divider orientation="horizontal" stroke={0.8} />
            )}
            {isFetchingNextPage && <Loading size={36} />}
            {error && isFetchNextPageError && !isFetchingNextPage && (
              <ErrorView
                error={error}
                action={() => {
                  fetchNextPage();
                }}
              />
            )}
          </>
        }
        onEndReached={info => {
          if (isFetching || !hasNextPage || isFetchNextPageError) {
            return;
          }

          fetchNextPage();
        }}

        // onScroll={evt => {
        //   const ne = evt.nativeEvent;
        //   const offset = ne.contentOffset.y;
        //   const end = ne.contentSize.height - ne.layoutMeasurement.height;
        //   // console.log(scrollOffset.current > offset ? 'down' : 'up');
        //   if (offset > 0 && offset <= end) {
        //     scrollOffset.current = offset;
        //   }
        // }}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Divider orientation="horizontal" stroke={0.5} />
      <View style={styles.container}>{content()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default PostListScreen;
