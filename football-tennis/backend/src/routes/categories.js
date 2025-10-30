/**
 * Category Routes
 * Handles category retrieval and management
 */

import express from 'express';
const router = express.Router();

// Get random category
router.get('/random', async (req, res) => {
  try {
    const { difficulty } = req.query;
    const supabase = req.app.locals.supabase;

    let query = supabase
      .from('categories')
      .select('*')
      .eq('active', true);

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: categories, error } = await query;

    if (error) {
      throw error;
    }

    if (!categories || categories.length === 0) {
      return res.status(404).json({ error: 'No categories found' });
    }

    // Select random category
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    res.json(randomCategory);
  } catch (error) {
    console.error('Error fetching random category:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all categories
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('difficulty', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(categories);
  } catch (error) {
    console.error('Error listing categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get category by ID
router.get('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const supabase = req.app.locals.supabase;

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) {
      throw error;
    }

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
