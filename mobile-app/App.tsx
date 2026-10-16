import { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import {
  AuthSession,
  DEVICE_FINGERPRINT,
  LoginFormInput,
  RegisterFormInput,
  SessionView,
  createApiClient,
} from './src/api/client';
import CheckInScreen from './src/screens/CheckInScreen';
import CourtAssignmentScreen from './src/screens/CourtAssignmentScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const api = createApiClient();

type AuthMode = 'register' | 'login';
type Route = 'profile' | 'checkin' | 'court';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mode, setMode] = useState<AuthMode>('register');
  const [route, setRoute] = useState<Route>('profile');
  const [activeSession, setActiveSession] = useState<SessionView | null>(null);

  async function handleRegister(input: RegisterFormInput): Promise<void> {
    setSession(await api.register({ ...input, deviceFingerprint: DEVICE_FINGERPRINT }));
  }

  async function handleLogin(input: LoginFormInput): Promise<void> {
    setSession(await api.login({ ...input, deviceFingerprint: DEVICE_FINGERPRINT }));
  }

  function handleLogout(): void {
    setSession(null);
    setRoute('profile');
    setActiveSession(null);
  }

  async function handleCheckIn(sessionId: string, qrCode: string): Promise<void> {
    if (!session) {
      return;
    }

    const view = await api.checkIn(sessionId, qrCode, session.accessToken);
    setActiveSession(view);
    setRoute('court');
  }

  return (
    <SafeAreaView style={styles.container}>
      {!session ? (
        mode === 'register' ? (
          <RegisterScreen onSubmit={handleRegister} onSwitchToLogin={() => setMode('login')} />
        ) : (
          <LoginScreen onSubmit={handleLogin} onSwitchToRegister={() => setMode('register')} />
        )
      ) : route === 'checkin' ? (
        <CheckInScreen onCheckIn={handleCheckIn} onCancel={() => setRoute('profile')} />
      ) : route === 'court' && activeSession ? (
        <CourtAssignmentScreen
          sessionId={activeSession.id}
          accessToken={session.accessToken}
          initialSession={activeSession}
          onLeave={() => setRoute('profile')}
        />
      ) : (
        <ProfileScreen
          profile={session.user}
          onCheckIn={() => setRoute('checkin')}
          onLogout={handleLogout}
        />
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
