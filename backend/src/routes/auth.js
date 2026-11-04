"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("../config/passport"));
const User_1 = __importDefault(require("../models/User"));
const requireAuth_1 = require("../middleware/requireAuth");
const emailService_1 = require("../services/emailService");
const Transaction_1 = __importDefault(require('../models/Transaction'));
const Budget_1 = __importDefault(require('../models/Budget'));
const Goal_1 = __importDefault(require('../models/Goal'));
const PaymentCard_1 = __importDefault(require('../models/PaymentCard'));
const router = (0, express_1.Router)();
const scryptAsync = (0, node_util_1.promisify)(node_crypto_1.scrypt);
const cookieName = 'finwise_token';
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: (isProduction ? 'none' : 'lax'), path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.JWT_SECRET);
async function hashPassword(password) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString('hex');
    const derived = await scryptAsync(password, salt, 64);
    return `${salt}:${derived.toString('hex')}`;
}
async function verifyPassword(password, storedHash) {
    const [salt, expectedHex] = storedHash.split(':');
    if (!salt || !expectedHex)
        return false;
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = await scryptAsync(password, salt, expected.length);
    return expected.length === actual.length && (0, node_crypto_1.timingSafeEqual)(expected, actual);
}
function issueSession(userId, res) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET is not configured.');
    const token = jsonwebtoken_1.default.sign({}, secret, { subject: userId, expiresIn: '7d', issuer: 'finwise-api' });
    res.cookie(cookieName, token, cookieOptions);
}
router.post('/signup', async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (name.length < 2)
        return res.status(400).json({ error: 'Enter your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: 'Enter a valid email address.' });
    if (password.length < 8)
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (password.length > 128)
        return res.status(400).json({ error: 'Password must be 128 characters or fewer.' });
    try {
        const existing = await User_1.default.findOne({ email }).select('_id');
        if (existing)
            return res.status(409).json({ error: 'An account already exists for this email. Log in instead.' });
        const user = await User_1.default.create({ name, email, passwordHash: await hashPassword(password) });
        issueSession(user._id.toString(), res);
        return res.status(201).json({ user: { name: user.name, email: user.email, picture: user.picture || '' } });
    }
    catch (error) {
        if (typeof error === 'object' && error && 'code' in error && error.code === 11000) {
            const duplicateFields = Object.keys(error.keyPattern || {});
            if (duplicateFields.includes('email'))
                return res.status(409).json({ error: 'An account already exists for this email. Log in instead.' });
            console.error('Signup hit a duplicate MongoDB index:', duplicateFields.join(', ') || 'unknown index');
            return res.status(500).json({ error: 'Could not create your account because of a database index conflict. Check the API terminal for the conflicting index.' });
        }
        return res.status(500).json({ error: 'Could not create your account. Please try again.' });
    }
});
router.post('/login', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password)
        return res.status(400).json({ error: 'Enter your email and password.' });
    if (password.length > 128)
        return res.status(400).json({ error: 'Password must be 128 characters or fewer.' });
    try {
        const user = await User_1.default.findOne({ email }).select('+passwordHash');
        if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash)))
            return res.status(401).json({ error: 'Email or password is incorrect.' });
        issueSession(user._id.toString(), res);
        void (0, emailService_1.sendLoginThankYouEmail)(user).catch((error) => console.error('Could not send login notification email.', error?.code || 'SMTP_ERROR'));
        return res.json({ user: { name: user.name, email: user.email, picture: user.picture || '' } });
    }
    catch {
        return res.status(500).json({ error: 'Could not log in right now. Please try again.' });
    }
});
router.get('/google', (req, res, next) => {
    if (!googleReady)
        return res.redirect(`${frontendUrl}/auth?error=oauth_not_configured`);
    const state = (0, node_crypto_1.randomBytes)(32).toString('hex');
    res.cookie('finwise_oauth_state', state, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/auth/google/callback', maxAge: 10 * 60 * 1000 });
    passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: 'select_account', state })(req, res, next);
});
router.get('/google/callback', (req, res, next) => {
    if (!googleReady)
        return res.redirect(`${frontendUrl}/auth?error=oauth_not_configured`);
    const expectedState = req.cookies?.finwise_oauth_state;
    const receivedState = typeof req.query.state === 'string' ? req.query.state : '';
    res.clearCookie('finwise_oauth_state', { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/auth/google/callback' });
    if (!expectedState || !receivedState || expectedState.length !== receivedState.length || !(0, node_crypto_1.timingSafeEqual)(Buffer.from(expectedState), Buffer.from(receivedState))) {
        return res.redirect(`${frontendUrl}/auth?error=oauth_state_invalid`);
    }
    passport_1.default.authenticate('google', { session: false, failureRedirect: `${frontendUrl}/auth?error=google_signin_failed` }, (error, user) => {
        if (error || !user)
            return res.redirect(`${frontendUrl}/auth?error=google_signin_failed`);
        try {
            issueSession(user._id.toString(), res);
        }
        catch {
            return res.redirect(`${frontendUrl}/auth?error=oauth_not_configured`);
        }
        void (0, emailService_1.sendLoginThankYouEmail)(user).catch((error) => console.error('Could not send login notification email.', error?.code || 'SMTP_ERROR'));
        return res.redirect(frontendUrl);
    })(req, res, next);
});
router.get('/me', requireAuth_1.requireAuth, async (req, res) => {
    const user = await User_1.default.findById(req.userId).select('name email picture currency theme loginEmails').lean();
    if (!user)
        return res.status(401).json({ error: 'Account not found.' });
    return res.json({ user });
});
router.get('/settings', requireAuth_1.requireAuth, async (req, res) => {
    const user = await User_1.default.findById(req.userId).select('name email currency theme loginEmails').lean();
    if (!user)
        return res.status(404).json({ error: 'Account not found.' });
    res.json({ settings: { name: user.name, email: user.email, currency: user.currency || 'USD', theme: user.theme || 'light', loginEmails: user.loginEmails !== false } });
});
router.put('/settings', requireAuth_1.requireAuth, async (req, res) => {
    const currency = req.body?.currency;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
    const theme = req.body?.theme;
    const loginEmails = req.body?.loginEmails;
    if (!['USD', 'INR', 'EUR', 'GBP'].includes(currency))
        return res.status(400).json({ error: 'Choose a supported currency.' });
    if (name !== undefined && (name.length < 2 || name.length > 80)) return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
    if (theme !== undefined && !['light', 'dark'].includes(theme)) return res.status(400).json({ error: 'Choose light or dark theme.' });
    if (loginEmails !== undefined && typeof loginEmails !== 'boolean') return res.status(400).json({ error: 'Choose whether login emails are enabled.' });
    const updates = { currency };
    if (name !== undefined) updates.name = name;
    if (theme !== undefined) updates.theme = theme;
    if (loginEmails !== undefined) updates.loginEmails = loginEmails;
    const user = await User_1.default.findByIdAndUpdate(req.userId, { $set: updates }, { new: true, runValidators: true }).select('name email currency theme loginEmails').lean();
    if (!user)
        return res.status(404).json({ error: 'Account not found.' });
    res.json({ settings: { name: user.name, email: user.email, currency: user.currency, theme: user.theme, loginEmails: user.loginEmails } });
});
router.get('/export', requireAuth_1.requireAuth, async (req, res) => {
    const [user, transactions, budgets, goals, cards] = await Promise.all([
        User_1.default.findById(req.userId).select('name email currency theme loginEmails createdAt').lean(),
        Transaction_1.default.find({ userId: req.userId }).lean(),
        Budget_1.default.find({ userId: req.userId }).lean(),
        Goal_1.default.find({ userId: req.userId }).lean(),
        PaymentCard_1.default.find({ userId: req.userId }).lean(),
    ]);
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    res.json({ exportedAt: new Date().toISOString(), account: user, transactions, budgets, savingsGoals: goals, savedCards: cards });
});
router.post('/logout', (_req, res) => {
    res.clearCookie(cookieName, { httpOnly: true, secure: isProduction, sameSite: cookieOptions.sameSite, path: '/' });
    return res.status(204).end();
});
exports.default = router;
