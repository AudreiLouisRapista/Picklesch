import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError, RegisterFormInput, SELECTABLE_TIERS, SelectableTier } from '../api/client';

export interface RegisterScreenProps {
  onSubmit: (input: RegisterFormInput) => Promise<void>;
  onSwitchToLogin: () => void;
}

const DEFAULT_TIER: SelectableTier = '3.0';

export default function RegisterScreen({ onSubmit, onSwitchToLogin }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState<SelectableTier>(DEFAULT_TIER);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({ name, email, password, tier });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Picklesch</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.label}>Skill tier</Text>
      <View style={styles.tierRow}>
        {SELECTABLE_TIERS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setTier(option)}
            style={[styles.tier, tier === option && styles.tierSelected]}
          >
            <Text style={[styles.tierText, tier === option && styles.tierTextSelected]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={handleSubmit} disabled={submitting} style={styles.submit}>
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitText}>Create account</Text>
        )}
      </Pressable>

      <Pressable onPress={onSwitchToLogin} style={styles.switch}>
        <Text style={styles.switchText}>Already have an account? Log in</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  tierRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tier: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tierSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  tierText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tierTextSelected: {
    color: '#ffffff',
  },
  error: {
    color: '#dc2626',
  },
  submit: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  switch: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    color: '#16a34a',
    fontWeight: '600',
  },
});
