import { Router } from 'express';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import passport from '../config/passport';
import User from '../models/User';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
const scryptAsync = promisify(scrypt);
const cookieName = 'finwise_token';
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: (isProduction ? 'none' : 'lax') as 'none'|'lax', path: '/' as const, maxAge: 7 * 24 * 60 * 60 * 1000 };
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.JWT_SECRET);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await scryptAsync(password, salt, expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function issueSession(userId: string, res: import('express').Response) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured.');
  const token = jwt.sign({}, secret, { subject: userId, expiresIn: '7d', issuer: 'finwise-api' });
  res.cookie(cookieName, token, cookieOptions);
}

router.post('/signup', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (name.length < 2) return res.status(400).json({ error: 'Enter your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (password.length > 128) return res.status(400).json({ error: 'Password must be 128 characters or fewer.' });
  try {
    const existing = await User.findOne({ email }).select('_id');
    if (existing) return res.status(409).json({ error: 'An account already exists for this email. Log in instead.' });
    const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
    issueSession(user._id.toString(), res);
    return res.status(201).json({ user: { name:user.name, email:user.email, picture:user.picture || '' } });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 11000) return res.status(409).json({ error: 'An account already exists for this email. Log in instead.' });
    return res.status(500).json({ error: 'Could not create your account. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'Enter your email and password.' });
  if (password.length > 128) return res.status(400).json({ error: 'Password must be 128 characters or fewer.' });
  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    issueSession(user._id.toString(), res);
    return res.json({ user: { name:user.name, email:user.email, picture:user.picture || '' } });
  } catch {
    return res.status(500).json({ error: 'Could not log in right now. Please try again.' });
  }
});

router.get('/google', (req, res, next) => {
  if (!googleReady) return res.redirect(`${frontendUrl}/auth?error=oauth_not_configured`);
  const state = randomBytes(32).toString('hex');
  res.cookie('finwise_oauth_state', state, { httpOnly:true, secure:isProduction, sameSite:'lax', path:'/auth/google/callback', maxAge:10*60*1000 });
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: 'select_account', state })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleReady) return res.redirect(`${frontendUrl}/auth?error=oauth_not_configured`);
  const expectedState = req.cookies?.finwise_oauth_state;
  const receivedState = typeof req.query.state === 'string' ? req.query.state : '';
  res.clearCookie('finwise_oauth_state', { httpOnly:true, secure:isProduction, sameSite:'lax', path:'/auth/google/callback' });
  if (!expectedState || !receivedState || expectedState.length !== receivedState.length || !timingSafeEqual(Buffer.from(expectedState), Buffer.from(receivedState))) {
    return res.redirect(`${frontendUrl}/auth?error=oauth_state_invalid`);
  }
  passport.authenticate('google', { session: false, failureRedirect: `${frontendUrl}/auth?error=google_signin_failed` }, (error: Error | null, user: InstanceType<typeof User> | false) => {
    if (error || !user) return res.redirect(`${frontendUrl}/auth?error=google_signin_failed`);
    try { issueSession(user._id.toString(), res); }
    catch { return res.redirect(`${frontendUrl}/auth?error=oauth_not_configured`); }
    return res.redirect(frontendUrl);
  })(req, res, next);
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('name email picture currency').lean();
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  return res.json({ user });
});

router.get('/settings', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('currency').lean();
  if (!user) return res.status(404).json({ error:'Account not found.' });
  res.json({ settings:{ currency:user.currency || 'USD' } });
});

router.put('/settings', requireAuth, async (req, res) => {
  const currency = req.body?.currency;
  if (!['USD', 'INR', 'EUR', 'GBP'].includes(currency)) return res.status(400).json({ error:'Choose a supported currency.' });
  const user = await User.findByIdAndUpdate(req.userId, { $set:{ currency } }, { new:true }).select('currency').lean();
  if (!user) return res.status(404).json({ error:'Account not found.' });
  res.json({ settings:{ currency:user.currency } });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(cookieName, { httpOnly: true, secure: isProduction, sameSite: cookieOptions.sameSite, path: '/' });
  return res.status(204).end();
});

export default router;
