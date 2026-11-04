"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    googleId: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    picture: { type: String, default: '' },
    passwordHash: { type: String, select: false },
    currency: { type: String, enum: ['USD', 'INR', 'EUR', 'GBP'], default: 'USD' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    loginEmails: { type: Boolean, default: true },
}, { timestamps: true, autoIndex: false });
userSchema.index({ googleId: 1 }, {
    unique: true,
    partialFilterExpression: { googleId: { $type: 'string' } },
    name: 'googleId_1',
});
exports.default = (mongoose_1.models.User || (0, mongoose_1.model)('User', userSchema));
