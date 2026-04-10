import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchIcon } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { ErrorView } from '@/components/ui/ErrorView';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import { RootStackParamList } from '@/navigations';
import { getSubjects } from '@/lib/services/BacApi';
import {
  getTeacherLawAssignments,
  setTeacherLawSubject,
  removeTeacherLawAssignment,
} from '@/lib/services/AdminApi';
import type { BACSubject } from '@/lib/models';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherLawSubjects'>;

type AssignmentRow = {
  id: string;
  subjectId: string;
  subject: { nameEn: string; nameFr: string; lawUniversity: string | null };
};

const TeacherLawSubjectsScreen = ({ route }: Props) => {
  const { teacherId, teacherName, lawUniversity } = route.params;
  const { colors } = useAppSelector(selectTheme);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: subjects = [], isLoading: subLoading, error: subError } = useQuery({
    queryKey: ['subjects'],
    queryFn: ({ signal }) => getSubjects(signal),
  });

  const { data: assignments = [], isLoading: asgLoading, error: asgError } = useQuery({
    queryKey: ['teacher-law', teacherId],
    queryFn: () => getTeacherLawAssignments(teacherId),
  });

  const assignedSet = useMemo(
    () => new Set(assignments.map((a: AssignmentRow) => a.subjectId)),
    [assignments],
  );

  const assignmentIdBySubject = useMemo(() => {
    const m = new Map<string, string>();
    assignments.forEach((a: AssignmentRow) => m.set(a.subjectId, a.id));
    return m;
  }, [assignments]);

  const lawSubjects = useMemo(() => {
    return subjects.filter((s: BACSubject) => {
      if (s.programType !== 'LAW') return false;
      if (!lawUniversity) return true;
      return s.lawUniversity === lawUniversity;
    });
  }, [subjects, lawUniversity]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lawSubjects;
    return lawSubjects.filter(
      s =>
        s.nameEn.toLowerCase().includes(q) ||
        s.nameFr.toLowerCase().includes(q),
    );
  }, [lawSubjects, search]);

  const toggle = useCallback(
    async (subjectId: string, next: boolean) => {
      setBusyId(subjectId);
      try {
        if (next) {
          await setTeacherLawSubject(teacherId, subjectId);
        } else {
          const aid = assignmentIdBySubject.get(subjectId);
          if (aid) await removeTeacherLawAssignment(aid);
        }
        await queryClient.invalidateQueries({ queryKey: ['teacher-law', teacherId] });
      } finally {
        setBusyId(null);
      }
    },
    [assignmentIdBySubject, queryClient, teacherId],
  );

  const loading = subLoading || asgLoading;
  const error = subError || asgError;

  if (!lawUniversity) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.muted, textAlign: 'center', padding: 24 }}>
          This teacher has no law faculty on file. Edit their profile (law university) first, then
          assign subjects. Until assignments exist, they may post to any subject at their faculty.
        </Text>
      </View>
    );
  }

  if (error && !filtered.length) {
    return (
      <ErrorView
        error={error}
        action={() => {
          queryClient.invalidateQueries({ queryKey: ['subjects'] });
          queryClient.invalidateQueries({ queryKey: ['teacher-law', teacherId] });
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>{teacherName}</Text>
      <Text style={[styles.sub, { color: colors.muted }]} numberOfLines={2}>
        {lawUniversity}
      </Text>
      <Text style={[styles.hint, { color: colors.muted }]}>
        Toggle ON to restrict this teacher to specific modules. If none are ON, they can post to any
        law subject at this faculty.
      </Text>

      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SearchIcon size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Filter subjects..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading && !filtered.length ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const on = assignedSet.has(item.id);
            const busy = busyId === item.id;
            return (
              <View
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                    {item.nameEn}
                  </Text>
                  <Text style={[styles.fr, { color: colors.muted }]} numberOfLines={2}>
                    {item.nameFr}
                  </Text>
                </View>
                {busy ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Switch value={on} onValueChange={v => toggle(item.id, v)} />
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 24 }}>
              No law subjects for this faculty in the database.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  heading: { fontSize: 18, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16 },
  sub: { fontSize: 12, paddingHorizontal: 16, marginTop: 4 },
  hint: { fontSize: 12, paddingHorizontal: 16, marginTop: 10, lineHeight: 18 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: { fontSize: 14, fontWeight: '600' },
  fr: { fontSize: 12, marginTop: 2 },
});

export default TeacherLawSubjectsScreen;
