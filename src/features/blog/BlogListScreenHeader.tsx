import type { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { Header, getDefaultHeaderHeight } from '@react-navigation/elements';
import { Chip } from '@/components/ui/Chip';
import { useEffect, useRef } from 'react';
import { Animated, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { selectTheme } from '../themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { getSubjects } from '@/lib/services/BacApi';
import { BACSubject } from '@/lib/models';

interface BlogListScreenHeaderProps {
  headerProps: BottomTabHeaderProps;
}

const BlogListScreenHeader = ({ headerProps }: BlogListScreenHeaderProps) => {
  const insets = useSafeAreaInsets();

  const headerHeight = getDefaultHeaderHeight(
    headerProps.layout,
    false,
    insets.top,
  );

  const { dark, colors } = useAppSelector(selectTheme);

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects(),
    staleTime: 5 * 60 * 1000,
  });

  const marginTop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const collapseHeader = () => {
      Animated.timing(marginTop, {
        toValue: insets.top - headerHeight,
        duration: 300,
        useNativeDriver: false,
      }).start();
    };

    const expandHeader = () => {
      Animated.timing(marginTop, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    };
  }, []);

  return (
    <>
      <Header
        {...headerProps.options}
        title="Subjects"
        headerShadowVisible={false}
        headerStyle={{
          backgroundColor: dark ? colors.card : colors.primary,
        }}
      />
      <View
        style={{
          ...styles.tagContainer,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}>
        <FlatList
          data={subjects ?? []}
          renderItem={({ item }: { item: BACSubject }) => {
            return (
              <Chip
                title={`${item.icon ?? '📚'} ${item.nameEn}`}
                onPress={() => {}}
              />
            );
          }}
          keyExtractor={item => item.id}
          horizontal={true}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            alignItems: 'center',
          }}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  tagContainer: {
    height: 54,
    borderBottomWidth: 0.7,
  },
});

export default BlogListScreenHeader;
