import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlayerProfile } from '../api/client';

export interface ProfileScreenProps {
  profile: PlayerProfile;
  onLogout: () => void;
}

export default function ProfileScreen({ profile, onLogout }: ProfileScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{profile.name}</Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{profile.ratingTier} badge</Text>
      </View>

      <Text style={styles.status}>
        {profile.provisional
          ? `Provisional · ${profile.provisionalMatches}/${profile.provisionalMatchesRequired} matches`
          : 'Established'}
      </Text>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Doubles</Text>
        <Text style={styles.rowValue}>
          {Math.round(profile.doubles.rating)} ± {Math.round(profile.doubles.rd)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Singles</Text>
        <Text style={styles.rowValue}>
          {Math.round(profile.singles.rating)} ± {Math.round(profile.singles.rd)}
        </Text>
      </View>

      <Pressable onPress={onLogout} style={styles.logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#16a34a',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  status: {
    fontSize: 16,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  logout: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
