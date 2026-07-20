import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { dirRow } from '@/lib/rtl';
import {
  UsersIcon,
  BookOpenIcon,
  LayersIcon,
  ActivityIcon,
  AlertTriangleIcon,
  ShieldBanIcon,
} from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import { getDashboardStats, DashboardStats } from '@/lib/services/AdminApi';

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  bgColor: string;
}) => {
  const { colors } = useAppSelector(selectTheme);
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
};

const StatsScreen = () => {
  const { colors } = useAppSelector(selectTheme);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: ({ signal }) => getDashboardStats(signal),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorView error={error} action={() => { refetch(); }} />;
  if (!data) return null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      {/* Main Stats Grid */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
      <View style={styles.grid}>
        <StatCard
          label="Total Users"
          value={data.totalUsers}
          icon={UsersIcon}
          color="#6366f1"
          bgColor="#6366f120"
        />
        <StatCard
          label="Active Today"
          value={data.activeToday}
          icon={ActivityIcon}
          color="#22c55e"
          bgColor="#22c55e20"
        />
        <StatCard
          label="Total Lessons"
          value={data.totalLessons}
          icon={BookOpenIcon}
          color="#f59e0b"
          bgColor="#f59e0b20"
        />
        <StatCard
          label="Subjects"
          value={data.totalSubjects}
          icon={LayersIcon}
          color="#8b5cf6"
          bgColor="#8b5cf620"
        />
        <StatCard
          label="Pending Review"
          value={data.pendingReview}
          icon={AlertTriangleIcon}
          color="#f59e0b"
          bgColor="#f59e0b20"
        />
        <StatCard
          label="Banned Users"
          value={data.bannedCount}
          icon={ShieldBanIcon}
          color="#ef4444"
          bgColor="#ef444420"
        />
      </View>

      {/* Users by Role */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Users by Role</Text>
      <View style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <RoleBar label="Students" count={data.students} total={data.totalUsers} color="#6366f1" />
        <RoleBar label="Teachers" count={data.teachers} total={data.totalUsers} color="#f59e0b" />
        <RoleBar label="Admins" count={data.admins} total={data.totalUsers} color="#ef4444" />
      </View>

      {/* Top Subjects */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Subjects</Text>
      {data.topSubjects.map((subject, i) => (
        <View
          key={subject.id}
          style={[styles.subjectRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ fontSize: 24 }}>{subject.icon}</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.subjectName, { color: colors.text }]}>{subject.nameEn}</Text>
            <Text style={[styles.subjectMeta, { color: colors.muted }]}>
              {subject.chapterCount} chapters · {subject.lessonCount} lessons
            </Text>
          </View>
        </View>
      ))}

      {/* Recent Users */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Users</Text>
      {data.recentUsers.map(user => (
        <View
          key={user.id}
          style={[styles.recentUserRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.recentUserName, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.recentUserEmail, { color: colors.muted }]}>{user.email}</Text>
          </View>
          <View style={[styles.rolePill, { backgroundColor: getRoleColor(user.role) + '20' }]}>
            <Text style={{ color: getRoleColor(user.role), fontSize: 11, fontWeight: '600' }}>
              {user.role}
            </Text>
          </View>
        </View>
      ))}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN': return '#ef4444';
    case 'TEACHER': return '#f59e0b';
    default: return '#6366f1';
  }
};

const RoleBar = ({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) => {
  const { colors } = useAppSelector(selectTheme);
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <View style={styles.roleBarContainer}>
      <View style={styles.roleBarHeader}>
        <Text style={[styles.roleBarLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.roleBarCount, { color: colors.muted }]}>
          {count} ({pct.toFixed(0)}%)
        </Text>
      </View>
      <View style={[styles.roleBarBg, { backgroundColor: colors.inputBackground }]}>
        <View style={[styles.roleBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  grid: { flexDirection: dirRow(), flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 2,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },
  roleCard: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 12 },
  roleBarContainer: { gap: 4 },
  roleBarHeader: { flexDirection: dirRow(), justifyContent: 'space-between' },
  roleBarLabel: { fontSize: 13, fontWeight: '600' },
  roleBarCount: { fontSize: 12 },
  roleBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  roleBarFill: { height: '100%', borderRadius: 4 },
  subjectRow: {
    flexDirection: dirRow(),
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  subjectName: { fontSize: 14, fontWeight: '600' },
  subjectMeta: { fontSize: 12, marginTop: 2 },
  recentUserRow: {
    flexDirection: dirRow(),
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  recentUserName: { fontSize: 14, fontWeight: '600' },
  recentUserEmail: { fontSize: 12, marginTop: 2 },
  rolePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
});

export default StatsScreen;
