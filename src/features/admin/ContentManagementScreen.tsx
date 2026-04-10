import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { AdminFormModal, FormField } from '@/components/ui/AdminFormModal';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import { makeApiRequest } from '@/lib/makeApiRequest';
import { validateApiResponse } from '@/lib/validateApiResponse';
import { uploadAudioFile } from '@/lib/services/BacApi';
import * as DocumentPicker from 'expo-document-picker';

// ─── Types ──────────────────────────────────────────────────────────

interface LessonItem {
  id: string;
  titleEn: string;
  titleFr: string;
  audioUrl: string;
  duration: number;
  sortOrder: number;
  status: string;
  audience?: string;
  scriptEn: string;
  scriptFr: string;
  createdAt: string;
  teacherName?: string;
  chapter?: { id: string; nameEn: string; nameFr: string; subject?: { nameEn: string; nameFr: string } };
}

interface LessonPage {
  contents: LessonItem[];
  currentPage: number;
  totalPage: number;
  totalElements: number;
}

// ─── API helpers ────────────────────────────────────────────────────

async function fetchLessons(page = 1, search = ''): Promise<LessonPage> {
  const qs = `?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`;
  const resp = await makeApiRequest({ url: `/api/admin/content${qs}` });
  await validateApiResponse(resp);
  return (await resp.json()) as LessonPage;
}

async function adminUpdateLesson(id: string, data: Record<string, any>) {
  const resp = await makeApiRequest({
    url: `/api/lessons/${id}`,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  });
  await validateApiResponse(resp);
  return resp.json();
}

async function adminDeleteLesson(id: string) {
  const resp = await makeApiRequest({
    url: `/api/lessons/${id}`,
    options: { method: 'DELETE' },
  });
  await validateApiResponse(resp);
}

// ─── Form fields ────────────────────────────────────────────────────

