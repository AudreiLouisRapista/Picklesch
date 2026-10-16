import { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import {
  AuthSession,
  DEVICE_FINGERPRINT,
  LoginFormInput,
  RegisterFormInput,
  createApiClient,
} from './src/api/client';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const api = createApiClient();

type AuthMode = 'register' | 'login';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mode, setMode] = useState<AuthMode>('register');

  async function handleRegister(input: RegisterFormInput): Promise<void> {
    setSession(await api.register({ ...input, deviceFingerprint: DEVICE_FINGERPRINT }));
  }

  async function handleLogin(input: LoginFormInput): Promise<void> {
    setSession(await api.login({ ...input, deviceFingerprint: DEVICE_FINGERPRINT }));
  }

  function handleLogout(): void {
    setSession(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      {session ? (
        <ProfileScreen profile={session.user} onLogout={handleLogout} />
      ) : mode === 'register' ? (
        <RegisterScreen onSubmit={handleRegister} onSwitchToLogin={() => setMode('login')} />
      ) : (
        <LoginScreen onSubmit={handleLogin} onSwitchToRegister={() => setMode('register')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
