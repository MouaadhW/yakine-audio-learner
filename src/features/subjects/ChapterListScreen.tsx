import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { BACChapter } from '@/lib/models';
import { bacChapters } from '@/lib/mockData';
import { RootStackParamList } from '@/navigations';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'ChapterList'>;

const ChapterListScreen = ({ route, navigation }: Props) => {
  const { subjectId } = route.params;
  const { colors } = useAppSelector(selectTheme);
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const chapters = bacChapters
    .filter(chapter => chapter.subjectId === subjectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const renderItem = ({ item }: { item: BACChapter }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('LessonList', { chapterId: item.id })}
      activeOpacity={0.7}>
      <Text style={[styles.title, { color: colors.text }]}>#{item.sortOrder} {isFr ? item.nameFr : item.nameEn}</Text>
      <Text style={[styles.meta, { color: colors.primary }]}>
        {item.lessons?.length ?? 0} {isFr ? 'leçons' : 'lessons'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={chapters}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
  },
});

export default ChapterListScreen;
