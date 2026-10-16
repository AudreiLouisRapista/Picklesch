import { HydratedDocument, Schema, Types, model } from 'mongoose';

import { SELECTABLE_TIERS, SelectableTier } from '../rating-engine/tiers';

export interface RatingStateDoc {
  rating: number;
  rd: number;
  volatility: number;
}

export interface RefreshTokenDoc {
  tokenHash: string;
  deviceFingerprint: string | null;
  createdAt: Date;
  expiresAt: Date;
}

export interface UserDoc {
  name: string;
  email: string;
  passwordHash: string;
  doublesRating: RatingStateDoc;
  singlesRating: RatingStateDoc;
  skillRating: number;
  matchesPlayed: number;
  provisional: boolean;
  provisionalMatches: number;
  initialTierSelected: SelectableTier;
  selfSelectionValidated: boolean;
  avoidList: Types.ObjectId[];
  refreshTokens: Types.DocumentArray<RefreshTokenDoc>;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<UserDoc>;

const ratingStateSchema = new Schema<RatingStateDoc>(
  {
    rating: { type: Number, required: true },
    rd: { type: Number, required: true },
    volatility: { type: Number, required: true },
  },
  { _id: false },
);

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    tokenHash: { type: String, required: true },
    deviceFingerprint: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    doublesRating: { type: ratingStateSchema, required: true },
    singlesRating: { type: ratingStateSchema, required: true },
    skillRating: { type: Number, required: true },
    matchesPlayed: { type: Number, default: 0 },
    provisional: { type: Boolean, default: true },
    provisionalMatches: { type: Number, default: 0 },
    initialTierSelected: { type: String, enum: [...SELECTABLE_TIERS], required: true },
    selfSelectionValidated: { type: Boolean, default: false },
    avoidList: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
  },
  { timestamps: true },
);

export const User = model<UserDoc>('User', userSchema);
