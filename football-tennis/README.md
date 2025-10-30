# ⚽🎾 Football Knowledge Tennis

A real-time trivia game where two players rally football facts back and forth — like a tennis match! Built with React, Node.js, Express, Socket.IO, and Supabase.

## 🎯 Overview

Football Knowledge Tennis combines:
- **Tennis-style scoring** (0, 15, 30, 40, Deuce, Game)
- **Rule-based validation** using FPL data
- **LLM referee** for fallback verification (OpenAI)
- **Real-time gameplay** with Socket.IO
- **ELO ratings** and leaderboards

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS |
| **Backend** | Node.js + Express + Socket.IO |
| **Database** | Supabase (PostgreSQL) |
| **Real-time** | Socket.IO |
| **AI** | OpenAI (optional) |

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account ([create one free](https://supabase.com))
- OpenAI API key (optional, for LLM fallback)
- FPL data in parent directory (from FPL-Elo-Insights repo)

## 🚀 Quick Start

### 1. Database Setup

1. Create a new Supabase project
2. Run the database migration:

```bash
cd football-tennis/database
# Copy the SQL from migrations/001_create_schema.sql
# Paste and run it in Supabase SQL Editor
```

### 2. Backend Setup

```bash
cd football-tennis/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
# Add SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY

# Import FPL data (run from project root)
node database/seeds/import-fpl-data.js

# Seed categories
node database/seeds/seed-categories.js

# Start backend server
npm run dev
```

The backend will start on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd football-tennis/frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed (defaults should work)

# Start frontend dev server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Play!

1. Open `http://localhost:5173` in two browser windows
2. Enter usernames in both
3. Create a match in one window
4. Join the match in the other window
5. Start playing!

## 🎮 How to Play

### Game Rules

1. **Match Format**: Single set (MVP version)
2. **Scoring**: Tennis-style points (0, 15, 30, 40, Game)
3. **Turn Time**: 10 seconds per answer
4. **Victory**: First to 6 games with 2-game margin

### Gameplay Flow

1. A category is displayed (e.g., "Players with 10+ goals this season")
2. Players take turns naming valid answers
3. Valid answer → turn switches to opponent
4. Invalid/duplicate/timeout → opponent wins the point
5. Points accumulate using tennis scoring
6. Win 6 games to win the match!

## 🗂️ Project Structure

```
football-tennis/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   │   ├── tennis-scoring.js      # Tennis rules
│   │   │   ├── validation-engine.js   # Answer validation
│   │   │   └── socket-handler.js      # WebSocket handling
│   │   └── index.js         # Express server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Home.jsx              # Main menu
│   │   │   ├── Game.jsx              # Game screen
│   │   │   ├── Scoreboard.jsx        # Score display
│   │   │   ├── AnswerInput.jsx       # Input field
│   │   │   ├── Timer.jsx             # Countdown timer
│   │   │   ├── AnswerHistory.jsx     # Rally log
│   │   │   └── Leaderboard.jsx       # Rankings
│   │   ├── services/        # API & Socket services
│   │   └── App.jsx
│   └── package.json
│
├── database/
│   ├── migrations/
│   │   └── 001_create_schema.sql    # Database schema
│   └── seeds/
│       ├── import-fpl-data.js       # Import FPL data
│       └── seed-categories.js       # Create categories
│
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
SUPABASE_URL=             # Your Supabase project URL
SUPABASE_SERVICE_KEY=     # Your Supabase service role key
OPENAI_API_KEY=           # OpenAI API key (optional)
PORT=3000
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

## 📊 Database Schema

### Core Tables

- **entities** - Players, clubs, nations
- **facts** - Verified statistics about entities
- **categories** - Question types with validation rules
- **matches** - Game sessions
- **rallies** - Individual rounds within matches
- **user_stats** - Player rankings and ELO
- **answer_submissions** - Detailed answer log

See `database/migrations/001_create_schema.sql` for full schema.

## 🧠 Validation System

### Three-Step Validation

1. **Duplicate Check**: Ensure answer hasn't been used
2. **Entity Lookup**: Fuzzy match player/club name
3. **Rule-Based Check**: Verify facts against database
4. **LLM Fallback** (optional): Use OpenAI for ambiguous cases

### Example Category

```json
{
  "title": "Players with 10+ goals this season",
  "predicate": {
    "type": "player",
    "conditions": [
      {
        "fact_type": "goals",
        "scope": "Season Total",
        "op": ">=",
        "value": 10,
        "season": "2024-2025"
      }
    ]
  }
}
```

## 🎾 Tennis Scoring

### Point Progression

- 0 (Love) → 15 → 30 → 40 → Game
- 40-40 → Deuce
- Deuce + point → Advantage
- Advantage + point → Game Won
- Advantage + loss → Back to Deuce

### ELO System

- Starting ELO: 1200
- K-factor: 24
- Updates after each match based on opponent's ELO

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev  # Starts with nodemon (auto-reload)
```

### Frontend Development

```bash
cd frontend
npm run dev  # Starts Vite dev server (HMR enabled)
```

### Testing the Game Solo

You can test by opening two browser windows/tabs:
1. Window 1: Create a match
2. Window 2: Join the match using the match ID
3. Play against yourself!

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Railway/Render/DigitalOcean)

```bash
cd backend
npm start
# Ensure environment variables are set
```

### Database (Supabase)

Already hosted! Just ensure:
- Database migrations are run
- FPL data is imported
- Categories are seeded

## 📝 API Endpoints

### Matches
- `POST /api/matches/create` - Create new match
- `POST /api/matches/join/:matchId` - Join match
- `GET /api/matches/:matchId` - Get match details
- `GET /api/matches` - List available matches
- `GET /api/matches/history/:userId` - Match history

### Categories
- `GET /api/categories/random` - Get random category
- `GET /api/categories` - List all categories
- `GET /api/categories/:categoryId` - Get category

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/leaderboard/player/:userId` - Player stats
- `GET /api/leaderboard/streaks/current` - Current streaks
- `GET /api/leaderboard/streaks/best` - Best streaks

### Users
- `POST /api/users/register` - Register user
- `GET /api/users/:userId` - Get user
- `GET /api/users/check/:username` - Check username

## 🎨 Features

### ✅ MVP Features (Implemented)

- ✅ Real-time 1v1 gameplay
- ✅ Tennis scoring system
- ✅ Answer validation engine
- ✅ FPL data integration
- ✅ Category system (20+ categories)
- ✅ ELO ranking system
- ✅ Leaderboard
- ✅ Match history
- ✅ Beautiful UI with Tailwind

### 🔮 Future Enhancements

- 🔄 Tournament bracket mode
- 🔄 Best-of-3 sets
- 🔄 Spectator mode
- 🔄 Voice input
- 🔄 AI opponent
- 🔄 Category packs (World Cup, Champions League)
- 🔄 Mobile app
- 🔄 Social features (friends, chat)

## 🐛 Troubleshooting

### Backend won't start
- Check .env file exists and has correct values
- Ensure Supabase credentials are correct
- Check port 3000 is not in use

### Frontend won't connect to backend
- Verify backend is running on port 3000
- Check VITE_API_URL in .env
- Check browser console for CORS errors

### Database errors
- Ensure migrations are run in Supabase
- Check Supabase service key (not anon key)
- Verify FPL data is imported

### Socket connection fails
- Check firewall isn't blocking port 3000
- Verify VITE_SOCKET_URL is correct
- Check browser console for WebSocket errors

## 🤝 Contributing

This is a hackathon project! Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Credits

Built using data from:
- **FPL-Elo-Insights** repository
- FPL Official API
- ClubElo.com

Inspired by the beautiful game ⚽ and the sport of tennis 🎾

## 🎯 MVP Checklist

- [x] Database schema
- [x] Backend API
- [x] Socket.IO real-time
- [x] Tennis scoring logic
- [x] Answer validation
- [x] React frontend
- [x] Game UI components
- [x] Leaderboard
- [x] FPL data import
- [x] Category seeding
- [x] Environment configuration
- [x] Documentation

## 🚀 Ready to Rally?

```bash
# Terminal 1: Backend
cd football-tennis/backend && npm run dev

# Terminal 2: Frontend
cd football-tennis/frontend && npm run dev

# Browser: http://localhost:5173
🎾 Let's play Football Knowledge Tennis! ⚽
```

---

Built with ⚡ for hackathons | Powered by ⚽ FPL data | Scored like 🎾 tennis
