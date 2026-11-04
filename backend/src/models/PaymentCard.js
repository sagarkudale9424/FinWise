"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 40 },
    issuer: { type: String, required: true, trim: true, maxlength: 30 },
    last4: { type: String, required: true, match: /^\d{4}$/ },
    kind: { type: String, enum: ['debit', 'credit'], required: true },
    color: { type: String, default: '#05d6a3' },
}, { timestamps: true });
exports.default = mongoose_1.models.PaymentCard || (0, mongoose_1.model)('PaymentCard', schema);
