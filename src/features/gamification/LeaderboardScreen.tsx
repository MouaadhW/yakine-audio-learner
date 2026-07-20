import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { dirRow } from '@/lib/rtl';
import { Text } from '@/components/ui/Text';
import { useQuery } from '@tanstack/react-query';
import { GamificationApi } from '@/lib/services/GamificationApi';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import { selectAuthUser } from '@/features/auth/authSlice';
import { LeaderboardEntry } from '@/lib/models';
import { Flame, Trophy } from 'lucide-react-native';

export default function LeaderboardScreen() {
  const { colors } = useAppSelector(selectTheme);
  const user = useAppSelector(selectAuthUser);

  const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => GamificationApi.getLeaderboard(),
    staleTime: 60 * 1000, // cache for 1 minute
  });

  const { data: myStats } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: () => GamificationApi.getMyStats(),
    staleTime: 60 * 1000,
  });

  const renderRankItem = ({ item }: { item: LeaderboardEntry }) => {
    const isMe = item.id === user?.id;
    let rankColor = colors.text;
    if (item.rank === 1) rankColor = '#fbbf24'; // Gold
    else if (item.rank === 2) rankColor = '#94a3b8'; // Silver
    else if (item.rank === 3) rankColor = '#b45309'; // Bronze

    return (
      <View style={[styles.rankItem, { backgroundColor: isMe ? colors.primary + '20' : colors.card, borderColor: colors.border }]}>
        <View style={styles.rankCol}>
          <Text style={[styles.rankText, { color: rankColor }]}>#{item.rank}</Text>
        </View>
        <View style={styles.nameCol}>
          <Text style={[styles.nameText, { color: colors.text, fontWeight: isMe ? 'bold' : 'normal' }]}>
            {item.name} {isMe && '(You)'}
          </Text>
        </View>
        <View style={styles.statsCol}>
          <Text style={[styles.statText, { color: colors.text }]}>{item.xp} XP</Text>
          <View style={styles.streakRow}>
            <Flame size={14} color="#f97316" />
            <Text style={[styles.statText, { color: colors.muted, marginLeft: 2 }]}>{item.currentStreak}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {myStats && (
        <View style={[styles.myStatsCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.myStatsTitle}>My Progress</Text>
          <View style={styles.myStatsRow}>
            <View style={styles.myStatBox}>
              <Text style={styles.myStatValue}>{myStats.xp}</Text>
              <Text style={styles.myStatLabel}>Total XP</Text>
            </View>
            <View style={styles.myStatBox}>
              <Text style={styles.myStatValue}>{myStats.currentStreak}</Text>
              <Text style={styles.myStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.myStatBox}>
              <Text style={styles.myStatValue}>{myStats.longestStreak}</Text>
              <Text style={styles.myStatLabel}>Longest</Text>
            </View>
          </View>
          {myStats.badges && myStats.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              <Text style={styles.badgesTitle}>My Badges</Text>
              <View style={styles.badgesList}>
                {myStats.badges.map((b: any) => (
                  <View key={b.id} style={styles.badgeItem}>
                    <Text style={styles.badgeIcon}>{b.badge.icon}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.leaderboardTitleRow}>
        <Trophy size={20} color="#fbbf24" />
        <Text style={[styles.leaderboardTitle, { color: colors.text }]}>Top 50 Students</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loadingLeaderboard ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderRankItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  header: { marginBottom: 20 },
  myStatsCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  myStatsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  myStatsRow: {
    flexDirection: dirRow(),
    justifyContent: 'space-between',
  },
  myStatBox: {
    alignItems: 'center',
  },
  myStatValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  myStatLabel: {
    color: '#fff',
    opacity: 0.8,
    fontSize: 12,
    marginTop: 4,
  },
  badgesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  badgesTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  badgesList: {
    flexDirection: dirRow(),
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeItem: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 20,
  },
  leaderboardTitleRow: {
    flexDirection: dirRow(),
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rankItem: {
    flexDirection: dirRow(),
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  rankCol: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nameCol: {
    flex: 1,
    paddingHorizontal: 12,
  },
  nameText: {
    fontSize: 15,
  },
  statsCol: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakRow: {
    flexDirection: dirRow(),
    alignItems: 'center',
    marginTop: 4,
  },
});