const lessonFields: FormField[] = [
  { key: 'titleEn', label: 'Title (English)', required: true },
  { key: 'titleFr', label: 'Title (French)', required: true },
  { key: 'audioUrl', label: 'Audio URL (or upload below)' },
  { key: 'scriptEn', label: 'Script (English)', multiline: true },
  { key: 'scriptFr', label: 'Script (French)', multiline: true },
  { key: 'duration', label: 'Duration (seconds)', keyboardType: 'numeric' },
  { key: 'sortOrder', label: 'Sort Order', keyboardType: 'numeric' },
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'PENDING_REVIEW', label: 'Pending' },
      { value: 'DRAFT', label: 'Draft' },
      { value: 'REJECTED', label: 'Rejected' },
    ],
  },
  {
    key: 'audience',
    label: 'Access',
    options: [
      { value: 'FREE', label: 'Free' },
      { value: 'PREMIUM', label: 'Premium only' },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────

const ContentManagementScreen = () => {
  const { colors } = useAppSelector(selectTheme);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LessonItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Debounce search
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(text);
      setPage(1);
    }, 400);
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-content', page, debouncedSearch],
    queryFn: () => fetchLessons(page, debouncedSearch),
  });

  const openEdit = useCallback((item: LessonItem) => {
    setEditing(item);
    setFormValues({
      titleEn: item.titleEn,
      titleFr: item.titleFr,
      audioUrl: item.audioUrl ?? '',
      scriptEn: item.scriptEn ?? '',
      scriptFr: item.scriptFr ?? '',
      duration: String(item.duration ?? 0),
      sortOrder: String(item.sortOrder ?? 0),
      status: item.status ?? 'PUBLISHED',
      audience: item.audience ?? 'FREE',
    });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editing) return;
    if (!formValues.titleEn || !formValues.titleFr) {
      Alert.alert('Error', 'Title fields are required');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        titleEn: formValues.titleEn,
        titleFr: formValues.titleFr,
      };
      if (formValues.audioUrl) payload.audioUrl = formValues.audioUrl;
      if (formValues.scriptEn) payload.scriptEn = formValues.scriptEn;
      if (formValues.scriptFr) payload.scriptFr = formValues.scriptFr;
      if (formValues.duration) payload.duration = parseInt(formValues.duration, 10);
      if (formValues.sortOrder) payload.sortOrder = parseInt(formValues.sortOrder, 10);
      if (formValues.status) payload.status = formValues.status;
      if (formValues.audience) payload.audience = formValues.audience;

      await adminUpdateLesson(editing.id, payload);
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setShowModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }, [editing, formValues, queryClient]);

  const handleDelete = useCallback(
    (item: LessonItem) => {
      Alert.alert('Delete Lesson', `Delete "${item.titleEn}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminDeleteLesson(item.id);
              queryClient.invalidateQueries({ queryKey: ['admin-content'] });
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]);
    },
    [queryClient],
  );

  const handleUploadAudio = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      setUploading(true);

      const uploadResult = await uploadAudioFile(file.uri, file.name ?? 'audio.mp3');
      setFormValues(prev => ({
        ...prev,
        audioUrl: uploadResult.publicUrl,
      }));
      Alert.alert('Upload Complete', 'Audio file uploaded successfully');
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return '#22c55e';
      case 'PENDING_REVIEW': return '#f59e0b';
      case 'DRAFT': return '#6b7280';
      case 'REJECTED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderItem = ({ item }: { item: LessonItem }) => (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.titleEn}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
            {item.titleFr}
          </Text>
          <View style={styles.metaRow}>
            {item.chapter?.subject && (
              <Text style={[styles.metaChip, { color: colors.primary, backgroundColor: colors.primary + '18' }]}>
                {item.chapter.subject.nameEn}
              </Text>
            )}
            {item.chapter && (
              <Text style={[styles.metaChip, { color: colors.muted, backgroundColor: colors.inputBackground }]}>
                {item.chapter.nameEn}
              </Text>
            )}
            <Text
              style={[
                styles.statusBadge,
                { color: getStatusColor(item.status), backgroundColor: getStatusColor(item.status) + '18' },
              ]}>
              {item.status}
            </Text>
          </View>
          {item.teacherName && (
            <Text style={[styles.teacherName, { color: colors.muted }]}>
              By {item.teacherName}
            </Text>
          )}
        </View>
        <View style={styles.actionCol}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]}
            onPress={() => openEdit(item)}>
            <PencilIcon size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ef444420' }]}
            onPress={() => handleDelete(item)}>
            <Trash2Icon size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) return <Loading />;
  if (error && !data) return <ErrorView error={error} action={() => { refetch(); }} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
        <SearchIcon size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Search lessons..."
          placeholderTextColor={colors.muted}
        />
      </View>

      <FlatList
        data={data?.contents ?? []}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={
          data && data.totalPage > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={page <= 1}
                onPress={() => setPage(p => p - 1)}
                style={[styles.pageBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: page <= 1 ? 0.4 : 1 }]}>
                <Text style={{ color: colors.text }}>← Prev</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.muted }}>
                {page} / {data.totalPage}
              </Text>
              <TouchableOpacity
                disabled={page >= data.totalPage}
                onPress={() => setPage(p => p + 1)}
                style={[styles.pageBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: page >= data.totalPage ? 0.4 : 1 }]}>
                <Text style={{ color: colors.text }}>Next →</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.muted, marginTop: 12 }}>No lessons found</Text>
          </View>
        }
      />

      {/* Edit modal */}
      {showModal && (
        <AdminFormModal
          visible={showModal}
          title="Edit Lesson"
          fields={lessonFields}
          values={formValues}
          onChange={(key, val) => setFormValues(prev => ({ ...prev, [key]: val }))}
          onSave={handleSave}
          onCancel={() => setShowModal(false)}
          onDelete={editing ? () => { setShowModal(false); handleDelete(editing); } : undefined}
          loading={saving}
        />
      )}

      {/* Upload audio button visible while editing */}
      {showModal && (
        <TouchableOpacity
          style={[styles.uploadFab, { backgroundColor: '#8b5cf6' }]}
          onPress={handleUploadAudio}
          disabled={uploading}
          activeOpacity={0.8}>
          <UploadIcon size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
            {uploading ? 'Uploading...' : 'Upload MP3'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  card: { borderRadius: 12, padding: 14, borderWidth: 1 },
  cardContent: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  metaChip: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  statusBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  teacherName: { fontSize: 12, marginTop: 4 },
  actionCol: { justifyContent: 'center', gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 16 },
  pageBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  uploadFab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default ContentManagementScreen;
