"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    const token = req.cookies?.finwise_token;
    if (!token)
        return res.status(401).json({ error: 'Authentication required.' });
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret)
            return res.status(503).json({ error: 'Authentication is not configured.' });
        const payload = jsonwebtoken_1.default.verify(token, secret, { issuer: 'finwise-api' });
        if (typeof payload.sub !== 'string')
            return res.status(401).json({ error: 'Invalid session.' });
        req.userId = payload.sub;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
}
