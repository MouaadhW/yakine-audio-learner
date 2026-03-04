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
  SearchIcon,
  ShieldIcon,
  ShieldBanIcon,
  Trash2Icon,
  UserIcon,
  SettingsIcon,
} from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import {
  getUsers,
  updateUser,
  deleteUser,
  AdminUser,
} from '@/lib/services/AdminApi';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigations';

const ROLES = ['ALL', 'STUDENT', 'TEACHER', 'ADMIN'] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'UserManagement'>;

const UserManagementScreen = ({ navigation }: Props) => {
  const { colors } = useAppSelector(selectTheme);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: ({ signal }) =>
      getUsers({
        search: search || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        page,
        limit: 20,
      }),
    placeholderData: (prev: any) => prev,
  });

  const handleChangeRole = useCallback(
    async (user: AdminUser, newRole: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
      try {
        await updateUser(user.id, { role: newRole });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    },
    [queryClient],
  );

  const handleToggleBan = useCallback(
    async (user: AdminUser) => {
      const action = user.banned ? 'unban' : 'ban';
      Alert.alert(
        `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
        `Are you sure you want to ${action} ${user.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: action === 'ban' ? 'Ban' : 'Unban',
            style: action === 'ban' ? 'destructive' : 'default',
            onPress: async () => {
              try {
                await updateUser(user.id, { banned: !user.banned });
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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

  const handleDelete = useCallback(
    (user: AdminUser) => {
      Alert.alert('Delete User', `Delete ${user.name}? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.id);
              queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]);
    },
    [queryClient],
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#ef4444';
      case 'TEACHER':
        return '#f59e0b';
      default:
        return colors.primary;
    }
  };

  const renderItem = ({ item }: { item: AdminUser }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            <UserIcon size={20} color={getRoleColor(item.role)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.userEmail, { color: colors.muted }]}>{item.email}</Text>
          </View>
        </View>
        {item.banned && (
          <View style={[styles.bannedBadge, { backgroundColor: '#ef444420' }]}>
            <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600' }}>BANNED</Text>
          </View>
        )}
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.muted }]}>
          Joined: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.lastLoginAt && (
          <Text style={[styles.meta, { color: colors.muted }]}>
            Last login: {new Date(item.lastLoginAt).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.roleRow}>
        {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map(role => (
          <TouchableOpacity
            key={role}
            style={[
              styles.roleChip,
              {
                backgroundColor:
                  item.role === role ? getRoleColor(role) : colors.inputBackground,
                borderColor: item.role === role ? getRoleColor(role) : colors.border,
              },
            ]}
            onPress={() => {
              if (item.role !== role) handleChangeRole(item, role);
            }}>
            <Text
              style={{
                color: item.role === role ? '#fff' : colors.text,
                fontSize: 12,
                fontWeight: '600',
              }}>
              {role}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionRow}>
        {item.role === 'TEACHER' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#6366f120' }]}
            onPress={() =>
              navigation.navigate('TeacherScopes', {
                teacherId: item.id,
                teacherName: item.name,
              })
            }>
            <SettingsIcon size={16} color="#6366f1" />
            <Text style={{ color: '#6366f1', fontSize: 12, marginLeft: 4 }}>
              Manage Scopes
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              backgroundColor: item.banned ? '#22c55e20' : '#ef444420',
            },
          ]}
          onPress={() => handleToggleBan(item)}>
          {item.banned ? (
            <ShieldIcon size={16} color="#22c55e" />
          ) : (
            <ShieldBanIcon size={16} color="#ef4444" />
          )}
          <Text
            style={{
              color: item.banned ? '#22c55e' : '#ef4444',
              fontSize: 12,
              marginLeft: 4,
            }}>
            {item.banned ? 'Unban' : 'Ban'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#ef444420' }]}
          onPress={() => handleDelete(item)}>
          <Trash2Icon size={16} color="#ef4444" />
          <Text style={{ color: '#ef4444', fontSize: 12, marginLeft: 4 }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && !data) return <Loading />;
  if (error && !data) return <ErrorView error={error} action={() => { refetch(); }} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SearchIcon size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search users..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {/* Role filter */}
      <View style={styles.filterRow}>
        {ROLES.map(role => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterChip,
              {
                backgroundColor: roleFilter === role ? colors.primary : colors.card,
                borderColor: roleFilter === role ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              setRoleFilter(role);
              setPage(1);
            }}>
            <Text
              style={{
                color: roleFilter === role ? '#fff' : colors.text,
                fontSize: 12,
                fontWeight: '600',
              }}>
              {role}
            </Text>
          </TouchableOpacity>
        ))}
        {data && (
          <Text style={[styles.totalBadge, { color: colors.muted }]}>
            {data.totalElements} users
          </Text>
        )}
      </View>

      <FlatList
        data={data?.contents ?? []}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            No users found
          </Text>
        }
      />

      {/* Pagination */}
      {data && data.totalPage > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            disabled={page <= 1}
            onPress={() => setPage(p => p - 1)}
            style={[styles.pageBtn, { opacity: page <= 1 ? 0.3 : 1, backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text }}>Previous</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.text }}>
            {page} / {data.totalPage}
          </Text>
          <TouchableOpacity
            disabled={page >= data.totalPage}
            onPress={() => setPage(p => p + 1)}
            style={[
              styles.pageBtn,
              { opacity: page >= data.totalPage ? 0.3 : 1, backgroundColor: colors.card },
            ]}>
            <Text style={{ color: colors.text }}>Next</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, paddingVertical: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, alignItems: 'center', marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  totalBadge: { marginLeft: 'auto', fontSize: 12 },
  card: { borderRadius: 12, padding: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: '600' },
  userEmail: { fontSize: 12, marginTop: 2 },
  bannedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  meta: { fontSize: 11 },
  roleRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
});

export default UserManagementScreen;
