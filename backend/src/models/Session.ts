import { HydratedDocument, Schema, Types, model } from 'mongoose';

export type SessionFormat = 'doubles' | 'singles';
export type ScoringType = 'rally' | 'traditional';
export type SessionStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface CourtDoc {
  label: string;
  players: Types.ObjectId[];
  assignedAt: Date | null;
}

export interface CheckInDoc {
  player: Types.ObjectId;
  checkedInAt: Date;
}

export interface WaitlistEntryDoc {
  player: Types.ObjectId;
  position: number;
  promotedAt: Date | null;
}

export interface SessionDoc {
  facility: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  name: string;
  startTime: Date;
  endTime: Date;
  maxPlayers: number;
  format: SessionFormat;
  scoringType: ScoringType;
  qrCode: string;
  checkInOpensAt: Date;
  checkInClosesAt: Date;
  courts: Types.DocumentArray<CourtDoc>;
  checkIns: Types.DocumentArray<CheckInDoc>;
  waitlist: Types.DocumentArray<WaitlistEntryDoc>;
  status: SessionStatus;
  lastFormedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionDocument = HydratedDocument<SessionDoc>;

const courtSchema = new Schema<CourtDoc>(
  {
    label: { type: String, required: true },
    players: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    assignedAt: { type: Date, default: null },
  },
  { _id: false },
);

const checkInSchema = new Schema<CheckInDoc>(
  {
    player: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    checkedInAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const waitlistEntrySchema = new Schema<WaitlistEntryDoc>(
  {
    player: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    position: { type: Number, required: true },
    promotedAt: { type: Date, default: null },
  },
  { _id: false },
);

const sessionSchema = new Schema<SessionDoc>(
  {
    facility: { type: Schema.Types.ObjectId, ref: 'Facility', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    maxPlayers: { type: Number, required: true },
    format: { type: String, enum: ['doubles', 'singles'], default: 'doubles' },
    scoringType: { type: String, enum: ['rally', 'traditional'], default: 'rally' },
    qrCode: { type: String, required: true },
    checkInOpensAt: { type: Date, required: true },
    checkInClosesAt: { type: Date, required: true },
    courts: { type: [courtSchema], default: [] },
    checkIns: { type: [checkInSchema], default: [] },
    waitlist: { type: [waitlistEntrySchema], default: [] },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    lastFormedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

sessionSchema.index({ facility: 1, startTime: 1 });
sessionSchema.index({ createdBy: 1 });
sessionSchema.index({ qrCode: 1 }, { unique: true });

export const Session = model<SessionDoc>('Session', sessionSchema);
