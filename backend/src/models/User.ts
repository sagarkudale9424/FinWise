import { Schema, model, models } from 'mongoose';

const userSchema = new Schema({
  googleId: { type: String, unique: true, sparse: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  picture: { type: String, default: '' },
  passwordHash: { type: String, select: false },
  currency: { type: String, enum: ['USD', 'INR', 'EUR', 'GBP'], default: 'USD' },
}, { timestamps: true });

export type UserRecord = {
  _id: { toString(): string };
  googleId?: string;
  email: string;
  name: string;
  picture: string;
};

export default (models.User || model('User', userSchema));
