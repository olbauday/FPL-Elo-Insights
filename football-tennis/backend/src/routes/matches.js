/**
 * Match Routes
 * Handles match creation, joining, and retrieval
 */

import express from 'express';
const router = express.Router();

// Create a new match
router.post('/create', async (req, res) => {
  try {
    const { userId, username } = req.body;
    const supabase = req.app.locals.supabase;

    // Get or create user
    const { data: user, error: userError } = await supabase
      .from('user_stats')
      .upsert(
        { user_id: userId, username },
        { onConflict: 'user_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    // Create match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        player1: userId,
        status: 'waiting',
        score_p1: 0,
        score_p2: 0,
        p1_elo_before: user.elo
      })
      .select()
      .single();

    if (matchError) {
      throw matchError;
    }

    res.json({
      success: true,
      match: {
        id: match.id,
        status: match.status,
        player1: userId
      }
    });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: error.message });
  }
});

// Join an existing match
router.post('/join/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId, username } = req.body;
    const supabase = req.app.locals.supabase;

    // Get or create user
    const { data: user, error: userError } = await supabase
      .from('user_stats')
      .upsert(
        { user_id: userId, username },
        { onConflict: 'user_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if match is available
    if (match.player2) {
      return res.status(400).json({ error: 'Match is full' });
    }

    if (match.player1 === userId) {
      return res.status(400).json({ error: 'Cannot join your own match' });
    }

    // Update match
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({
        player2: userId,
        status: 'active',
        p2_elo_before: user.elo
      })
      .eq('id', matchId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      match: updatedMatch
    });
  } catch (error) {
    console.error('Error joining match:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get match details
router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const supabase = req.app.locals.supabase;

    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1_info:player1(username, elo),
        player2_info:player2(username, elo),
        rallies(
          *,
          category:category_id(*)
        )
      `)
      .eq('id', matchId)
      .single();

    if (error) {
      throw error;
    }

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: error.message });
  }
});

// List available matches
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1_info:player1(username, elo)
      `)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    res.json(matches);
  } catch (error) {
    console.error('Error listing matches:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get match history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = req.app.locals.supabase;

    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1_info:player1(username, elo),
        player2_info:player2(username, elo)
      `)
      .or(`player1.eq.${userId},player2.eq.${userId}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    res.json(matches);
  } catch (error) {
    console.error('Error fetching match history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
