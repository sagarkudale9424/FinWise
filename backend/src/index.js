require('./config/loadEnv');

const dns = require('node:dns');
const dnsServers = (process.env.MONGODB_DNS_SERVERS || '')
  .split(',')
  .map(server => server.trim())
  .filter(Boolean);

if (dnsServers.length) {
  dns.setServers(dnsServers);
  console.log(`MongoDB DNS resolvers: ${dnsServers.join(', ')}`);
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const User = require('./models/User').default;
const passport = require('./config/passport').default;
const authRoutes = require('./routes/auth').default;
const financeRoutes = require('./routes/finance').default;

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
  try {
    await User.collection.dropIndex('googleId_1');
  } catch (error) {
    if (error.codeName !== 'IndexNotFound' && error.code !== 27) throw error;
  }
  await User.collection.createIndex({ googleId: 1 }, {
    unique: true,
    partialFilterExpression: { googleId: { $type: 'string' } },
    name: 'googleId_1',
  });
  await User.collection.createIndex({ email: 1 }, { unique: true, name: 'email_1' });
  app.listen(port, () => console.log(`FinWise API listening on http://localhost:${port}`));
}

start().catch(error => {
  console.error('FinWise API failed to start:', error);
  process.exit(1);
});
