import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export interface CheckInScreenProps {
  onCheckIn: (sessionId: string, qrCode: string) => Promise<void>;
  onCancel: () => void;
}

export interface CheckInPayload {
  sessionId: string;
  qrCode: string;
}

function parseJson(raw: string): CheckInPayload | null {
  try {
    const value = JSON.parse(raw) as { sessionId?: unknown; qrCode?: unknown };

    if (typeof value.sessionId === 'string' && typeof value.qrCode === 'string') {
      return { sessionId: value.sessionId, qrCode: value.qrCode };
    }
  } catch {
    return null;
  }

  return null;
}

function parseCheckInPayload(raw: string): CheckInPayload | null {
  const trimmed = raw.trim();
  const fromJson = parseJson(trimmed);

  if (fromJson) {
    return fromJson;
  }

  const [sessionId, qrCode] = trimmed.split('|');

  if (sessionId && qrCode) {
    return { sessionId: sessionId.trim(), qrCode: qrCode.trim() };
  }

  return null;
}

export default function CheckInScreen({ onCheckIn, onCancel }: CheckInScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [sessionId, setSessionId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);

  async function submit(id: string, code: string): Promise<void> {
    setError(null);
    setSubmitting(true);

    try {
      await onCheckIn(id, code);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleScan(data: string): void {
    if (locked) {
      return;
    }

    const parsed = parseCheckInPayload(data);

    if (!parsed) {
      setError('That QR code is not a Picklesch check-in code');
      return;
    }

    setLocked(true);
    setSessionId(parsed.sessionId);
    setQrCode(parsed.qrCode);
    void submit(parsed.sessionId, parsed.qrCode);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check in to a session</Text>

      {permission?.granted ? (
        <View style={styles.cameraFrame}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => handleScan(data)}
          />
        </View>
      ) : (
        <Pressable style={styles.permission} onPress={() => void requestPermission()}>
          <Text style={styles.permissionText}>Enable the camera to scan the QR code</Text>
        </Pressable>
      )}

      <Text style={styles.manualLabel}>Or enter it manually</Text>
      <TextInput
        style={styles.input}
        placeholder="Session ID"
        autoCapitalize="none"
        autoCorrect={false}
        value={sessionId}
        onChangeText={setSessionId}
      />
      <TextInput
        style={styles.input}
        placeholder="QR code"
        autoCapitalize="none"
        autoCorrect={false}
        value={qrCode}
        onChangeText={setQrCode}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.submit, submitting && styles.submitDisabled]}
        disabled={submitting}
        onPress={() => void submit(sessionId, qrCode)}
      >
        <Text style={styles.submitText}>{submitting ? 'Checking in…' : 'Check in'}</Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  cameraFrame: {
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  permission: {
    height: 240,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  manualLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
  },
  submit: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
