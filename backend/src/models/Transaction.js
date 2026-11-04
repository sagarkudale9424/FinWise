"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, trim: true, maxlength: 40 },
    amount: { type: Number, required: true, min: 0.01 },
    kind: { type: String, enum: ['income', 'expense'], required: true },
    date: { type: Date, required: true, default: Date.now },
}, { timestamps: true });
exports.default = mongoose_1.models.Transaction || (0, mongoose_1.model)('Transaction', schema);
