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
import { Text } from '@/components/ui/Text';
import { Loading } from '@/components/ui/Loading';
import { ErrorView } from '@/components/ui/ErrorView';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigations';
import {
  getTeacherScopes,
  createTeacherScope,
  deleteTeacherScope,
  TeacherScopeItem,
} from '@/lib/services/AdminApi';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherScopes'>;

type EducationLevel = 'HIGH_SCHOOL' | 'UNIVERSITY';
type StreamType = 'SCIENTIFIC' | 'LITERARY' | 'ECONOMIC' | 'TECHNICAL';

const EDUCATION_LEVELS: { value: EducationLevel; label: string; icon: string }[] = [
  { value: 'HIGH_SCHOOL', label: 'High School', icon: '🏫' },
  { value: 'UNIVERSITY', label: 'University', icon: '🎓' },
];

const HIGH_SCHOOL_GRADES = [
  { value: 1, label: '1ère année' },
  { value: 2, label: '2ème année' },
  { value: 3, label: 'Terminale' },
];

const UNIVERSITY_YEARS = [
  { value: 1, label: 'Year 1' },
  { value: 2, label: 'Year 2' },
  { value: 3, label: 'Year 3' },
  { value: 4, label: 'Year 4' },
  { value: 5, label: 'Year 5' },
];

const STREAMS: { value: StreamType; label: string; icon: string }[] = [
  { value: 'SCIENTIFIC', label: 'Scientific', icon: '🔬' },
  { value: 'LITERARY', label: 'Literary', icon: '📚' },
  { value: 'ECONOMIC', label: 'Economic', icon: '💰' },
  { value: 'TECHNICAL', label: 'Technical', icon: '⚙️' },
];

const TeacherScopesScreen = ({ route }: Props) => {
  const { teacherId, teacherName } = route.params;
  const { colors } = useAppSelector(selectTheme);
  const queryClient = useQueryClient();

  // Add form state
  const [newLevel, setNewLevel] = useState<EducationLevel | null>(null);
  const [newGrade, setNewGrade] = useState<number | null>(null);
  const [newYear, setNewYear] = useState<number | null>(null);
  const [newStream, setNewStream] = useState<StreamType | null>(null);

  const { data: scopes, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-scopes', teacherId],
    queryFn: () => getTeacherScopes(teacherId),
  });

  const handleRevoke = useCallback(
    (scope: TeacherScopeItem) => {
      Alert.alert('Revoke Permission', 'Remove this teaching scope?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTeacherScope(scope.id);
              queryClient.invalidateQueries({ queryKey: ['teacher-scopes', teacherId] });
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]);
    },
    [queryClient, teacherId],
  );

  const handleGrant = useCallback(async () => {
    if (!newLevel || !newStream) {
      Alert.alert('Error', 'Please select level and stream.');
      return;
    }
    if (newLevel === 'HIGH_SCHOOL' && newGrade == null) {
      Alert.alert('Error', 'Please select a grade.');
      return;
    }
    if (newLevel === 'UNIVERSITY' && newYear == null) {
      Alert.alert('Error', 'Please select a year.');
      return;
    }

    try {
      await createTeacherScope({
        teacherId,
        educationLevel: newLevel,
        grade: newLevel === 'HIGH_SCHOOL' ? newGrade : null,
        universityYear: newLevel === 'UNIVERSITY' ? newYear : null,
        stream: newStream,
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-scopes', teacherId] });
      setNewLevel(null);
      setNewGrade(null);
      setNewYear(null);
      setNewStream(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [newLevel, newGrade, newYear, newStream, teacherId, queryClient]);

  const formatScope = (s: TeacherScopeItem) => {
    const levelIcon = s.educationLevel === 'HIGH_SCHOOL' ? '🏫' : '🎓';
    const levelLabel = s.educationLevel === 'HIGH_SCHOOL' ? 'High School' : 'University';
    const gradeLabel =
      s.educationLevel === 'HIGH_SCHOOL' && s.grade != null
        ? (HIGH_SCHOOL_GRADES.find(g => g.value === s.grade)?.label ?? `Grade ${s.grade}`)
        : s.universityYear != null
        ? `Year ${s.universityYear}`
        : '';
    const streamInfo = STREAMS.find(st => st.value === s.stream);
    const streamLabel = streamInfo ? `${streamInfo.icon} ${streamInfo.label}` : s.stream;

    return `${levelIcon} ${levelLabel} → ${gradeLabel} → ${streamLabel}`;
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorView error={error} action={() => { refetch(); }} />;

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={scopes ?? []}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <>
          <Text style={[styles.header, { color: colors.text }]}>{teacherName}</Text>
          <Text style={[styles.subheader, { color: colors.muted }]}>
            Current Permissions
          </Text>
        </>
      }
      renderItem={({ item }) => (
        <View
          style={[styles.scopeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.scopeText, { color: colors.text, flex: 1 }]}>
            {formatScope(item)}
          </Text>
          <TouchableOpacity
            style={[styles.revokeBtn, { backgroundColor: '#ef444420' }]}
            onPress={() => handleRevoke(item)}>
            <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>
              ✕ Revoke
            </Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          No scopes assigned yet. Add permissions below.
        </Text>
      }
      ListFooterComponent={
        <View style={[styles.addSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.addTitle, { color: colors.text }]}>+ Add Permission</Text>

          {/* Level */}
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Level:</Text>
          <View style={styles.chipRow}>
            {EDUCATION_LEVELS.map(l => (
              <TouchableOpacity
                key={l.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: newLevel === l.value ? colors.primary : colors.inputBackground,
                    borderColor: newLevel === l.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setNewLevel(l.value);
                  setNewGrade(null);
                  setNewYear(null);
                }}>
                <Text
                  style={{
                    color: newLevel === l.value ? '#fff' : colors.text,
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                  {l.icon} {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Grade / Year */}
          {newLevel === 'HIGH_SCHOOL' && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Grade:</Text>
              <View style={styles.chipRow}>
                {HIGH_SCHOOL_GRADES.map(g => (
                  <TouchableOpacity
                    key={g.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: newGrade === g.value ? colors.primary : colors.inputBackground,
                        borderColor: newGrade === g.value ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setNewGrade(g.value)}>
                    <Text
                      style={{
                        color: newGrade === g.value ? '#fff' : colors.text,
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {newLevel === 'UNIVERSITY' && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Year:</Text>
              <View style={styles.chipRow}>
                {UNIVERSITY_YEARS.map(y => (
                  <TouchableOpacity
                    key={y.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: newYear === y.value ? colors.primary : colors.inputBackground,
                        borderColor: newYear === y.value ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setNewYear(y.value)}>
                    <Text
                      style={{
                        color: newYear === y.value ? '#fff' : colors.text,
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                      {y.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Stream */}
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Stream:</Text>
          <View style={styles.chipRow}>
            {STREAMS.map(s => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: newStream === s.value ? colors.primary : colors.inputBackground,
                    borderColor: newStream === s.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setNewStream(s.value)}>
                <Text
                  style={{
                    color: newStream === s.value ? '#fff' : colors.text,
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                  {s.icon} {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.grantBtn, { backgroundColor: colors.primary }]}
            onPress={() => void handleGrant()}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
              Grant Access
            </Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subheader: { fontSize: 14, marginBottom: 16 },
  scopeCard: {
    flexDirection: dirRow(),
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  scopeText: { fontSize: 13 },
  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
  },
  emptyText: { textAlign: 'center', marginVertical: 20, fontSize: 13 },
  addSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  addTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  chipRow: { flexDirection: dirRow(), flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  grantBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default TeacherScopesScreen;
