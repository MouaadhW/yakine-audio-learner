import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { Course } from '@/lib/models';
import { uppercaseFirstChar } from '@/lib/utils';
import { RootStackParamList } from '@/navigations';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChartNoAxesColumnIncreasingIcon, ImageIcon, StarIcon } from 'lucide-react-native';
import { Dimensions, StyleSheet, TouchableHighlight, View } from 'react-native';
import { dirRow } from '@/lib/rtl';
import { DefaultStyles } from '../styles';
import { Spacer } from '../ui/Spacer';
import { Text } from '../ui/Text';
import { CustomImage } from '../ui/CustomImage';

interface TopCourseItemProps {
  value: Course;
}

const screen = Dimensions.get('screen');

export const TopCourseItem = ({ value }: TopCourseItemProps) => {
  const { colors } = useAppSelector(selectTheme);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <TouchableHighlight
      style={{ borderRadius: styles.container.borderRadius, flex: 1 }}
      underlayColor={colors.highlight}
      onPress={() => {
        navigation.navigate('CourseDetail', { slug: value.slug });
      }}>
      <View
        style={{
          ...styles.container,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}>
        {value.cover ? (
          <CustomImage
            source={{ uri: value.cover }}
            style={[styles.cover, { backgroundColor: colors.default }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cover, styles.placeholderCover, { backgroundColor: colors.default }]}>
            <ImageIcon size={28} color={colors.muted} />
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text style={{ ...styles.category, color: colors.primary }}>
            {value.category?.name}
          </Text>
          <Spacer orientation="vertical" spacing={4} />
          <Text numberOfLines={2} style={{ ...styles.title }}>
            {value.title}
          </Text>

          <Spacer orientation="vertical" spacing={16} />

          <View style={{ flex: 1 }} />

          <View style={styles.footerContainer}>
            <View style={styles.footerItem}>
              <StarIcon color="#ffb703" fill="#ffb703" size={16} />
              <Text style={styles.footerText}>
                {value.meta?.rating ?? '0.0'}
              </Text>
            </View>
            <View style={styles.footerItem}>
              <ChartNoAxesColumnIncreasingIcon color={colors.muted} size={16} />
              <Text style={[styles.footerText, { color: colors.muted }]}>
                {uppercaseFirstChar(value.level)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: dirRow(),
    padding: 10,
    gap: 12,
    borderRadius: DefaultStyles.values.borderRadius,
    borderWidth: 0.7,
    width: screen.width - 80,
  },
  cover: {
    aspectRatio: 4 / 3,
    borderRadius: DefaultStyles.values.borderRadius,
    width: 120,
  },
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    ...DefaultStyles.fonts.semiBold,
  },
  category: {
    fontSize: 12,
    ...DefaultStyles.fonts.medium,
  },
  footerContainer: {
    flexDirection: dirRow(),
    gap: 10,
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: dirRow(),
    gap: 4,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    ...DefaultStyles.fonts.regular,
  },
});
