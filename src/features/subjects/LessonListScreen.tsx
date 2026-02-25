import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { BACLesson } from '@/lib/models';
import { bacLessons } from '@/lib/mockData';
import { RootStackParamList } from '@/navigations';
import { CheckCircleIcon, PlayCircleIcon } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonList'>;

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

  const lessons = bacLessons.filter(l => l.chapterId === chapterId);

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
      </View>
      {item.downloadedPath && <Text style={styles.downloadBadge}>📥</Text>}
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
  downloadBadge: { fontSize: 18 },
});

export default LessonListScreen;
