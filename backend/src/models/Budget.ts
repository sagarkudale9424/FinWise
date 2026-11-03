import { Schema, model, models } from 'mongoose';

const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
  category: { type: String, required: true, trim: true, maxlength: 40 },
  limit: { type: Number, required: true, min: 0.01 },
}, { timestamps: true });
schema.index({ userId: 1, month: 1, category: 1 }, { unique: true });

export default models.Budget || model('Budget', schema);
