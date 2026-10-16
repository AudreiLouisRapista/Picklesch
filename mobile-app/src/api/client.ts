export const DEFAULT_BASE_URL = 'http://localhost:4000/api/v1';

export const DEVICE_FINGERPRINT = `mobile-${Math.random().toString(36).slice(2, 10)}`;

export type SelectableTier = '2.5' | '3.0' | '3.5' | '4.0';

export const SELECTABLE_TIERS: readonly SelectableTier[] = ['2.5', '3.0', '3.5', '4.0'];

export interface RatingState {
  rating: number;
  rd: number;
  volatility: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  email: string;
  tier: SelectableTier;
  ratingTier: string;
  provisional: boolean;
  provisionalMatches: number;
  provisionalMatchesRequired: number;
  selfSelectionValidated: boolean;
  matchesPlayed: number;
  doubles: RatingState;
  singles: RatingState;
}

export interface AuthSession {
  user: PlayerProfile;
  accessToken: string;
  refreshToken: string;
}

export type SessionFormat = 'doubles' | 'singles';

export interface SessionPlayer {
  id: string;
  name: string;
  rating: number;
  skill: number;
  tier: string;
  rd: number;
}

export interface SessionCourt {
  label: string;
  players: SessionPlayer[];
  spread: number;
}

export interface SessionWaitlistEntry {
  player: SessionPlayer;
  position: number;
}

export interface SessionView {
  id: string;
  name: string;
  status: string;
  format: SessionFormat;
  scoringType: string;
  startTime: string;
  endTime: string;
  checkInOpensAt: string;
  checkInClosesAt: string;
  checkInOpen: boolean;
  qrCode: string | null;
  maxPlayers: number;
  courtCount: number;
  checkedInCount: number;
  courts: SessionCourt[];
  waitlist: SessionWaitlistEntry[];
  viewer: {
    checkedIn: boolean;
    courtLabel: string | null;
    waitlistPosition: number | null;
  };
}

export function socketBaseUrl(baseUrl: string = DEFAULT_BASE_URL): string {
  return baseUrl.replace(/\/api\/v1\/?$/, '');
}

export interface RegisterFormInput {
  name: string;
  email: string;
  password: string;
  tier: SelectableTier;
}

export interface LoginFormInput {
  email: string;
  password: string;
}

export interface RegisterInput extends RegisterFormInput {
  deviceFingerprint: string;
}

export interface LoginInput extends LoginFormInput {
  deviceFingerprint: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createApiClient(baseUrl: string = DEFAULT_BASE_URL) {
  async function send<T>(
    path: string,
    init: { method?: string; body?: string; accessToken?: string } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (init.body) {
      headers['Content-Type'] = 'application/json';
    }
    if (init.accessToken) {
      headers.Authorization = `Bearer ${init.accessToken}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body,
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;

    if (!response.ok) {
      throw new ApiError(
        response.status,
        payload?.error?.code ?? 'unknown_error',
        payload?.error?.message ?? 'Request failed',
      );
    }

    return payload as unknown as T;
  }

  return {
    register(input: RegisterInput): Promise<AuthSession> {
      return send<AuthSession>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
    },
    login(input: LoginInput): Promise<AuthSession> {
      return send<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
    },
    async fetchProfile(accessToken: string): Promise<PlayerProfile> {
      const payload = await send<{ user: PlayerProfile }>('/players/me', { accessToken });
      return payload.user;
    },
    async checkIn(sessionId: string, qrCode: string, accessToken: string): Promise<SessionView> {
      const payload = await send<{ session: SessionView }>(`/sessions/${sessionId}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ qrCode }),
        accessToken,
      });
      return payload.session;
    },
    async fetchSession(sessionId: string, accessToken: string): Promise<SessionView> {
      const payload = await send<{ session: SessionView }>(`/sessions/${sessionId}`, {
        accessToken,
      });
      return payload.session;
    },
  };
}
