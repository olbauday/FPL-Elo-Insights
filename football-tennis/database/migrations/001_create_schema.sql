-- Football Knowledge Tennis Database Schema
-- This schema creates all the necessary tables for the game

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENTITIES TABLE
-- Stores all football-related items (players, clubs, nations, managers)
-- ============================================================
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('player','club','nation','manager')),
  country TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Metadata
  fpl_player_id INTEGER UNIQUE, -- Link to FPL data
  fpl_team_id INTEGER UNIQUE,   -- Link to FPL team data
  -- Search optimization
  search_vector TSVECTOR
);

-- Create indexes for fast lookups
CREATE INDEX idx_entities_name ON entities USING GIN (to_tsvector('english', name));
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_fpl_player_id ON entities(fpl_player_id) WHERE fpl_player_id IS NOT NULL;
CREATE INDEX idx_entities_fpl_team_id ON entities(fpl_team_id) WHERE fpl_team_id IS NOT NULL;

-- ============================================================
-- FACTS TABLE
-- Stores verified knowledge about entities
-- ============================================================
CREATE TABLE IF NOT EXISTS facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  fact_type TEXT NOT NULL,           -- e.g. 'league_goals', 'ucl_titles', 'caps'
  value NUMERIC NOT NULL,
  scope TEXT,                        -- e.g. 'Premier League', 'UEFA', 'England'
  note TEXT,
  verified BOOLEAN DEFAULT false,    -- Whether this fact has been verified
  source TEXT,                       -- 'fpl_data', 'llm_verified', 'manual'
  season TEXT,                       -- e.g. '2024-2025'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, fact_type, scope, season)
);

-- Indexes for fast fact lookups
CREATE INDEX idx_facts_entity_id ON facts(entity_id);
CREATE INDEX idx_facts_fact_type ON facts(fact_type);
CREATE INDEX idx_facts_scope ON facts(scope);
CREATE INDEX idx_facts_verified ON facts(verified);

-- ============================================================
-- CATEGORIES TABLE
-- Defines question types and validation predicates
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  predicate JSONB NOT NULL,          -- Structured rule for validation
  example_answer TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active categories
CREATE INDEX idx_categories_active ON categories(active);
CREATE INDEX idx_categories_difficulty ON categories(difficulty);

-- ============================================================
-- USER_STATS TABLE
-- Tracks player performance and rankings
-- ============================================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  elo INTEGER DEFAULT 1200,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leaderboard queries
CREATE INDEX idx_user_stats_elo ON user_stats(elo DESC);
CREATE INDEX idx_user_stats_best_streak ON user_stats(best_streak DESC);
CREATE INDEX idx_user_stats_matches_won ON user_stats(matches_won DESC);

-- ============================================================
-- MATCHES TABLE
-- Tracks game sessions between players
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player1 UUID REFERENCES user_stats(user_id) ON DELETE SET NULL,
  player2 UUID REFERENCES user_stats(user_id) ON DELETE SET NULL,
  score_p1 INTEGER DEFAULT 0,        -- Tennis games won
  score_p2 INTEGER DEFAULT 0,
  winner UUID REFERENCES user_stats(user_id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')) DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  -- Game state
  current_rally UUID,                -- Current active rally
  -- ELO before match (for calculation)
  p1_elo_before INTEGER,
  p2_elo_before INTEGER
);

-- Indexes for match queries
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_player1 ON matches(player1);
CREATE INDEX idx_matches_player2 ON matches(player2);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);

-- ============================================================
-- RALLIES TABLE
-- Tracks individual question rounds within matches
-- ============================================================
CREATE TABLE IF NOT EXISTS rallies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  winner UUID REFERENCES user_stats(user_id) ON DELETE SET NULL,
  answers JSONB DEFAULT '[]'::jsonb, -- Array of answer submissions
  status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active',
  current_turn UUID,                 -- Which player's turn
  -- Tennis point state
  p1_points INTEGER DEFAULT 0,       -- 0, 15, 30, 40, advantage
  p2_points INTEGER DEFAULT 0,
  deuce BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for rally queries
