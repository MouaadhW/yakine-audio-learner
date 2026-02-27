import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  UsersIcon,
  ShieldCheckIcon,
  BarChart3Icon,
  DatabaseIcon,
  BellIcon,
  FlagIcon,
  FileTextIcon,
} from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import { RootStackParamList } from '@/navigations';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminPanel'>;

const MENU_ITEMS = [
  {
    key: 'UserManagement',
    title: 'User Management',
    subtitle: 'List, search, change roles, ban/unban accounts',
    icon: UsersIcon,
    color: '#6366f1',
  },
  {
    key: 'ContentManagement',
    title: 'Content Management',
    subtitle: 'Edit or remove lessons / posts',
    icon: FileTextIcon,
    color: '#14b8a6',
  },
  {
    key: 'Moderation',
    title: 'Content Moderation',
    subtitle: 'Review teacher-submitted lessons before publishing',
    icon: ShieldCheckIcon,
    color: '#f59e0b',
  },
  {
    key: 'Stats',
    title: 'System Stats',
    subtitle: 'Dashboard with users, lessons, activity overview',
    icon: BarChart3Icon,
    color: '#22c55e',
  },
  {
    key: 'BulkImportExport',
    title: 'Bulk Import / Export',
    subtitle: 'Import/export subjects, chapters, lessons as JSON',
    icon: DatabaseIcon,
    color: '#8b5cf6',
  },
  {
    key: 'Announcements',
    title: 'Announcements',
    subtitle: 'Post banners visible to all users',
    icon: BellIcon,
    color: '#3b82f6',
  },
  {
    key: 'FeatureFlags',
    title: 'Feature Flags',
    subtitle: 'Toggle features per environment without a deploy',
    icon: FlagIcon,
    color: '#ef4444',
  },
] as const;

const AdminPanelScreen = ({ navigation }: Props) => {
  const { colors } = useAppSelector(selectTheme);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.header, { color: colors.text }]}>Admin Panel</Text>
      <Text style={[styles.subheader, { color: colors.muted }]}>
        Manage your application from here
      </Text>

      {MENU_ITEMS.map(item => {
        const Icon = item.icon;
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.key as any)}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '18' }]}>
              <Icon size={24} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subheader: { fontSize: 14, marginBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 13, marginTop: 2 },
});

export default AdminPanelScreen;
