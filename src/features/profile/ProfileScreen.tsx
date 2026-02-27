import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { selectTheme, setDarkMode, setLightMode } from '../themeSlice';
import { changeLanguage } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import { logout, updateUser, selectAuthUser } from '../auth/authSlice';
import { DefaultStyles } from '@/components/styles';
import { makeApiRequest } from '@/lib/makeApiRequest';
import { useState, useCallback } from 'react';
import {
  UserIcon,
  MailIcon,
  SquarePenIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  GlobeIcon,
  LogOutIcon,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigations';

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { dark, colors } = useAppSelector(selectTheme);
  const user = useAppSelector(selectAuthUser);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editEmail, setEditEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const selectedLanguage = i18n.language.startsWith('fr') ? 'fr' : 'en';

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: t('admin'), color: '#ef4444', bg: '#ef444418' };
      case 'TEACHER':
        return { label: t('teacher'), color: '#f59e0b', bg: '#f59e0b18' };
      default:
        return { label: t('student'), color: colors.primary, bg: colors.primary + '18' };
    }
  };

  const openEditModal = useCallback(() => {
    setEditName(user?.name ?? '');
    setEditEmail(user?.email ?? '');
    setEditModalVisible(true);
  }, [user]);

  const handleSaveProfile = useCallback(async () => {
    if (!editName.trim() || !editEmail.trim()) return;
    setSaving(true);
    try {
      const resp = await makeApiRequest({
        url: '/api/auth/profile',
        options: {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editName.trim(),
            email: editEmail.trim(),
          }),
        },
      });
      if (resp.ok) {
        const updated = await resp.json();
        dispatch(
          updateUser({
            id: updated.id,
            name: updated.name,
            email: updated.email,
            role: updated.role,
            language: updated.language,
          }),
        );
        Toast.show({ type: 'info', text1: t('profileUpdated') });
        setEditModalVisible(false);
      } else {
        const err = await resp.json().catch(() => ({ message: 'Error' }));
        Toast.show({ type: 'error', text1: err.message ?? 'Error' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message ?? 'Error' });
    } finally {
      setSaving(false);
    }
  }, [editName, editEmail, dispatch, t]);

  const handleLogout = useCallback(() => {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  }, [dispatch, t]);

  const roleBadge = user ? getRoleBadge(user.role) : getRoleBadge('STUDENT');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic">
      {/* ===== Profile Header ===== */}
      <View
        style={[
          styles.profileHeader,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Avatar
              name={user?.name ?? 'U'}
              size={80}
            />
            <TouchableOpacity
              style={[
                styles.editAvatarBadge,
                { backgroundColor: colors.primary },
              ]}
              onPress={openEditModal}
              activeOpacity={0.7}>
              <SquarePenIcon size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text
              style={[
                styles.userName,
                { color: colors.text },
              ]}
              numberOfLines={1}>
              {user?.name ?? 'User'}
            </Text>
            <Text
              style={[
                styles.userEmail,
                { color: colors.textSecondary },
              ]}
              numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: roleBadge.bg },
              ]}>
              <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>
                {roleBadge.label}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.editProfileButton,
            { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30' },
          ]}
          activeOpacity={0.7}
          onPress={openEditModal}>
          <SquarePenIcon size={16} color={colors.primary} />
          <Text style={[styles.editProfileText, { color: colors.primary }]}>
            {t('editProfile')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== Preferences Section ===== */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('preferences')}
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          {/* Language */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#6366f118' }]}>
                <GlobeIcon size={18} color="#6366f1" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('language')}
              </Text>
            </View>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  selectedLanguage === 'en'
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                ]}
                onPress={() => void changeLanguage('en')}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        selectedLanguage === 'en'
                          ? '#fff'
                          : colors.text,
                    },
                  ]}>
                  {t('english')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  selectedLanguage === 'fr'
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                ]}
                onPress={() => void changeLanguage('fr')}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        selectedLanguage === 'fr'
                          ? '#fff'
                          : colors.text,
                    },
                  ]}>
                  {t('french')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          {/* Appearance */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: dark ? '#f59e0b18' : '#6366f118' },
                ]}>
                {dark ? (
                  <MoonIcon size={18} color="#f59e0b" />
                ) : (
                  <SunIcon size={18} color="#f59e0b" />
                )}
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('appearance')}
              </Text>
            </View>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  !dark
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                ]}
                onPress={() => dispatch(setLightMode())}
                activeOpacity={0.7}>
                <SunIcon size={14} color={!dark ? '#fff' : colors.muted} />
                <Text
                  style={[
                    styles.chipText,
                    { color: !dark ? '#fff' : colors.text },
                  ]}>
                  {t('lightMode')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  dark
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                ]}
                onPress={() => dispatch(setDarkMode())}
                activeOpacity={0.7}>
                <MoonIcon size={14} color={dark ? '#fff' : colors.muted} />
                <Text
                  style={[
                    styles.chipText,
                    { color: dark ? '#fff' : colors.text },
                  ]}>
                  {t('darkMode')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ===== Account Section ===== */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('account')}
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.infoRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#3b82f618' }]}>
              <UserIcon size={18} color="#3b82f6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('name')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.name ?? '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#22c55e18' }]}>
              <MailIcon size={18} color="#22c55e" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('email')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.email ?? '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ===== Admin Panel (ADMIN only) ===== */}
      {user?.role === 'ADMIN' && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('administration')}
          </Text>

          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 14,
                gap: 10,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AdminPanel')}>
            <View style={[styles.settingIcon, { backgroundColor: '#6366f118' }]}>
              <ShieldCheckIcon size={18} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Admin Panel
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                Manage users, content, flags & more
              </Text>
            </View>
            <ChevronRightIcon size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>
      )}

      {/* ===== Logout ===== */}
      <View style={[styles.sectionContainer, { marginBottom: 40 }]}>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.error + '10',
              borderColor: colors.error + '25',
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <LogOutIcon size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            {t('logout')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== Edit Profile Modal ===== */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            <View style={styles.modalHandle}>
              <View
                style={[
                  styles.handleBar,
                  { backgroundColor: colors.border },
                ]}
              />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('editProfile')}
            </Text>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {t('name')}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t('name')}
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {t('email')}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder={t('email')}
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  {
                    backgroundColor: colors.primary,
                    opacity: saving ? 0.6 : 1,
                  },
                ]}
                onPress={() => void handleSaveProfile()}
                disabled={saving}
                activeOpacity={0.7}>
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  {saving ? '...' : t('save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  /* Profile Header */
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 22,
    ...DefaultStyles.fonts.semiBold,
  },
  userEmail: {
    fontSize: 14,
    ...DefaultStyles.fonts.regular,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    ...DefaultStyles.fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 14,
    ...DefaultStyles.fonts.medium,
  },

  /* Section */
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    ...DefaultStyles.fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },

  /* Card */
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
  },

  /* Settings Row */
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    ...DefaultStyles.fonts.medium,
  },
  separator: {
    height: 0.5,
    marginLeft: 58,
  },

  /* Chips */
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    ...DefaultStyles.fonts.medium,
  },

  /* Info Row */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  infoContent: {
    flex: 1,
    gap: 1,
  },
  infoLabel: {
    fontSize: 12,
    ...DefaultStyles.fonts.regular,
  },
  infoValue: {
    fontSize: 15,
    ...DefaultStyles.fonts.medium,
  },

  /* Logout */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 15,
    ...DefaultStyles.fonts.semiBold,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderWidth: 0.5,
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: 20,
    ...DefaultStyles.fonts.semiBold,
    marginBottom: 20,
  },
  modalForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    ...DefaultStyles.fonts.medium,
    paddingLeft: 4,
  },
  textInput: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    ...DefaultStyles.fonts.regular,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {},
  modalButtonText: {
    fontSize: 15,
    ...DefaultStyles.fonts.semiBold,
  },
});

export default ProfileScreen;
