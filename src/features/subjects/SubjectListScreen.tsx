import { Text } from '@/components/ui/Text';
import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { FAB } from '@/components/ui/FAB';
import { AdminFormModal, FormField } from '@/components/ui/AdminFormModal';
import { selectTheme } from '@/features/themeSlice';
import { selectAuthUser } from '@/features/auth/authSlice';
import { useAppSelector } from '@/lib/hooks';
import { BACSubject } from '@/lib/models';
import { bacSubjects as fallbackSubjects } from '@/lib/mockData';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '@/lib/services/BacApi';
import { RootStackParamList } from '@/navigations';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, Trash2Icon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STREAMS = ['SCIENTIFIC', 'LITERARY', 'ECONOMIC', 'TECHNICAL'] as const;

const subjectFields: FormField[] = [
  { key: 'nameEn', label: 'Name (English)', required: true },
  { key: 'nameFr', label: 'Name (French)', required: true },
  { key: 'stream', label: 'Stream (SCIENTIFIC, LITERARY, ECONOMIC, TECHNICAL)', required: true },
  { key: 'icon', label: 'Icon (emoji)', placeholder: '📚' },
  { key: 'color', label: 'Color (hex)', placeholder: '#6C63FF' },
];

const SubjectCard = ({
  item,
  isAdmin,
  onEdit,
  onDelete,
}: {
  item: BACSubject;
  isAdmin: boolean;
  onEdit: (item: BACSubject) => void;
  onDelete: (item: BACSubject) => void;
}) => {
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
      {isAdmin && (
        <View style={styles.adminActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]}
            onPress={e => {
              e.stopPropagation();
              onEdit(item);
            }}>
            <PencilIcon size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.error + '20' }]}
            onPress={e => {
              e.stopPropagation();
              onDelete(item);
            }}>
            <Trash2Icon size={14} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const SubjectListScreen = () => {
  const { colors } = useAppSelector(selectTheme);
  const user = useAppSelector(selectAuthUser);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<BACSubject | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: subjects, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: ({ signal }) => getSubjects(signal),
    placeholderData: fallbackSubjects,
  });

  const openAdd = useCallback(() => {
    setEditingSubject(null);
    setFormValues({ icon: '📚', color: '#6C63FF', stream: 'SCIENTIFIC' });
    setShowModal(true);
  }, []);

  const openEdit = useCallback((item: BACSubject) => {
    setEditingSubject(item);
    setFormValues({
      nameEn: item.nameEn,
      nameFr: item.nameFr,
      stream: item.stream ?? 'SCIENTIFIC',
      icon: item.icon ?? '📚',
      color: item.color ?? '#6C63FF',
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    (item: BACSubject) => {
      Alert.alert(t('deleteSubject'), t('deleteConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubject(item.id);
              queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
            } catch (err) {
              Alert.alert('Error', String(err));
            }
          },
        },
      ]);
    },
    [t, queryClient],
  );

  const handleSave = useCallback(async () => {
    if (!formValues.nameEn || !formValues.nameFr || !formValues.stream) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (!STREAMS.includes(formValues.stream as any)) {
      Alert.alert('Error', 'Stream must be one of: SCIENTIFIC, LITERARY, ECONOMIC, TECHNICAL');
      return;
    }

    setSaving(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          nameEn: formValues.nameEn,
          nameFr: formValues.nameFr,
          stream: formValues.stream,
          icon: formValues.icon,
          color: formValues.color,
        });
      } else {
        await createSubject({
          nameEn: formValues.nameEn,
          nameFr: formValues.nameFr,
          stream: formValues.stream,
          icon: formValues.icon,
          color: formValues.color,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setShowModal(false);
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally {
      setSaving(false);
    }
  }, [editingSubject, formValues, queryClient]);

  if (isLoading) {
    return <Loading />;
  }

  if (error && !subjects?.length) {
    return <ErrorView error={error} action={() => { refetch(); }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={subjects ?? fallbackSubjects}
        keyExtractor={item => item.id}
        renderItem={({ item }: ListRenderItemInfo<BACSubject>) => (
          <SubjectCard
            item={item}
            isAdmin={isAdmin}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
        numColumns={2}
        contentContainerStyle={[styles.list]}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
      {isAdmin && <FAB onPress={openAdd} />}
      <AdminFormModal
        visible={showModal}
        title={editingSubject ? t('editSubject') : t('addSubject')}
        fields={subjectFields}
        values={formValues}
        onChange={(key, val) => setFormValues(prev => ({ ...prev, [key]: val }))}
        onSave={handleSave}
        onCancel={() => setShowModal(false)}
        onDelete={
          editingSubject
            ? () => {
                setShowModal(false);
                handleDelete(editingSubject);
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
  adminActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubjectListScreen;
