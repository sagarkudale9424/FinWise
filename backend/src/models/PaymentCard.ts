import { Schema, model, models } from 'mongoose';

const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label: { type: String, required: true, trim: true, maxlength: 40 },
  issuer: { type: String, required: true, trim: true, maxlength: 30 },
  last4: { type: String, required: true, match: /^\d{4}$/ },
  kind: { type: String, enum: ['debit', 'credit'], required: true },
  color: { type: String, default: '#05d6a3' },
}, { timestamps: true });

export default models.PaymentCard || model('PaymentCard', schema);
