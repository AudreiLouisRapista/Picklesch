import crypto from 'node:crypto';
import { Types } from 'mongoose';

import { loadConfig } from '../../config/env';
import { AppError } from '../../errors';
import { formCourts, PoolPlayer } from '../../matchmaking';
import { Session, SessionDocument, SessionFormat, ScoringType } from '../../models/Session';
import { User, UserDocument } from '../../models/User';
import { Tier, ratingToSkill, ratingToTier, skillSpreadToRatingPoints } from '../../rating-engine';

const FORMATS: readonly SessionFormat[] = ['doubles', 'singles'];
const SCORING_TYPES: readonly ScoringType[] = ['rally', 'traditional'];
const FORMAT_COURT_SIZE: Record<SessionFormat, number> = { doubles: 4, singles: 2 };

export interface PublicPlayer {
  id: string;
  name: string;
  rating: number;
  skill: number;
  tier: Tier;
  rd: number;
}

export interface PublicCourt {
  label: string;
  players: PublicPlayer[];
  spread: number;
}

export interface PublicWaitlistEntry {
  player: PublicPlayer;
  position: number;
}

export interface PublicSession {
  id: string;
  name: string;
  status: string;
  format: SessionFormat;
  scoringType: ScoringType;
  startTime: Date;
  endTime: Date;
  checkInOpensAt: Date;
  checkInClosesAt: Date;
  checkInOpen: boolean;
  qrCode: string | null;
  maxPlayers: number;
  courtCount: number;
  checkedInCount: number;
  courts: PublicCourt[];
  waitlist: PublicWaitlistEntry[];
  viewer: {
    checkedIn: boolean;
    courtLabel: string | null;
    waitlistPosition: number | null;
  };
}

export interface CreateSessionInput {
  name: string;
  startTime: string | Date;
  endTime: string | Date;
  maxPlayers: number;
  format?: string;
  scoringType?: string;
  courtCount?: number;
  facility?: string;
}

function readName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(422, 'invalid_name', 'A session name is required');
  }

  return value.trim();
}

function readDate(value: unknown, field: string): Date {
  const parsed = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(422, `invalid_${field}`, `${field} must be a valid date`);
  }

  return parsed;
}

function readMaxPlayers(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(422, 'invalid_max_players', 'maxPlayers must be a positive integer');
  }

  return parsed;
}

function readFormat(value: unknown): SessionFormat {
  if (value === undefined) {
    return 'doubles';
  }

  if (typeof value !== 'string' || !FORMATS.includes(value as SessionFormat)) {
    throw new AppError(422, 'invalid_format', 'format must be one of: doubles, singles');
  }

  return value as SessionFormat;
}

function readScoringType(value: unknown): ScoringType {
  if (value === undefined) {
    return 'rally';
  }

  if (typeof value !== 'string' || !SCORING_TYPES.includes(value as ScoringType)) {
    throw new AppError(
      422,
      'invalid_scoring_type',
      'scoringType must be one of: rally, traditional',
    );
  }

  return value as ScoringType;
}

function readObjectId(value: string, code: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, code, 'Session not found');
  }

  return new Types.ObjectId(value);
}

function requireSession(session: SessionDocument | null): SessionDocument {
  if (!session) {
    throw new AppError(404, 'session_not_found', 'Session not found');
  }

  return session;
}

export async function createSession(
  input: CreateSessionInput,
  creatorId: string,
): Promise<SessionDocument> {
  const config = loadConfig();
  const name = readName(input.name);
  const format = readFormat(input.format);
  const scoringType = readScoringType(input.scoringType);
  const maxPlayers = readMaxPlayers(input.maxPlayers);
  const startTime = readDate(input.startTime, 'start_time');
  const endTime = readDate(input.endTime, 'end_time');

  if (endTime.getTime() <= startTime.getTime()) {
    throw new AppError(422, 'invalid_time_range', 'endTime must be after startTime');
  }

  const defaultCourts = Math.max(1, Math.floor(maxPlayers / FORMAT_COURT_SIZE[format]));
  const courtCount = Number.isInteger(input.courtCount) ? Number(input.courtCount) : defaultCourts;

  if (courtCount < 1) {
    throw new AppError(422, 'invalid_court_count', 'courtCount must be at least 1');
  }

  const facility =
    input.facility && Types.ObjectId.isValid(input.facility)
      ? new Types.ObjectId(input.facility)
      : null;

  return Session.create({
    facility,
    createdBy: new Types.ObjectId(creatorId),
    name,
    startTime,
    endTime,
    maxPlayers,
    format,
    scoringType,
    qrCode: crypto.randomBytes(9).toString('base64url'),
    checkInOpensAt: new Date(startTime.getTime() - config.checkInWindowMsBefore),
    checkInClosesAt: new Date(startTime.getTime() + config.checkInWindowMsAfter),
    courts: Array.from({ length: courtCount }, (_value, index) => ({
      label: `Court ${index + 1}`,
      players: [],
      assignedAt: null,
    })),
    checkIns: [],
    waitlist: [],
    status: 'upcoming',
    lastFormedAt: null,
  });
}

