# ⚡ Quick Start Guide - Test Football Tennis NOW!

## Step-by-Step (15 minutes)

### 1. ☁️ Set Up Supabase (5 min)

1. Go to **https://supabase.com** and sign up/login
2. Click **"New Project"**
3. Choose:
   - Name: `football-tennis` (or anything)
   - Database Password: (create one)
   - Region: (closest to you)
4. Wait ~2 minutes for provisioning ⏳

### 2. 🗄️ Create Database Schema (2 min)

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open this file in your editor: `database/migrations/001_create_schema.sql`
4. Copy ALL the SQL code (it's long, ~450 lines)
5. Paste into Supabase SQL Editor
6. Click **"Run"** ▶️
7. You should see "Success. No rows returned"

### 3. 🔑 Get Your Credentials (1 min)

1. In Supabase, go to **Settings** → **API**
2. Copy these TWO values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **service_role key** (the LONG secret key - NOT the anon key!)

### 4. ⚙️ Configure Backend (1 min)

Edit `backend/.env` and replace:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

With your actual values from Step 3.

**Save the file!**

### 5. 📊 Import Data (3 min)

Run the automated setup:

```bash
cd /home/user/FPL-Elo-Insights/football-tennis
./setup.sh
```

This will:
- ✅ Import all FPL players and teams
- ✅ Seed 20+ trivia categories
- ✅ Verify everything is ready

### 6. 🚀 Start Playing! (1 min)

**Option A: Automatic (Both servers at once)**
```bash
./start.sh
```

**Option B: Manual (Two separate terminals)**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### 7. 🎮 Play the Game!

1. Open **http://localhost:5173** in your browser
2. Enter a username (e.g., "Player1")
3. Click **"Create New Match"**
4. Open **http://localhost:5173** in a NEW INCOGNITO/PRIVATE window
5. Enter a different username (e.g., "Player2")
6. Click **"Join Random Match"**
7. **START PLAYING!** 🎾⚽

---

## 🎯 How to Play

### The Game
You'll see a category like: **"Players with 10+ goals this season"**

**Your turn:**
1. Type a valid answer (e.g., "Haaland")
2. Press Enter or click Submit
3. You have **10 seconds**!

**Valid answer** = Your opponent's turn
**Invalid/duplicate/timeout** = Opponent wins a point

### Tennis Scoring
- Point 1: **15**
- Point 2: **30**
- Point 3: **40**
- Point 4: **Game** (if ahead by 2)
- 40-40: **Deuce**
- After Deuce: **Advantage** then **Game**

**Win 6 games to win the match!** 🏆

---

## ❓ Troubleshooting

### Backend won't start
```bash
# Check your .env file has real credentials
cat backend/.env

# Make sure port 3000 is free
lsof -ti:3000 | xargs kill -9  # Kill anything on port 3000
```

### "No categories found" error
```bash
# Re-run the seed script
cd database/seeds
node seed-categories.js
```

### "Socket connection failed"
- Make sure backend is running first
- Check http://localhost:3000/health in your browser
- Should see `{"status":"ok"}`

### Frontend won't load
```bash
# Make sure you're in the right directory
cd frontend
npm run dev
```

---

## 🎨 Example Categories

Easy:
- Players with 5+ goals this season
- Players with 100+ FPL points
- Goalkeepers with 5+ clean sheets

Medium:
- Players with 10+ goals this season
- Players with 5+ goals AND 5+ assists
- Players with 150+ FPL points

Hard:
- Players with 15+ goals this season
- Players with 200+ FPL points
- Goalkeepers with 10+ clean sheets

---

## 🏆 Features You'll See

- ⚡ Real-time gameplay (no refresh needed!)
- 🎾 Tennis-style scoring (Love, 15, 30, 40, Deuce)
- ⏱️ 10-second countdown timer
- ✅ Instant validation feedback
- 📊 Live scoreboard
- 🏅 ELO rankings
- 📈 Leaderboard with streaks

---

## 🚪 Exit

Press `Ctrl+C` in the terminals to stop the servers.

---

**Need help?** Check the main README.md for detailed docs!

Ready? Let's play! 🎾⚽✨
