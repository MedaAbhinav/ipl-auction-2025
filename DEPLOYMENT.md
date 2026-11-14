# IPL 2025 Auction Game — Deployment Guide

## ▶️  Run Locally (play on your own computer right now)

### 1. Start the backend
```
cd backend
npm install
npm run dev
```
Backend runs at **http://localhost:4000**

### 2. Start the frontend (new terminal)
```
cd frontend
npm install
npm run dev
```
Frontend runs at **http://localhost:5173**

Open http://localhost:5173 in your browser and start playing!

---

## 🌐  Deploy Online (so friends can join from anywhere)

### Step 1 — Push to GitHub
1. Create a free GitHub account at https://github.com
2. Create a new repository called `ipl-auction-2025`
3. Run these commands in the `D:\IPL 2025` folder:
```
git init
git add .
git commit -m "IPL 2025 Auction Game"
git remote add origin https://github.com/YOUR_USERNAME/ipl-auction-2025.git
git push -u origin main
```

---

### Step 2 — Deploy Backend on Render (free)
1. Go to https://render.com and sign up (free, no credit card)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Set:
   - **Name**: `ipl-auction-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = `https://ipl-auction-2025.vercel.app` *(update after Vercel deploy)*
6. Click **Create Web Service**
7. Wait ~2 minutes. Copy the URL — it looks like:
   `https://ipl-auction-backend.onrender.com`

> ⚠️ **Free Render note**: Free services sleep after 15 min of inactivity.
> The first request after sleep takes ~30 seconds to wake up.
> To avoid this, upgrade to Render's $7/month Starter plan, or use Railway.app free tier.

---

### Step 3 — Deploy Frontend on Vercel (free)
1. Go to https://vercel.com and sign up with GitHub (free)
2. Click **Add New → Project**
3. Import your `ipl-auction-2025` repo
4. Set:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
5. Add Environment Variable:
   - `VITE_BACKEND_URL` = `https://ipl-auction-backend.onrender.com` *(your Render URL)*
6. Click **Deploy**
7. After ~1 minute, Vercel gives you a URL like:
   `https://ipl-auction-2025.vercel.app`

---

### Step 4 — Update Backend CORS
Go back to Render → your backend service → Environment:
- Update `FRONTEND_URL` to your Vercel URL
- Click **Save Changes** (triggers a redeploy)

---

### Step 5 — Share with Friends! 🎉
Your game is now live! Share your Vercel URL:
```
https://ipl-auction-2025.vercel.app
```

Friends open this, one person creates a room, shares the room code via WhatsApp,
everyone joins and the auction begins!

---

## 🎮  How to Play

| Role | What to do |
|------|-----------|
| **Host** | Click "Create Room" → Share code via WhatsApp → Configure settings → Start Auction |
| **Player** | Click "Join Room" → Enter code → Pick IPL team → Wait for host to start |
| **Everyone** | Bid on players, build your 18-player squad within ₹120 Cr |
| **End** | Host ends game → AI ranks all teams → Best squad wins! |

---

## ⚙️  Auction Rules
- Each team starts with **₹120 crore**
- Build a squad of exactly **18 players**
- Maximum **8 overseas players** per team
- Timer restarts after every valid bid
- Unsold players get a second chance in the final round
- AI evaluates teams across 12 criteria and ranks them 1–N

---

## 🛠️  Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion, Vite |
| State | Zustand |
| Realtime | Socket.IO |
| Backend | Node.js, Express |
| Hosting | Vercel (frontend) + Render (backend) |
| Sounds | Web Audio API (no downloads needed) |

---

## 🐛  Troubleshooting

**"Connecting to server…" banner stays on screen**
→ Backend isn't running or the `VITE_BACKEND_URL` env var is wrong.
→ Check Render logs for errors.

**Friends can't join**
→ Make sure they enter the room code exactly (capitals, no spaces).
→ Verify backend is awake (visit the backend /health URL first).

**Render backend sleeping**
→ Open `https://your-backend.onrender.com/health` in browser to wake it up before the game.

**Sounds don't play**
→ Browser blocks audio until user interaction. Tap anywhere on the page first.
