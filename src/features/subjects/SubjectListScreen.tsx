import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { BACSubject } from '@/lib/models';
import { bacSubjects } from '@/lib/mockData';
import { RootStackParamList } from '@/navigations';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SubjectCard = ({ item }: { item: BACSubject }) => {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppSelector(selectTheme);
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: `${item.color ?? colors.primary}20`,
          borderColor: item.color ?? colors.primary,
        },
      ]}
      onPress={() => navigation.navigate('ChapterList', { subjectId: item.id })}
      activeOpacity={0.7}>
      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={[styles.name, { color: colors.text }]}>
        {isFr ? item.nameFr : item.nameEn}
      </Text>
      <Text style={[styles.chapters, { color: colors.primary }]}>
        {item.chapters?.length ?? 0} {isFr ? 'chapitres' : 'chapters'}
      </Text>
    </TouchableOpacity>
  );
};

const SubjectListScreen = () => {
  const { colors } = useAppSelector(selectTheme);

  return (
    <FlatList
      data={bacSubjects}
      keyExtractor={item => item.id}
      renderItem={({ item }: ListRenderItemInfo<BACSubject>) => (
        <SubjectCard item={item} />
      )}
      numColumns={2}
      contentContainerStyle={[styles.list, { backgroundColor: colors.background }]}
      columnWrapperStyle={styles.row}
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  icon: { fontSize: 36 },
  name: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  chapters: { fontSize: 12 },
});

export default SubjectListScreen;
