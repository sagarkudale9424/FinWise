import { Schema, model, models } from 'mongoose';

const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  emoji: { type: String, default: '🎯', maxlength: 8 },
  target: { type: Number, required: true, min: 0.01 },
  saved: { type: Number, required: true, min: 0, default: 0 },
  targetDate: { type: Date },
  color: { type: String, default: '#05d6a3' },
}, { timestamps: true });

export default models.Goal || model('Goal', schema);
