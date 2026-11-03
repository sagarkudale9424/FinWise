import { Schema, model, models } from 'mongoose';

const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 40 },
  amount: { type: Number, required: true, min: 0.01 },
  kind: { type: String, enum: ['income', 'expense'], required: true },
  date: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

export default models.Transaction || model('Transaction', schema);
