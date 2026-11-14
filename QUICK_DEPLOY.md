# ⚡ DEPLOY IN 5 MINUTES

## Step 1 — Create GitHub Repository (2 min)

1. Open: https://github.com/new
2. Repository name: `ipl-auction-2025`
3. Set to **Public**
4. Click **Create repository** (do NOT add README)
5. Copy the HTTPS URL shown

Then run these 3 commands in your terminal at `D:\IPL 2025`:

```
git remote set-url origin https://github.com/MedaAbhinav/ipl-auction-2025.git
git push -u origin main
```

If asked for password → use a **Personal Access Token**:
- Go to: https://github.com/settings/tokens/new
- Note: `ipl-deploy`, Expiration: 90 days
- Check ✅ **repo** scope
- Click Generate → Copy the token
- Use it as the password when git asks

---

## Step 2 — Deploy Backend on Render (2 min)

1. Go to: https://render.com → Sign up free
2. Click **New → Web Service**
3. Choose **Deploy from Git** → connect GitHub → select `ipl-auction-2025`
4. Settings:
   - **Name**: `ipl-auction-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `4000`
   - `FRONTEND_URL` = `https://ipl-auction-2025.vercel.app`
6. Click **Create Web Service**
7. Wait ~2 min → copy the URL like: `https://ipl-auction-backend.onrender.com`

---

## Step 3 — Deploy Frontend on Vercel (1 min)

### Option A — Vercel Dashboard (Easiest)
1. Go to: https://vercel.com → Login with GitHub
2. Click **Add New → Project**
3. Import `ipl-auction-2025`
4. Set **Root Directory** to `frontend`
5. Add Environment Variable:
   - `VITE_BACKEND_URL` = `https://ipl-auction-backend.onrender.com`
6. Click **Deploy**
7. Get your URL: `https://ipl-auction-2025.vercel.app`

### Option B — CLI (Already installed)
```
cd "d:\IPL 2025\frontend"
vercel --prod
```
When prompted:
- Login with GitHub
- Project name: `ipl-auction-2025`
- Root directory: `./` (we are already in frontend)
- Override build: `No`
- Then set env var: `vercel env add VITE_BACKEND_URL`
  Value: `https://ipl-auction-backend.onrender.com`

---

## Step 4 — Update Backend CORS

In Render dashboard → Environment:
- Update `FRONTEND_URL` to your actual Vercel URL
- Save → auto-redeploys

---

## 🎉 DONE! Share this link with friends:
`https://ipl-auction-2025.vercel.app`

## ▶️ Play Locally RIGHT NOW (no deployment needed):

**Terminal 1:**
```
cd "d:\IPL 2025\backend"
npm run dev
```

**Terminal 2:**
```
cd "d:\IPL 2025\frontend"  
npm run dev
```

Open: http://localhost:5173
