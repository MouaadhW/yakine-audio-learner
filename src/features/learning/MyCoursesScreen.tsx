import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAppSelector } from '@/lib/hooks';
import { useTranslation } from 'react-i18next';
import { selectTheme } from '../themeSlice';

const MyCoursesScreen = () => {
  const { colors } = useAppSelector(selectTheme);
  const { t } = useTranslation();

  return (
    <>
      <Divider orientation="horizontal" stroke={0.5} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic">
        <View style={styles.container}>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            {t('noEnrolledCourses')}
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default MyCoursesScreen;
