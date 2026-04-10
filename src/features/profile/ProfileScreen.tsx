import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import {
  Alert,
  AppState,
  type AppStateStatus,
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
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchCurrentUser } from '@/lib/services/BacApi';
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
import {
  LAW_LEVELS,
  LAW_MAJORS,
  LAW_REGIONS,
  LAW_UNIVERSITIES_BY_REGION,
  type LawRegion,
} from '../../../backend/src/constants/lawOnboarding';

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { dark, colors } = useAppSelector(selectTheme);
  const user = useAppSelector(selectAuthUser);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editEmail, setEditEmail] = useState(user?.email ?? '');
  const [editLawRegion, setEditLawRegion] = useState<LawRegion | null>((user?.lawRegion as LawRegion) ?? null);
  const [editLawUniversity, setEditLawUniversity] = useState(user?.lawUniversity ?? '');
  const [editLawMajor, setEditLawMajor] = useState<'DROIT_PRIVE' | 'DROIT_PUBLIC' | null>(user?.lawMajor ?? null);
  const [editLawAcademicLevel, setEditLawAcademicLevel] = useState<'L1' | 'L2' | 'L3' | null>(user?.lawAcademicLevel ?? null);
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

  const refreshProfileFromServer = useCallback(async () => {
    if (!user?.id) return;
    try {
      const next = await fetchCurrentUser();
      dispatch(updateUser(next));
    } catch {
      /* offline or expired session */
    }
  }, [user?.id, dispatch]);

  useFocusEffect(
    useCallback(() => {
      void refreshProfileFromServer();
    }, [refreshProfileFromServer]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void refreshProfileFromServer();
    });
    return () => sub.remove();
  }, [refreshProfileFromServer]);

  const openEditModal = useCallback(() => {
    setEditName(user?.name ?? '');
    setEditEmail(user?.email ?? '');
    setEditLawRegion((user?.lawRegion as LawRegion) ?? null);
    setEditLawUniversity(user?.lawUniversity ?? '');
    setEditLawMajor(user?.lawMajor ?? null);
    setEditLawAcademicLevel(user?.lawAcademicLevel ?? null);
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
            lawRegion: editLawRegion,
            lawUniversity: editLawUniversity.trim() || undefined,
            lawMajor: editLawMajor,
            lawAcademicLevel: editLawAcademicLevel,
          }),
        },
      });
      if (resp.ok) {
        const updated = await resp.json();
        dispatch(
          updateUser({
            ...user!,
            id: updated.id,
            name: updated.name,
            email: updated.email,
            role: updated.role,
            subscriptionTier: updated.subscriptionTier,
            language: updated.language,
            lawRegion: updated.lawRegion,
            lawUniversity: updated.lawUniversity,
            lawMajor: updated.lawMajor,
            lawAcademicLevel: updated.lawAcademicLevel,
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
  }, [user, editEmail, editLawAcademicLevel, editLawMajor, editLawRegion, editLawUniversity, editName, dispatch, t]);

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
  const majorLabel =
    user?.lawMajor === 'DROIT_PRIVE'
      ? (selectedLanguage === 'fr' ? 'Droit Prive' : 'Private Law')
      : user?.lawMajor === 'DROIT_PUBLIC'
        ? (selectedLanguage === 'fr' ? 'Droit Public' : 'Public Law')
        : '-';

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
            {user?.role === 'STUDENT' ? (
              <View
                style={[
                  styles.tierBadge,
                  {
                    backgroundColor:
                      user.subscriptionTier === 'PREMIUM'
                        ? '#a855f722'
                        : colors.border + '44',
                    borderColor:
                      user.subscriptionTier === 'PREMIUM' ? '#a855f755' : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.tierBadgeText,
                    {
                      color:
                        user.subscriptionTier === 'PREMIUM' ? '#a855f7' : colors.muted,
                    },
                  ]}>
                  {user.subscriptionTier === 'PREMIUM'
                    ? t('subscriptionTierPremium')
                    : t('subscriptionTierFree')}
                </Text>
              </View>
            ) : null}
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

      {user?.role === 'TEACHER' && (!user.lawRegion || !user.lawUniversity) && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openEditModal}
          style={[
            styles.teacherLawBanner,
            { backgroundColor: '#f59e0b22', borderColor: '#f59e0b55' },
          ]}>
          <Text style={[styles.teacherLawBannerTitle, { color: colors.text }]}>
            {selectedLanguage === 'fr'
              ? 'Faculte de droit requise'
              : 'Law faculty required'}
          </Text>
          <Text style={[styles.teacherLawBannerSub, { color: colors.muted }]}>
            {selectedLanguage === 'fr'
              ? 'Indiquez votre region et universite pour le contenu droit.'
              : 'Set your law region and university to use law teaching features.'}
          </Text>
          <Text style={[styles.teacherLawBannerCta, { color: '#d97706' }]}>
            {selectedLanguage === 'fr' ? 'Completer le profil' : 'Complete profile'}
          </Text>
        </TouchableOpacity>
      )}

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

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#8b5cf618' }]}>
              <UserIcon size={18} color="#8b5cf6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {selectedLanguage === 'fr' ? 'Region' : 'Region'}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.lawRegion ?? '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#ec489918' }]}>
              <UserIcon size={18} color="#ec4899" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {selectedLanguage === 'fr' ? 'Universite' : 'University'}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.lawUniversity ?? '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#f59e0b18' }]}>
              <UserIcon size={18} color="#f59e0b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {selectedLanguage === 'fr' ? 'Specialite' : 'Major'}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {majorLabel}
              </Text>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#06b6d418' }]}>
              <UserIcon size={18} color="#06b6d4" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {selectedLanguage === 'fr' ? "Niveau d'etudes" : 'Academic level'}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.lawAcademicLevel ?? '-'}
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

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {selectedLanguage === 'fr' ? 'Region' : 'Region'}
                </Text>
                <View style={styles.chipWrap}>
                  {LAW_REGIONS.map(region => (
                    <TouchableOpacity
                      key={region}
                      style={[
                        styles.chip,
                        editLawRegion === region
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                      ]}
                      onPress={() => {
                        setEditLawRegion(region);
                        setEditLawUniversity('');
                      }}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, { color: editLawRegion === region ? '#fff' : colors.text }]}>
                        {region}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {selectedLanguage === 'fr' ? 'Universite' : 'University'}
                </Text>
                <View style={styles.chipWrap}>
                  {(editLawRegion ? LAW_UNIVERSITIES_BY_REGION[editLawRegion] : []).map(university => (
                    <TouchableOpacity
                      key={university}
                      style={[
                        styles.chip,
                        editLawUniversity === university
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                      ]}
                      onPress={() => setEditLawUniversity(university)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, { color: editLawUniversity === university ? '#fff' : colors.text }]}>
                        {university}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {selectedLanguage === 'fr' ? 'Specialite' : 'Major'}
                </Text>
                <View style={styles.chipWrap}>
                  {LAW_MAJORS.map(major => (
                    <TouchableOpacity
                      key={major}
                      style={[
                        styles.chip,
                        editLawMajor === major
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                      ]}
                      onPress={() => setEditLawMajor(major)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, { color: editLawMajor === major ? '#fff' : colors.text }]}>
                        {major === 'DROIT_PRIVE'
                          ? (selectedLanguage === 'fr' ? 'Droit Prive' : 'Private Law')
                          : (selectedLanguage === 'fr' ? 'Droit Public' : 'Public Law')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {selectedLanguage === 'fr' ? "Niveau d'etudes" : 'Academic level'}
                </Text>
                <View style={styles.chipWrap}>
                  {LAW_LEVELS.map(level => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.chip,
                        editLawAcademicLevel === level
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 },
                      ]}
                      onPress={() => setEditLawAcademicLevel(level)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, { color: editLawAcademicLevel === level ? '#fff' : colors.text }]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
  tierBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 12,
    ...DefaultStyles.fonts.semiBold,
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
  teacherLawBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  teacherLawBannerTitle: {
    fontSize: 15,
    ...DefaultStyles.fonts.semiBold,
  },
  teacherLawBannerSub: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  teacherLawBannerCta: {
    fontSize: 13,
    ...DefaultStyles.fonts.semiBold,
    marginTop: 10,
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
