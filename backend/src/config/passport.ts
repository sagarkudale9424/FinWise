import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import User from '../models/User';

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.API_URL || 'http://localhost:4000'}/auth/google/callback`,
  }, async (_accessToken, _refreshToken, profile: Profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) return done(new Error('Google did not provide an email address.'));
      const user = await User.findOneAndUpdate(
        { $or: [{ googleId: profile.id }, { email }] },
        { $set: { googleId: profile.id, email, name: profile.displayName || email.split('@')[0], picture: profile.photos?.[0]?.value || '' } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
      done(null, user);
    } catch (error) { done(error as Error); }
  }));
}

export default passport;
