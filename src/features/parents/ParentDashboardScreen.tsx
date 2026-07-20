import React, { useEffect, useState } from 'react';
import { View, FlatList, TextInput, Button, Alert } from 'react-native';
import { Text } from '../../components/ui/Text';
import { makeApiRequest } from '../../lib/makeApiRequest';
import { useAppSelector } from '../../lib/hooks';
import { textAlign, dirRow } from '../../lib/rtl';

export default function ParentDashboardScreen() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');

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

  async function invite() {
    if (!inviteEmail) return Alert.alert('Email required');
    try {
      const resp = await makeApiRequest({ url: '/api/parents/invite', method: 'POST', body: { email: inviteEmail } });
      if (resp.ok) {
        const body = await resp.json();
        Alert.alert('Invite created', `Invite code: ${body.inviteCode}`);
        setInviteEmail('');
        // refresh
        const r2 = await makeApiRequest({ url: '/api/parents/students' });
        const b2 = await r2.json();
        setStudents(b2.students || []);
      } else {
        const err = await resp.json();
        Alert.alert('Error', err.message || 'Failed to invite');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to invite');
    }
  }

  async function unlink(studentId: string) {
    try {
      const resp = await makeApiRequest({ url: '/api/parents/unlink', method: 'POST', body: { studentId } });
      if (resp.ok) {
        setStudents(students.filter(s => s.id !== studentId));
      } else {
        const err = await resp.json();
        Alert.alert('Error', err.message || 'Failed to unlink');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to unlink');
    }
  }

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
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee', flexDirection: dirRow(), justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, textAlign: textAlign('left') }}>{item.name}</Text>
                <Text style={{ color: '#666', textAlign: textAlign('left') }}>{item.email}</Text>
                <Text style={{ color: '#666', textAlign: textAlign('left') }}>XP: {item.xp} — Streak: {item.currentStreak}</Text>
                <Text style={{ color: '#666', textAlign: textAlign('left') }}>Invite: {item.inviteCode}</Text>
              </View>
              <View style={{ marginLeft: 8 }}>
                <Button title="Unlink" onPress={() => unlink(item.id)} />
              </View>
            </View>
          )}
        />
      )}
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 16, marginBottom: 8, textAlign: textAlign('left') }}>Invite a student by email</Text>
        <TextInput value={inviteEmail} onChangeText={setInviteEmail} placeholder="student@example.com" style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8, textAlign: textAlign('left') }} />
        <Button title="Create Invite" onPress={invite} />
      </View>
    </View>
  );
}