function isAcceptingCheckIns(session: SessionDocument): boolean {
  return session.status === 'upcoming' || session.status === 'active';
}

export function isCheckInOpen(session: SessionDocument, now: Date): boolean {
  if (!isAcceptingCheckIns(session)) {
    return false;
  }

  return (
    now.getTime() >= session.checkInOpensAt.getTime() &&
    now.getTime() <= session.checkInClosesAt.getTime()
  );
}

export async function checkInToSession(params: {
  sessionId: string;
  playerId: string;
  qrCode: unknown;
  now?: Date;
}): Promise<SessionDocument> {
  const session = requireSession(
    await Session.findById(readObjectId(params.sessionId, 'session_not_found')),
  );
  const now = params.now ?? new Date();

  if (typeof params.qrCode !== 'string' || params.qrCode.trim() !== session.qrCode) {
    throw new AppError(403, 'invalid_qr', 'The check-in code does not match this session');
  }

  if (!isAcceptingCheckIns(session)) {
    throw new AppError(409, 'session_not_open', 'This session is not accepting check-ins');
  }

  if (now.getTime() < session.checkInOpensAt.getTime()) {
    throw new AppError(422, 'check_in_closed', 'Check-in has not opened yet');
  }

  if (now.getTime() > session.checkInClosesAt.getTime()) {
    throw new AppError(422, 'check_in_closed', 'The check-in window has closed');
  }

  const alreadyIn = session.checkIns.some((entry) => String(entry.player) === params.playerId);

  if (alreadyIn) {
    return session;
  }

  if (session.checkIns.length >= session.maxPlayers) {
    throw new AppError(409, 'session_full', 'This session is at capacity');
  }

  session.checkIns.push({
    player: new Types.ObjectId(params.playerId),
    checkedInAt: now,
  });
  await session.save();

  return session;
}

export function shouldForm(session: SessionDocument, now: Date): boolean {
  if (!session.lastFormedAt) {
    return true;
  }

  return now.getTime() - session.lastFormedAt.getTime() >= loadConfig().formationCadenceMs;
}

export async function runFormation(params: {
  sessionId: string;
  now?: Date;
}): Promise<SessionDocument> {
  const session = requireSession(
    await Session.findById(readObjectId(params.sessionId, 'session_not_found')),
  );

  return formSession(session, params.now ?? new Date());
}

export async function runDueFormations(now: Date = new Date()): Promise<SessionDocument[]> {
  const sessions = await Session.find({ status: { $in: ['upcoming', 'active'] } });
  const formed: SessionDocument[] = [];

  for (const session of sessions) {
    if (shouldForm(session, now)) {
      formed.push(await formSession(session, now));
    }
  }

  return formed;
}

async function formSession(session: SessionDocument, now: Date): Promise<SessionDocument> {
  const config = loadConfig();

  if (session.status === 'cancelled' || session.status === 'completed') {
    throw new AppError(409, 'session_not_open', 'This session is not active');
  }

  const users = await loadCheckInUsers(session);
  const courtSize = FORMAT_COURT_SIZE[session.format];
  const pool: PoolPlayer[] = users.map((user) => ({
    id: String(user._id),
    rating: formatRating(user, session.format),
  }));

  const { courts, waitlist } = formCourts({
    players: pool,
    courtSize,
    maxCourts: session.courts.length,
    maxSpread: skillSpreadToRatingPoints(config.courtGapCap),
  });

  session.courts.forEach((court, index) => {
    const assignment = courts[index];

    court.players = assignment
      ? assignment.players.map((player) => new Types.ObjectId(player.id))
      : [];
    court.assignedAt = assignment ? now : null;
  });

  session.set(
    'waitlist',
    waitlist.map((player, index) => ({
      player: new Types.ObjectId(player.id),
      position: index + 1,
      promotedAt: null,
    })),
  );

  if (session.status === 'upcoming' && now.getTime() >= session.startTime.getTime()) {
    session.status = 'active';
  }

  session.lastFormedAt = now;
  await session.save();

  return session;
}

