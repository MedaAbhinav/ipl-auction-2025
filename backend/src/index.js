'use strict';

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { IPL_TEAMS } = require('./data/teams');
const { AUCTION_POOL } = require('./data/players');
const attachSocketHandlers = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || '*';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));

// ── REST endpoints (lightweight, state read-only) ─────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.get('/api/teams', (_req, res) => res.json(IPL_TEAMS));

app.get('/api/players', (_req, res) => res.json(AUCTION_POOL));

app.get('/api/players/team/:teamId', (req, res) => {
  const players = AUCTION_POOL.filter(p => p.franchise === req.params.teamId);
  res.json(players);
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
attachSocketHandlers(io);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🏏  IPL Auction Backend running on port ${PORT}`);
  console.log(`📡  WebSocket ready`);
  console.log(`📦  ${AUCTION_POOL.length} players in auction pool\n`);
});

module.exports = { app, server };
