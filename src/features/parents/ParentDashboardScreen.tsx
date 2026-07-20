import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text } from '../../components/ui/Text';
import { makeApiRequest } from '../../lib/makeApiRequest';
import { useAppSelector } from '../../lib/hooks';

export default function ParentDashboardScreen() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const resp = await makeApiRequest({ url: '/api/parents/students' });
        if (resp.ok) {
          const body = await resp.json();
          if (mounted) setStudents(body.students || []);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Linked Students</Text>
      {loading ? (
        <Text>Loading…</Text>
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={{ color: '#666' }}>{item.email}</Text>
              <Text style={{ color: '#666' }}>XP: {item.xp} — Streak: {item.currentStreak}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