export async function getSession(sessionId: string): Promise<SessionDocument> {
  return requireSession(await Session.findById(readObjectId(sessionId, 'session_not_found')));
}

export async function toPublicSession(
  session: SessionDocument,
  viewerId?: string,
): Promise<PublicSession> {
  const users = await loadSessionUsers(session);
  const player = (id: Types.ObjectId): PublicPlayer | null => {
    const user = users.get(String(id));

    return user ? toPublicPlayer(user, session.format) : null;
  };

  const courts: PublicCourt[] = session.courts
    .filter((court) => court.players.length > 0)
    .map((court) => {
      const players = court.players
        .map(player)
        .filter((entry): entry is PublicPlayer => entry !== null);
      const ratings = players.map((entry) => entry.rating);

      return {
        label: court.label,
        players,
        spread: ratings.length > 0 ? Math.max(...ratings) - Math.min(...ratings) : 0,
      };
    });

  const waitlist: PublicWaitlistEntry[] = session.waitlist
    .map((entry) => {
      const entryPlayer = player(entry.player);

      return entryPlayer ? { player: entryPlayer, position: entry.position } : null;
    })
    .filter((entry): entry is PublicWaitlistEntry => entry !== null)
    .sort((a, b) => a.position - b.position);

  const courtOfViewer = session.courts.find((court) =>
    court.players.some((id) => String(id) === viewerId),
  );
  const waitlistEntry = session.waitlist.find((entry) => String(entry.player) === viewerId);

  return {
    id: String(session._id),
    name: session.name,
    status: session.status,
    format: session.format,
    scoringType: session.scoringType,
    startTime: session.startTime,
    endTime: session.endTime,
    checkInOpensAt: session.checkInOpensAt,
    checkInClosesAt: session.checkInClosesAt,
    checkInOpen: isCheckInOpen(session, new Date()),
    qrCode: viewerId && String(session.createdBy) === viewerId ? session.qrCode : null,
    maxPlayers: session.maxPlayers,
    courtCount: session.courts.length,
    checkedInCount: session.checkIns.length,
    courts,
    waitlist,
    viewer: {
      checkedIn: session.checkIns.some((entry) => String(entry.player) === viewerId),
      courtLabel: courtOfViewer ? courtOfViewer.label : null,
      waitlistPosition: waitlistEntry ? waitlistEntry.position : null,
    },
  };
}

function ratingStateFor(user: UserDocument, format: SessionFormat) {
  return format === 'singles' ? user.singlesRating : user.doublesRating;
}

function formatRating(user: UserDocument, format: SessionFormat): number {
  return ratingStateFor(user, format).rating;
}

function toPublicPlayer(user: UserDocument, format: SessionFormat): PublicPlayer {
  const state = ratingStateFor(user, format);

  return {
    id: String(user._id),
    name: user.name,
    rating: state.rating,
    skill: ratingToSkill(state.rating),
    tier: ratingToTier(state.rating),
    rd: state.rd,
  };
}

async function loadCheckInUsers(session: SessionDocument): Promise<UserDocument[]> {
  if (session.checkIns.length === 0) {
    return [];
  }

  return User.find({ _id: { $in: session.checkIns.map((entry) => entry.player) } });
}

async function loadSessionUsers(session: SessionDocument): Promise<Map<string, UserDocument>> {
  const ids = [
    ...session.checkIns.map((entry) => entry.player),
    ...session.courts.flatMap((court) => court.players),
    ...session.waitlist.map((entry) => entry.player),
  ];
  const unique = [...new Set(ids.map(String))];

  if (unique.length === 0) {
    return new Map();
  }

  const users = await User.find({ _id: { $in: unique } });

  return new Map(users.map((user) => [String(user._id), user]));
}
