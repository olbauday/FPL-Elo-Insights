/**
 * User Routes
 * Handles user creation and management
 */

import express from 'express';
const router = express.Router();

// Create or get user
router.post('/register', async (req, res) => {
  try {
    const { userId, username, email } = req.body;
    const supabase = req.app.locals.supabase;

    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    // Upsert user
    const { data: user, error } = await supabase
      .from('user_stats')
      .upsert(
        {
          user_id: userId,
          username,
          email: email || null
        },
        { onConflict: 'user_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = req.app.locals.supabase;

    const { data: user, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check username availability
router.get('/check/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const supabase = req.app.locals.supabase;

    const { data: existingUser, error } = await supabase
      .from('user_stats')
      .select('username')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    res.json({
      available: !existingUser
    });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
