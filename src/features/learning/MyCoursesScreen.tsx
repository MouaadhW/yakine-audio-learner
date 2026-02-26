import { Text } from '@/components/ui/Text';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAppSelector } from '@/lib/hooks';
import { useTranslation } from 'react-i18next';
import { selectTheme } from '../themeSlice';
import { BookOpenIcon } from 'react-native-heroicons/outline';

const MyCoursesScreen = () => {
  const { colors } = useAppSelector(selectTheme);
  const { t } = useTranslation();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic">
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
          <Text
            style={[
              styles.emptyTitle,
              { color: colors.text },
            ]}>
            {t('noEnrolledCourses')}
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: colors.textSecondary },
            ]}>
            {t('browseCourses')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
