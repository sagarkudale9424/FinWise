import './config/loadEnv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import passport from './config/passport';
import authRoutes from './routes/auth';
import financeRoutes from './routes/finance';

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

app.disable('x-powered-by');
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(passport.initialize());
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/api', financeRoutes);

async function start() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is required. Add it to backend/.env.');
  await mongoose.connect(mongoUri);
  app.listen(port, () => console.log(`FinWise API listening on http://localhost:${port}`));
}

start().catch(error => {
  console.error('FinWise API failed to start:', error);
  process.exit(1);
});
