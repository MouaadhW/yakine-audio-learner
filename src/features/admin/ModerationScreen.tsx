import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { dirRow } from '@/lib/rtl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import {
  getModerationQueue,
  reviewLesson,
  ModerationLesson,
} from '@/lib/services/AdminApi';

const STATUSES = ['PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'DRAFT'] as const;

const ModerationScreen = () => {
  const { colors } = useAppSelector(selectTheme);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['moderation', statusFilter],
    queryFn: () => getModerationQueue({ status: statusFilter }),
  });

  const handleReview = useCallback(
    (lesson: ModerationLesson, action: 'approve' | 'reject') => {
      const label = action === 'approve' ? 'Approve' : 'Reject';
      Alert.alert(
        `${label} Lesson`,
        `${label} "${lesson.titleEn}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: label,
            style: action === 'reject' ? 'destructive' : 'default',
            onPress: async () => {
              try {
                await reviewLesson(lesson.id, action);
                queryClient.invalidateQueries({ queryKey: ['moderation'] });
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            },
          },
        ],
      );
    },
    [queryClient],
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return '#22c55e';
      case 'PENDING_REVIEW': return '#f59e0b';
      case 'REJECTED': return '#ef4444';
      default: return colors.muted;
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: ModerationLesson }) => {
    const teacherName = item.teacherName || item.teacher?.name || 'Unknown';
    const subjectName = item.subjectName || item.chapter?.subject?.nameEn || '';
    const chapterName = item.chapterName || item.chapter?.nameEn || '';

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>{item.titleEn}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{item.titleFr}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={{ color: getStatusColor(item.status), fontSize: 11, fontWeight: '600' }}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.muted }]}>
            Teacher: {teacherName}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {subjectName} {'>'} {chapterName}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            Duration: {formatDuration(item.duration)} | {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {item.status === 'PENDING_REVIEW' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.approveBtn, { backgroundColor: '#22c55e20' }]}
              onPress={() => handleReview(item, 'approve')}>
              <CheckCircleIcon size={16} color="#22c55e" />
              <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                Approve
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectBtn, { backgroundColor: '#ef444420' }]}
              onPress={() => handleReview(item, 'reject')}>
              <XCircleIcon size={16} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                Reject
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorView error={error} action={() => { refetch(); }} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Status filter */}
      <View style={styles.filterRow}>
        {STATUSES.map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              {
                backgroundColor: statusFilter === status ? getStatusColor(status) : colors.card,
                borderColor: statusFilter === status ? getStatusColor(status) : colors.border,
              },
            ]}
            onPress={() => setStatusFilter(status)}>
            <Text
              style={{
                color: statusFilter === status ? '#fff' : colors.text,
                fontSize: 11,
                fontWeight: '600',
              }}>
              {status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data?.contents ?? []}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClockIcon size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No lessons with this status
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: { flexDirection: dirRow(), paddingHorizontal: 16, paddingVertical: 12, gap: 6, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  card: { borderRadius: 12, padding: 14, borderWidth: 1 },
  cardHeader: { flexDirection: dirRow(), justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaRow: { marginTop: 10, gap: 4 },
  meta: { fontSize: 12 },
  actionRow: { flexDirection: dirRow(), gap: 10, marginTop: 12 },
  approveBtn: { flexDirection: dirRow(), alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flex: 1, justifyContent: 'center' },
  rejectBtn: { flexDirection: dirRow(), alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});

export default ModerationScreen;
