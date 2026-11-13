import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.js';
import { ensureSeed } from './seed.js';

const { PORT = 5000, MONGO_URI, JWT_SECRET, CLIENT_URL } = process.env;
if (!MONGO_URI || !JWT_SECRET) {
  console.error('Missing MONGO_URI or JWT_SECRET. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      'upgrade-insecure-requests': null,
    },
  },
}));
app.use(cors({ origin: CLIENT_URL ? CLIENT_URL.split(',').map((s) => s.trim()) : true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use('/api', routes);

// Serve the built React app in production (npm run build)
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  const status = err.status || (['ValidationError', 'CastError'].includes(err.name) ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Server error' : err.message });
});

await mongoose.connect(MONGO_URI);
await ensureSeed();
app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`));
