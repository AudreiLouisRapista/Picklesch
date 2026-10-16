import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SessionView, createApiClient } from '../api/client';
import { createSessionSocket } from '../realtime/sessionSocket';

const api = createApiClient();

export interface CourtAssignmentScreenProps {
  sessionId: string;
  accessToken: string;
  initialSession?: SessionView;
  onLeave: () => void;
}

export default function CourtAssignmentScreen({
  sessionId,
  accessToken,
  initialSession,
  onLeave,
}: CourtAssignmentScreenProps) {
  const [session, setSession] = useState<SessionView | null>(initialSession ?? null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .fetchSession(sessionId, accessToken)
      .then((view) => {
        if (active) {
          setSession(view);
        }
      })
      .catch(() => undefined);

    const socket = createSessionSocket(accessToken);
    socket.on('connect', () => {
      setLive(true);
      socket.emit('session:join', sessionId);
    });
    socket.on('disconnect', () => setLive(false));
    socket.on('court:assigned', (payload: { session: SessionView }) => {
      if (active) {
        setSession(payload.session);
      }
    });

    return () => {
      active = false;
      socket.close();
    };
  }, [sessionId, accessToken]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{session ? session.name : 'Session'}</Text>
      <Text style={styles.live}>{live ? '● Live' : 'Connecting…'}</Text>

      {session?.viewer.courtLabel ? (
        <Text style={styles.assignment}>You are on {session.viewer.courtLabel}</Text>
      ) : session?.viewer.waitlistPosition ? (
        <Text style={styles.assignment}>
          You are waitlisted · position {session.viewer.waitlistPosition}
        </Text>
      ) : (
        <Text style={styles.assignment}>
          {session?.viewer.checkedIn ? 'Waiting for the next formation…' : 'Not checked in'}
        </Text>
      )}

      {session?.courts.map((court) => (
        <View key={court.label} style={styles.court}>
          <Text style={styles.courtLabel}>{court.label}</Text>
          {court.players.map((player) => (
            <View key={player.id} style={styles.playerRow}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerRating}>
                {player.tier} · {Math.round(player.rating)}
              </Text>
            </View>
          ))}
        </View>
      ))}

      {session && session.waitlist.length > 0 ? (
        <View style={styles.court}>
          <Text style={styles.courtLabel}>Waitlist</Text>
          {session.waitlist.map((entry) => (
            <View key={entry.player.id} style={styles.playerRow}>
              <Text style={styles.playerName}>
                {entry.position}. {entry.player.name}
              </Text>
              <Text style={styles.playerRating}>{Math.round(entry.player.rating)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable style={styles.leave} onPress={onLeave}>
        <Text style={styles.leaveText}>Back to profile</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  live: {
    fontSize: 14,
    color: '#16a34a',
  },
  assignment: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  court: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  courtLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerName: {
    fontSize: 16,
    color: '#111827',
  },
  playerRating: {
    fontSize: 16,
    color: '#6b7280',
  },
  leave: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  leaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
