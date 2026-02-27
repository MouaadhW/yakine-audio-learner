import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellIcon,
  PlusIcon,
  Trash2Icon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { AdminFormModal, FormField } from '@/components/ui/AdminFormModal';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  Announcement,
} from '@/lib/services/AdminApi';

const announcementFields: FormField[] = [
  { key: 'title', label: 'Title', required: true },
  { key: 'body', label: 'Body', required: true, multiline: true },
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'info', label: 'Info' },
      { value: 'warning', label: 'Warning' },
      { value: 'success', label: 'Success' },
      { value: 'error', label: 'Error' },
    ],
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'warning': return '#f59e0b';
    case 'success': return '#22c55e';
    case 'error': return '#ef4444';
    default: return '#3b82f6';
  }
};

const AnnouncementsScreen = () => {
  const { colors } = useAppSelector(selectTheme);
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['announcements-admin'],
    queryFn: () => getAnnouncements(true),
  });

  const openAdd = useCallback(() => {
    setEditing(null);
    setFormValues({ type: 'info' });
    setShowModal(true);
  }, []);

  const openEdit = useCallback((item: Announcement) => {
    setEditing(item);
    setFormValues({
      title: item.title,
      body: item.body,
      type: item.type,
    });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formValues.title || !formValues.body) {
      Alert.alert('Error', 'Title and body are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateAnnouncement(editing.id, {
          title: formValues.title,
          body: formValues.body,
          type: formValues.type || 'info',
        });
      } else {
        await createAnnouncement({
          title: formValues.title,
          body: formValues.body,
          type: formValues.type || 'info',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      setShowModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }, [editing, formValues, queryClient]);

  const handleToggle = useCallback(
    async (item: Announcement) => {
      try {
        await updateAnnouncement(item.id, { active: !item.active });
        queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    },
    [queryClient],
  );

  const handleDelete = useCallback(
    (item: Announcement) => {
      Alert.alert('Delete Announcement', `Delete "${item.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnouncement(item.id);
              queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]);
    },
    [queryClient],
  );

  const renderItem = ({ item }: { item: Announcement }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: item.active ? 1 : 0.6,
        },
      ]}
      onPress={() => openEdit(item)}
      activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeDot, { backgroundColor: getTypeColor(item.type) }]} />
        <Text style={[styles.title, { color: colors.text, flex: 1 }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.statusLabel, { color: item.active ? '#22c55e' : colors.muted }]}>
          {item.active ? 'Active' : 'Inactive'}
        </Text>
      </View>

      <Text style={[styles.body, { color: colors.muted }]} numberOfLines={2}>
        {item.body}
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.inputBackground }]}
          onPress={() => handleToggle(item)}>
          {item.active ? (
            <ToggleRightIcon size={16} color="#22c55e" />
          ) : (
            <ToggleLeftIcon size={16} color={colors.muted} />
          )}
          <Text style={{ color: item.active ? '#22c55e' : colors.muted, fontSize: 12, marginLeft: 4 }}>
            {item.active ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#ef444420' }]}
          onPress={() => handleDelete(item)}>
          <Trash2Icon size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <Loading />;
  if (error) return <ErrorView error={error} action={() => { refetch(); }} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data ?? []}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BellIcon size={48} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 12 }}>No announcements yet</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openAdd}
        activeOpacity={0.8}>
        <PlusIcon size={24} color="#fff" />
      </TouchableOpacity>

      <AdminFormModal
        visible={showModal}
        title={editing ? 'Edit Announcement' : 'New Announcement'}
        fields={announcementFields}
        values={formValues}
        onChange={(key, value) => setFormValues(prev => ({ ...prev, [key]: value }))}
        onSave={handleSave}
        onCancel={() => setShowModal(false)}
        loading={saving}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 12, padding: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeDot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: 15, fontWeight: '600' },
  statusLabel: { fontSize: 11, fontWeight: '600' },
  body: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'flex-end' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default AnnouncementsScreen;
