"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    category: { type: String, required: true, trim: true, maxlength: 40 },
    limit: { type: Number, required: true, min: 0.01 },
}, { timestamps: true });
schema.index({ userId: 1, month: 1, category: 1 }, { unique: true });
exports.default = mongoose_1.models.Budget || (0, mongoose_1.model)('Budget', schema);
