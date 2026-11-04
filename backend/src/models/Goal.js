"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    emoji: { type: String, default: '🎯', maxlength: 8 },
    target: { type: Number, required: true, min: 0.01 },
    saved: { type: Number, required: true, min: 0, default: 0 },
    targetDate: { type: Date },
    color: { type: String, default: '#05d6a3' },
}, { timestamps: true });
exports.default = mongoose_1.models.Goal || (0, mongoose_1.model)('Goal', schema);
