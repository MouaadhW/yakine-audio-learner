import { Text } from '@/components/ui/Text';
import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { FAB } from '@/components/ui/FAB';
import { AdminFormModal, FormField } from '@/components/ui/AdminFormModal';
import { selectTheme } from '@/features/themeSlice';
import { selectAuthUser } from '@/features/auth/authSlice';
import { useAppSelector } from '@/lib/hooks';
import { BACChapter } from '@/lib/models';
import { bacChapters as fallbackChapters } from '@/lib/mockData';
import {
  getChaptersBySubject,
  createChapter,
  updateChapter,
  deleteChapter,
} from '@/lib/services/BacApi';
import { RootStackParamList } from '@/navigations';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, Trash2Icon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { dirRow } from '@/lib/rtl';

type Props = NativeStackScreenProps<RootStackParamList, 'ChapterList'>;

const chapterFields: FormField[] = [
  { key: 'nameEn', label: 'Name (English)', required: true },
  { key: 'nameFr', label: 'Name (French)', required: true },
  { key: 'sortOrder', label: 'Sort Order', keyboardType: 'numeric' },
];

const ChapterListScreen = ({ route, navigation }: Props) => {
  const { subjectId } = route.params;
  const { colors } = useAppSelector(selectTheme);
  const user = useAppSelector(selectAuthUser);
  const { i18n, t } = useTranslation();
  const isFr = i18n.language === 'fr';
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<BACChapter | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fallback = fallbackChapters
    .filter(chapter => chapter.subjectId === subjectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const { data: chapters, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/chapters', subjectId],
    queryFn: ({ signal }) => getChaptersBySubject(subjectId, signal),
    placeholderData: fallback,
  });

  const openAdd = useCallback(() => {
    setEditingChapter(null);
    setFormValues({ sortOrder: String((chapters?.length ?? 0) + 1) });
    setShowModal(true);
  }, [chapters]);

  const openEdit = useCallback((item: BACChapter) => {
    setEditingChapter(item);
    setFormValues({
      nameEn: item.nameEn,
      nameFr: item.nameFr,
      sortOrder: String(item.sortOrder),
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    (item: BACChapter) => {
      Alert.alert(t('deleteChapter'), t('deleteConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChapter(item.id);
              queryClient.invalidateQueries({ queryKey: ['/api/chapters', subjectId] });
            } catch (err) {
              Alert.alert('Error', String(err));
            }
          },
        },
      ]);
    },
    [t, queryClient, subjectId],
  );

  const handleSave = useCallback(async () => {
    if (!formValues.nameEn || !formValues.nameFr) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingChapter) {
        await updateChapter(editingChapter.id, {
          nameEn: formValues.nameEn,
          nameFr: formValues.nameFr,
          sortOrder: formValues.sortOrder ? parseInt(formValues.sortOrder, 10) : undefined,
        });
      } else {
        await createChapter({
          nameEn: formValues.nameEn,
          nameFr: formValues.nameFr,
          subjectId,
          sortOrder: formValues.sortOrder ? parseInt(formValues.sortOrder, 10) : undefined,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/chapters', subjectId] });
      setShowModal(false);
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally {
      setSaving(false);
    }
  }, [editingChapter, formValues, queryClient, subjectId]);

  const renderItem = ({ item }: { item: BACChapter }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('LessonList', { chapterId: item.id })}
      activeOpacity={0.7}>
      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>
            #{item.sortOrder} {isFr ? item.nameFr : item.nameEn}
          </Text>
          <Text style={[styles.meta, { color: colors.primary }]}>
            {item.lessons?.length ?? 0} {isFr ? 'leçons' : 'lessons'}
          </Text>
        </View>
        {isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]}
              onPress={e => {
                e.stopPropagation();
                openEdit(item);
              }}>
              <PencilIcon size={14} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error + '20' }]}
              onPress={e => {
                e.stopPropagation();
                handleDelete(item);
              }}>
              <Trash2Icon size={14} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error && !chapters?.length) {
    return <ErrorView error={error} action={() => { refetch(); }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={chapters ?? fallback}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.container]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      {isAdmin && <FAB onPress={openAdd} />}
      <AdminFormModal
        visible={showModal}
        title={editingChapter ? t('editChapter') : t('addChapter')}
        fields={chapterFields}
        values={formValues}
        onChange={(key, val) => setFormValues(prev => ({ ...prev, [key]: val }))}
        onSave={handleSave}
        onCancel={() => setShowModal(false)}
        onDelete={
          editingChapter
            ? () => {
                setShowModal(false);
                handleDelete(editingChapter);
              }
            : undefined
        }
        saveLabel={t('save')}
        cancelLabel={t('cancel')}
        deleteLabel={t('delete')}
        loading={saving}
      />
    </View>
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
  cardContent: {
    flexDirection: dirRow(),
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
  },
  adminActions: {
    flexDirection: dirRow(),
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChapterListScreen;
