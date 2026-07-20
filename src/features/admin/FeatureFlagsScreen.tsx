import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { dirRow } from '@/lib/rtl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlagIcon, PlusIcon, Trash2Icon } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { AdminFormModal, FormField } from '@/components/ui/AdminFormModal';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import {
  getFeatureFlags,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  FeatureFlag,
} from '@/lib/services/AdminApi';

const flagFields: FormField[] = [
  { key: 'key', label: 'Flag Key', required: true, placeholder: 'e.g. enable_downloads' },
  { key: 'description', label: 'Description', multiline: true },
];

const FeatureFlagsScreen = () => {
  const { colors } = useAppSelector(selectTheme);
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => getFeatureFlags(),
  });

  const handleToggle = useCallback(
    async (flag: FeatureFlag) => {
      try {
        await updateFeatureFlag(flag.id, { enabled: !flag.enabled });
        queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    },
    [queryClient],
  );

  const handleCreate = useCallback(async () => {
    if (!formValues.key) {
      Alert.alert('Error', 'Flag key is required');
      return;
    }
    setSaving(true);
    try {
      await createFeatureFlag({
        key: formValues.key,
        enabled: false,
        description: formValues.description || '',
      });
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      setShowModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }, [formValues, queryClient]);

  const handleDelete = useCallback(
    (flag: FeatureFlag) => {
      Alert.alert('Delete Flag', `Delete "${flag.key}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFeatureFlag(flag.id);
              queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]);
    },
    [queryClient],
  );

  const renderItem = ({ item }: { item: FeatureFlag }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardRow}>
        <View style={[styles.flagIcon, { backgroundColor: item.enabled ? '#22c55e20' : colors.inputBackground }]}>
          <FlagIcon size={18} color={item.enabled ? '#22c55e' : colors.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.flagKey, { color: colors.text }]}>{item.key}</Text>
          {!!item.description && (
            <Text style={[styles.flagDesc, { color: colors.muted }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => handleToggle(item)}
          trackColor={{ false: colors.border, true: '#22c55e80' }}
          thumbColor={item.enabled ? '#22c55e' : colors.muted}
        />
      </View>
      <View style={styles.footerRow}>
        <Text style={[styles.dateText, { color: colors.muted }]}>
          Updated: {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: '#ef444420' }]}
          onPress={() => handleDelete(item)}>
          <Trash2Icon size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
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
            <FlagIcon size={48} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 12 }}>No feature flags yet</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
              Tap + to create one
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          setFormValues({});
          setShowModal(true);
        }}
        activeOpacity={0.8}>
        <PlusIcon size={24} color="#fff" />
      </TouchableOpacity>

      <AdminFormModal
        visible={showModal}
        title="New Feature Flag"
        fields={flagFields}
        values={formValues}
        onChange={(key, value) => setFormValues(prev => ({ ...prev, [key]: value }))}
        onSave={handleCreate}
        onCancel={() => setShowModal(false)}
        loading={saving}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 12, padding: 14, borderWidth: 1 },
  cardRow: { flexDirection: dirRow(), alignItems: 'center', gap: 10 },
  flagIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  flagKey: { fontSize: 15, fontWeight: '600', fontFamily: 'monospace' },
  flagDesc: { fontSize: 12, marginTop: 3 },
  footerRow: {
    flexDirection: dirRow(),
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  dateText: { fontSize: 11 },
  deleteBtn: { padding: 6, borderRadius: 6 },
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

export default FeatureFlagsScreen;
