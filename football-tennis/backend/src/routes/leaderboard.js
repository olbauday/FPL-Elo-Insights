/**
 * Leaderboard Routes
 * Handles leaderboard and player stats
 */

import express from 'express';
const router = express.Router();

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const { sortBy = 'elo', limit = 50 } = req.query;
    const supabase = req.app.locals.supabase;

    let orderColumn = 'elo';
    if (sortBy === 'wins') orderColumn = 'matches_won';
    if (sortBy === 'streak') orderColumn = 'current_streak';
    if (sortBy === 'points') orderColumn = 'total_points';

    const { data: leaderboard, error } = await supabase
      .from('user_stats')
      .select('*')
      .order(orderColumn, { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      throw error;
    }

    // Add rank
    const rankedLeaderboard = leaderboard.map((player, index) => ({
      ...player,
      rank: index + 1,
      win_rate: player.matches_played > 0
        ? ((player.matches_won / player.matches_played) * 100).toFixed(1)
        : 0
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player stats
router.get('/player/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = req.app.locals.supabase;

    // Get user stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError) {
      throw statsError;
    }

    if (!stats) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get recent matches
    const { data: recentMatches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        player1_info:player1(username),
        player2_info:player2(username)
      `)
      .or(`player1.eq.${userId},player2.eq.${userId}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    if (matchesError) {
      throw matchesError;
    }

    // Calculate additional stats
    const winRate = stats.matches_played > 0
      ? ((stats.matches_won / stats.matches_played) * 100).toFixed(1)
      : 0;

    res.json({
      ...stats,
      win_rate: winRate,
      recent_matches: recentMatches
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get top streaks
router.get('/streaks/current', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const { data: topStreaks, error } = await supabase
      .from('user_stats')
      .select('username, current_streak, elo')
      .gt('current_streak', 0)
      .order('current_streak', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    res.json(topStreaks);
  } catch (error) {
    console.error('Error fetching top streaks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get best streaks
router.get('/streaks/best', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const { data: bestStreaks, error } = await supabase
      .from('user_stats')
      .select('username, best_streak, elo')
      .order('best_streak', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    res.json(bestStreaks);
  } catch (error) {
    console.error('Error fetching best streaks:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
