import { loadConfig } from '../../config/env';
import { User, UserDocument } from '../../models/User';
import { RatingState, buildInitialRatingStates } from '../../rating-engine/state';
import { SelectableTier, Tier, isSelectableTier, ratingToTier } from '../../rating-engine/tiers';
import { AuthError } from './errors';
import { hashPassword, verifyPassword } from './passwords';
import { createAccessToken, generateRefreshToken, hashRefreshToken } from './tokens';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const DUPLICATE_KEY_ERROR = 11000;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  email: string;
  tier: SelectableTier;
  ratingTier: Tier;
  provisional: boolean;
  provisionalMatches: number;
  provisionalMatchesRequired: number;
  selfSelectionValidated: boolean;
  matchesPlayed: number;
  doubles: RatingState;
  singles: RatingState;
}

export interface AuthResult extends AuthTokens {
  user: PublicProfile;
}

type AuthInput = Record<string, unknown>;

function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string' || !EMAIL_PATTERN.test(value.trim())) {
    throw new AuthError(422, 'invalid_email', 'A valid email address is required');
  }

  return value.trim().toLowerCase();
}

function validatePassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(
      422,
      'invalid_password',
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  return value;
}

function validateTier(value: unknown): SelectableTier {
  if (!isSelectableTier(value)) {
    throw new AuthError(422, 'invalid_tier', 'Tier must be one of: 2.5, 3.0, 3.5, 4.0');
  }

  return value;
}

function resolveName(value: unknown, email: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return email.split('@')[0];
}

function readFingerprint(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function toPublicProfile(user: UserDocument): PublicProfile {
  const { provisionalMatchCount } = loadConfig();
  const doubles: RatingState = {
    rating: user.doublesRating.rating,
    rd: user.doublesRating.rd,
    volatility: user.doublesRating.volatility,
  };
  const singles: RatingState = {
    rating: user.singlesRating.rating,
    rd: user.singlesRating.rd,
    volatility: user.singlesRating.volatility,
  };

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    tier: user.initialTierSelected,
    ratingTier: ratingToTier(doubles.rating),
    provisional: user.provisional,
    provisionalMatches: user.provisionalMatches,
    provisionalMatchesRequired: provisionalMatchCount,
    selfSelectionValidated: user.selfSelectionValidated,
    matchesPlayed: user.matchesPlayed,
    doubles,
    singles,
  };
}

async function issueTokens(
  user: UserDocument,
  deviceFingerprint: string | null,
): Promise<AuthTokens> {
  const config = loadConfig();
  const now = Date.now();
  const refreshToken = generateRefreshToken();
  const retained = user.refreshTokens.filter((token) => token.expiresAt.getTime() > now);

  user.set('refreshTokens', retained);
  user.refreshTokens.push({
    tokenHash: hashRefreshToken(refreshToken),
    deviceFingerprint,
    createdAt: new Date(now),
    expiresAt: new Date(now + config.refreshTokenTtlMs),
  });
  await user.save();

  return {
    accessToken: createAccessToken(String(user._id), config.jwtSecret, config.accessTokenTtl),
    refreshToken,
  };
}

export async function registerUser(input: AuthInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const password = validatePassword(input.password);
  const tier = validateTier(input.tier);
  const name = resolveName(input.name, email);
  const deviceFingerprint = readFingerprint(input.deviceFingerprint);

  if (await User.exists({ email })) {
    throw emailTakenError();
  }

  const states = buildInitialRatingStates(tier);
  const passwordHash = await hashPassword(password);

  try {
    const user = await User.create({
      name,
      email,
      passwordHash,
      doublesRating: states.doubles,
      singlesRating: states.singles,
      skillRating: Number(tier),
      matchesPlayed: 0,
      provisional: true,
      provisionalMatches: 0,
      initialTierSelected: tier,
      selfSelectionValidated: false,
      avoidList: [],
      refreshTokens: [],
    });

    const tokens = await issueTokens(user, deviceFingerprint);
    return { user: toPublicProfile(user), ...tokens };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw emailTakenError();
    }

    throw error;
  }
}

export async function loginUser(input: AuthInput): Promise<AuthResult> {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const deviceFingerprint = readFingerprint(input.deviceFingerprint);

  const user = email ? await User.findOne({ email }) : null;
  const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    throw new AuthError(401, 'invalid_credentials', 'Invalid email or password');
  }

  const tokens = await issueTokens(user, deviceFingerprint);
  return { user: toPublicProfile(user), ...tokens };
}

export async function refreshUserTokens(input: AuthInput): Promise<AuthTokens> {
  const refreshToken = typeof input.refreshToken === 'string' ? input.refreshToken : '';

  if (!refreshToken) {
    throw new AuthError(401, 'invalid_refresh_token', 'Refresh token is required');
  }

  const config = loadConfig();
  const tokenHash = hashRefreshToken(refreshToken);
  const now = Date.now();
  const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash });

  if (!user) {
    throw new AuthError(401, 'invalid_refresh_token', 'Refresh token is not recognised');
  }

  const stored = user.refreshTokens.find((token) => token.tokenHash === tokenHash);

  if (!stored || stored.expiresAt.getTime() <= now) {
    user.set(
      'refreshTokens',
      user.refreshTokens.filter((token) => token.expiresAt.getTime() > now),
    );
    await user.save();
    throw new AuthError(401, 'invalid_refresh_token', 'Refresh token has expired');
  }

  const deviceFingerprint = readFingerprint(input.deviceFingerprint);

  if (stored.deviceFingerprint && stored.deviceFingerprint !== deviceFingerprint) {
    user.set(
      'refreshTokens',
      user.refreshTokens.filter((token) => token.tokenHash !== tokenHash),
    );
    await user.save();
    throw new AuthError(401, 'invalid_refresh_token', 'Refresh token does not match this device');
  }

  const nextRefreshToken = generateRefreshToken();

  user.set(
    'refreshTokens',
    user.refreshTokens.filter(
      (token) => token.tokenHash !== tokenHash && token.expiresAt.getTime() > now,
    ),
  );
  user.refreshTokens.push({
    tokenHash: hashRefreshToken(nextRefreshToken),
    deviceFingerprint: deviceFingerprint ?? stored.deviceFingerprint,
    createdAt: new Date(now),
    expiresAt: new Date(now + config.refreshTokenTtlMs),
  });
  await user.save();

  return {
    accessToken: createAccessToken(String(user._id), config.jwtSecret, config.accessTokenTtl),
    refreshToken: nextRefreshToken,
  };
}

export async function logoutUser(input: AuthInput): Promise<void> {
  const refreshToken = typeof input.refreshToken === 'string' ? input.refreshToken : '';

  if (!refreshToken) {
    return;
  }

  const tokenHash = hashRefreshToken(refreshToken);

  await User.updateOne(
    { 'refreshTokens.tokenHash': tokenHash },
    { $pull: { refreshTokens: { tokenHash } } },
  );
}

function emailTakenError(): AuthError {
  return new AuthError(409, 'email_taken', 'An account with this email already exists');
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === DUPLICATE_KEY_ERROR
  );
}
