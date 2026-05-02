require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const deviceRoutes = require('./routes/deviceRoutes');
const { runMonitoringCycle } = require('./services/deviceService');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/netmon';
const MONITOR_INTERVAL = parseInt(process.env.MONITOR_INTERVAL_MS, 10) || 15000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', deviceRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Database + Start ────────────────────────────────────────────────────────
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[DB] Connected to MongoDB: ${MONGO_URI}`);

    app.listen(PORT, () => {
      console.log(`[Server] Listening on http://localhost:${PORT}`);
    });

    // Start background monitoring loop
    console.log(`[Monitor] Starting monitoring loop every ${MONITOR_INTERVAL}ms`);
    setInterval(async () => {
      try {
        await runMonitoringCycle();
      } catch (err) {
        console.error('[Monitor] Cycle error:', err.message);
      }
    }, MONITOR_INTERVAL);
  } catch (err) {
    console.error('[Startup] Fatal error:', err.message);
    process.exit(1);
  }
}

start();
