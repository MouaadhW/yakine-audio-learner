import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { dirRow } from '@/lib/rtl';
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
import {
  LAW_LEVELS,
  LAW_MAJORS,
  LAW_REGIONS,
  LAW_UNIVERSITIES_BY_REGION,
  type LawRegion,
} from '../../../backend/src/constants/lawOnboarding';

const ROLES = ['ALL', 'STUDENT', 'TEACHER', 'ADMIN'] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'UserManagement'>;

const UserManagementScreen = ({ navigation }: Props) => {
  const { colors } = useAppSelector(selectTheme);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const [lawModalUser, setLawModalUser] = useState<AdminUser | null>(null);
  const [lawRegion, setLawRegion] = useState<LawRegion | null>(null);
  const [lawUniversity, setLawUniversity] = useState('');
  const [lawMajor, setLawMajor] = useState<'DROIT_PRIVE' | 'DROIT_PUBLIC' | null>(null);
  const [lawAcademicLevel, setLawAcademicLevel] = useState<'L1' | 'L2' | 'L3' | null>(null);
  const [lawSaving, setLawSaving] = useState(false);

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

  const handlePremiumToggle = useCallback(
    async (user: AdminUser, nextPremium: boolean) => {
      try {
        await updateUser(user.id, {
          subscriptionTier: nextPremium ? 'PREMIUM' : 'FREE',
        });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    },
    [queryClient],
  );

  const openLawFaculty = useCallback((u: AdminUser) => {
    setLawModalUser(u);
    setLawRegion((u.lawRegion as LawRegion) ?? null);
    setLawUniversity(u.lawUniversity ?? '');
    setLawMajor((u.lawMajor as 'DROIT_PRIVE' | 'DROIT_PUBLIC') ?? null);
    setLawAcademicLevel((u.lawAcademicLevel as 'L1' | 'L2' | 'L3') ?? null);
  }, []);

  const saveLawFaculty = useCallback(async () => {
    if (!lawModalUser || !lawRegion || !lawUniversity) {
      Alert.alert('Missing fields', 'Select a region and a university.');
      return;
    }
    setLawSaving(true);
    try {
      await updateUser(lawModalUser.id, {
        lawRegion,
        lawUniversity,
        lawMajor: lawMajor ?? undefined,
        lawAcademicLevel: lawAcademicLevel ?? undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setLawModalUser(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLawSaving(false);
    }
  }, [lawModalUser, lawRegion, lawUniversity, lawMajor, lawAcademicLevel, queryClient]);

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

      {item.role === 'TEACHER' && (!item.lawRegion || !item.lawUniversity) && (
        <View style={[styles.lawWarning, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b44' }]}>
          <Text style={{ color: '#b45309', fontSize: 12, fontWeight: '600' }}>
            Law faculty not set — required for law modules and posting.
          </Text>
        </View>
      )}

      {item.role === 'STUDENT' && (
        <View style={styles.premiumRow}>
          <Text style={[styles.premiumLabel, { color: colors.text }]}>Premium</Text>
          <Switch
            value={item.subscriptionTier === 'PREMIUM'}
            onValueChange={v => handlePremiumToggle(item, v)}
            trackColor={{ false: colors.border, true: colors.primary + '88' }}
            thumbColor={item.subscriptionTier === 'PREMIUM' ? colors.primary : '#f4f4f5'}
          />
        </View>
      )}

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
          <>
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
                BAC scopes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0d948820' }]}
              onPress={() =>
                navigation.navigate('TeacherLawSubjects', {
                  teacherId: item.id,
                  teacherName: item.name,
                  lawUniversity: item.lawUniversity ?? null,
                })
              }>
              <SettingsIcon size={16} color="#0d9488" />
              <Text style={{ color: '#0d9488', fontSize: 12, marginLeft: 4 }}>
                Law modules
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#f59e0b20' }]}
              onPress={() => openLawFaculty(item)}>
              <SettingsIcon size={16} color="#d97706" />
              <Text style={{ color: '#d97706', fontSize: 12, marginLeft: 4 }}>
                Law faculty
              </Text>
            </TouchableOpacity>
          </>
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

      <Modal
        visible={!!lawModalUser}
        animationType="slide"
        transparent
        onRequestClose={() => setLawModalUser(null)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.lawModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.lawModalTitle, { color: colors.text }]}>
              Law faculty — {lawModalUser?.name}
            </Text>
            <ScrollView style={styles.lawModalScroll} keyboardShouldPersistTaps="handled">
              <Text style={[styles.lawModalLabel, { color: colors.muted }]}>Region</Text>
              <View style={styles.chipWrap}>
                {LAW_REGIONS.map(region => (
                  <TouchableOpacity
                    key={region}
                    style={[
                      styles.chip,
                      lawRegion === region
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.inputBackground ?? colors.card, borderColor: colors.border, borderWidth: 1 },
                    ]}
                    onPress={() => {
                      setLawRegion(region);
                      setLawUniversity('');
                    }}>
                    <Text
                      style={{
                        color: lawRegion === region ? '#fff' : colors.text,
                        fontSize: 11,
                        fontWeight: '600',
                      }}>
                      {region}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.lawModalLabel, { color: colors.muted, marginTop: 12 }]}>University</Text>
              <View style={styles.chipWrap}>
                {(lawRegion ? LAW_UNIVERSITIES_BY_REGION[lawRegion] : []).map(uName => (
                  <TouchableOpacity
                    key={uName}
                    style={[
                      styles.chipWide,
                      lawUniversity === uName
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.inputBackground ?? colors.card, borderColor: colors.border, borderWidth: 1 },
                    ]}
                    onPress={() => setLawUniversity(uName)}>
                    <Text
                      style={{
                        color: lawUniversity === uName ? '#fff' : colors.text,
                        fontSize: 11,
                        fontWeight: '500',
                      }}
                      numberOfLines={3}>
                      {uName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.lawModalLabel, { color: colors.muted, marginTop: 12 }]}>Major (optional)</Text>
              <View style={styles.chipWrap}>
                {LAW_MAJORS.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.chip,
                      lawMajor === m
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.inputBackground ?? colors.card, borderColor: colors.border, borderWidth: 1 },
                    ]}
                    onPress={() => setLawMajor(m)}>
                    <Text style={{ color: lawMajor === m ? '#fff' : colors.text, fontSize: 11, fontWeight: '600' }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.lawModalLabel, { color: colors.muted, marginTop: 12 }]}>Level (optional)</Text>
              <View style={styles.chipWrap}>
                {LAW_LEVELS.map(lv => (
                  <TouchableOpacity
                    key={lv}
                    style={[
                      styles.chip,
                      lawAcademicLevel === lv
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.inputBackground ?? colors.card, borderColor: colors.border, borderWidth: 1 },
                    ]}
                    onPress={() => setLawAcademicLevel(lv)}>
                    <Text style={{ color: lawAcademicLevel === lv ? '#fff' : colors.text, fontSize: 11, fontWeight: '600' }}>
                      {lv}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.lawModalActions}>
              <TouchableOpacity
                style={[styles.lawModalBtn, { backgroundColor: colors.border + '40' }]}
                onPress={() => setLawModalUser(null)}
                disabled={lawSaving}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.lawModalBtn, { backgroundColor: colors.primary }]}
                onPress={() => void saveLawFaculty()}
                disabled={lawSaving}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{lawSaving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: dirRow(),
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, paddingVertical: 4 },
  filterRow: { flexDirection: dirRow(), paddingHorizontal: 16, gap: 6, alignItems: 'center', marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  totalBadge: { marginLeft: 'auto', fontSize: 12 },
  card: { borderRadius: 12, padding: 14, borderWidth: 1 },
  cardHeader: { flexDirection: dirRow(), alignItems: 'center', justifyContent: 'space-between' },
  userInfo: { flexDirection: dirRow(), alignItems: 'center', flex: 1, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: '600' },
  userEmail: { fontSize: 12, marginTop: 2 },
  bannedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaRow: { flexDirection: dirRow(), gap: 16, marginTop: 10 },
  meta: { fontSize: 11 },
  premiumRow: {
    flexDirection: dirRow(),
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 4,
  },
  premiumLabel: { fontSize: 13, fontWeight: '600' },
  roleRow: { flexDirection: dirRow(), gap: 6, marginTop: 10 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  actionRow: { flexDirection: dirRow(), gap: 10, marginTop: 12 },
  actionBtn: {
    flexDirection: dirRow(),
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pagination: {
    flexDirection: dirRow(),
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  lawWarning: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  lawModalCard: {
    maxHeight: '88%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 24,
  },
  lawModalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  lawModalScroll: { maxHeight: 420 },
  lawModalLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  chipWrap: { flexDirection: dirRow(), flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  chipWide: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, maxWidth: '100%' },
  lawModalActions: { flexDirection: dirRow(), gap: 12, marginTop: 16 },
  lawModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default UserManagementScreen;