CREATE INDEX idx_rallies_match_id ON rallies(match_id);
CREATE INDEX idx_rallies_status ON rallies(status);
CREATE INDEX idx_rallies_category_id ON rallies(category_id);

-- ============================================================
-- ANSWER_SUBMISSIONS TABLE
-- Detailed log of each answer attempt
-- ============================================================
CREATE TABLE IF NOT EXISTS answer_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rally_id UUID REFERENCES rallies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_stats(user_id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  valid BOOLEAN NOT NULL,
  reason TEXT,                       -- Why it was valid/invalid
  entity_id UUID REFERENCES entities(id), -- Matched entity if valid
  verification_method TEXT,          -- 'rule', 'llm', 'cached'
  time_taken INTERVAL,               -- How long to answer
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for answer analytics
CREATE INDEX idx_answer_submissions_rally_id ON answer_submissions(rally_id);
CREATE INDEX idx_answer_submissions_user_id ON answer_submissions(user_id);
CREATE INDEX idx_answer_submissions_valid ON answer_submissions(valid);

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facts_updated_at BEFORE UPDATE ON facts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user stats after match completion
CREATE OR REPLACE FUNCTION update_user_stats_after_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update winner stats
    IF NEW.winner IS NOT NULL THEN
      UPDATE user_stats
      SET matches_played = matches_played + 1,
          matches_won = matches_won + 1,
          current_streak = current_streak + 1,
          best_streak = GREATEST(best_streak, current_streak + 1),
          total_points = total_points + (NEW.score_p1 + NEW.score_p2)
      WHERE user_id = NEW.winner;

      -- Update loser stats
      UPDATE user_stats
      SET matches_played = matches_played + 1,
          current_streak = 0
      WHERE user_id = CASE
        WHEN NEW.winner = NEW.player1 THEN NEW.player2
        ELSE NEW.player1
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_match_complete AFTER UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_user_stats_after_match();

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  user_id,
  username,
  elo,
  matches_played,
  matches_won,
  CASE WHEN matches_played > 0
    THEN ROUND((matches_won::numeric / matches_played::numeric) * 100, 1)
    ELSE 0
  END as win_rate,
  current_streak,
  best_streak,
  total_points
FROM user_stats
ORDER BY elo DESC, matches_won DESC, current_streak DESC;

-- Active matches view
CREATE OR REPLACE VIEW active_matches AS
SELECT
  m.id,
  m.status,
  p1.username as player1_name,
  p2.username as player2_name,
  m.score_p1,
  m.score_p2,
  m.created_at
FROM matches m
LEFT JOIN user_stats p1 ON m.player1 = p1.user_id
LEFT JOIN user_stats p2 ON m.player2 = p2.user_id
WHERE m.status IN ('waiting', 'active')
ORDER BY m.created_at DESC;

-- Player statistics view
CREATE OR REPLACE VIEW player_entity_stats AS
SELECT
  e.id,
  e.name,
  e.country,
  e.active,
  COUNT(DISTINCT f.id) as facts_count,
  json_agg(
    json_build_object(
      'fact_type', f.fact_type,
      'value', f.value,
      'scope', f.scope,
      'season', f.season
    )
  ) FILTER (WHERE f.id IS NOT NULL) as facts
FROM entities e
LEFT JOIN facts f ON e.id = f.entity_id
WHERE e.type = 'player'
GROUP BY e.id, e.name, e.country, e.active;

-- Comments for documentation
COMMENT ON TABLE entities IS 'All football entities (players, clubs, nations, managers)';
COMMENT ON TABLE facts IS 'Verified facts about entities for game validation';
COMMENT ON TABLE categories IS 'Question categories with validation rules';
COMMENT ON TABLE user_stats IS 'Player rankings, stats, and ELO ratings';
COMMENT ON TABLE matches IS 'Game sessions between two players';
COMMENT ON TABLE rallies IS 'Individual question rounds within matches';
COMMENT ON TABLE answer_submissions IS 'Detailed log of all answer attempts';
