"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const User_1 = __importDefault(require("../models/User"));
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.API_URL || 'http://localhost:4000'}/auth/google/callback`,
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            if (!email)
                return done(new Error('Google did not provide an email address.'));
            const user = await User_1.default.findOneAndUpdate({ $or: [{ googleId: profile.id }, { email }] }, { $set: { googleId: profile.id, email, name: profile.displayName || email.split('@')[0], picture: profile.photos?.[0]?.value || '' } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    }));
}
exports.default = passport_1.default;
