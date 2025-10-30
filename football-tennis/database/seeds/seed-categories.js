/**
 * Seed Categories for Football Knowledge Tennis
 *
 * This script creates trivia categories with validation rules
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SEASON = '2024-2025';

/**
 * Category definitions with predicates for validation
 */
const categories = [
  // ============ EASY CATEGORIES ============
  {
    title: 'Players with 5+ Premier League goals this season',
    difficulty: 'easy',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'goals', scope: 'Season Total', op: '>=', value: 5, season: SEASON }
      ]
    },
    example_answer: 'Erling Haaland'
  },
  {
    title: 'Players with 100+ FPL points this season',
    difficulty: 'easy',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'fpl_points', scope: 'Season Total', op: '>=', value: 100, season: SEASON }
      ]
    },
    example_answer: 'Mohamed Salah'
  },
  {
    title: 'Players with 3+ assists this season',
    difficulty: 'easy',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'assists', scope: 'Season Total', op: '>=', value: 3, season: SEASON }
      ]
    },
    example_answer: 'Kevin De Bruyne'
  },
  {
    title: 'Goalkeepers with 5+ clean sheets this season',
    difficulty: 'easy',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'clean_sheets', scope: 'Season Total', op: '>=', value: 5, season: SEASON },
        { fact_type: 'saves', scope: 'Season Total', op: '>', value: 0, season: SEASON }
      ]
    },
    example_answer: 'Alisson'
  },
  {
    title: 'Players with 1000+ minutes played this season',
    difficulty: 'easy',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'minutes_played', scope: 'Season Total', op: '>=', value: 1000, season: SEASON }
      ]
    },
    example_answer: 'Bruno Fernandes'
  },

  // ============ MEDIUM CATEGORIES ============
  {
    title: 'Players with 10+ goals this season',
    difficulty: 'medium',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'goals', scope: 'Season Total', op: '>=', value: 10, season: SEASON }
      ]
    },
    example_answer: 'Harry Kane'
  },
  {
    title: 'Players with 5+ goals and 5+ assists this season',
    difficulty: 'medium',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'goals', scope: 'Season Total', op: '>=', value: 5, season: SEASON },
        { fact_type: 'assists', scope: 'Season Total', op: '>=', value: 5, season: SEASON }
      ]
    },
    example_answer: 'Bukayo Saka'
  },
  {
    title: 'Players with 150+ FPL points this season',
    difficulty: 'medium',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'fpl_points', scope: 'Season Total', op: '>=', value: 150, season: SEASON }
      ]
    },
    example_answer: 'Mohamed Salah'
  },
  {
    title: 'Players with 10+ bonus points this season',
    difficulty: 'medium',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'bonus_points', scope: 'Season Total', op: '>=', value: 10, season: SEASON }
      ]
    },
    example_answer: 'Erling Haaland'
  },
  {
    title: 'Goalkeepers with 50+ saves this season',
    difficulty: 'medium',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'saves', scope: 'Season Total', op: '>=', value: 50, season: SEASON }
      ]
    },
    example_answer: 'Aaron Ramsdale'
  },
  {
    title: 'Players with 3+ expected goals (xG) this season',
    difficulty: 'medium',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'xg', scope: 'Season Total', op: '>=', value: 3, season: SEASON }
      ]
    },
    example_answer: 'Darwin Nunez'
  },
  {
    title: 'Players with 3+ expected assists (xA) this season',
    difficulty: 'medium',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'xa', scope: 'Season Total', op: '>=', value: 3, season: SEASON }
      ]
    },
    example_answer: 'Kevin De Bruyne'
  },

  // ============ HARD CATEGORIES ============
  {
    title: 'Players with 15+ goals this season',
    difficulty: 'hard',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'goals', scope: 'Season Total', op: '>=', value: 15, season: SEASON }
      ]
    },
    example_answer: 'Erling Haaland'
  },
  {
    title: 'Players with 10+ assists this season',
    difficulty: 'hard',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'assists', scope: 'Season Total', op: '>=', value: 10, season: SEASON }
      ]
    },
    example_answer: 'Kevin De Bruyne'
  },
  {
    title: 'Players with 200+ FPL points this season',
    difficulty: 'hard',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'fpl_points', scope: 'Season Total', op: '>=', value: 200, season: SEASON }
      ]
    },
    example_answer: 'Erling Haaland'
  },
  {
    title: 'Goalkeepers with 10+ clean sheets this season',
    difficulty: 'hard',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'clean_sheets', scope: 'Season Total', op: '>=', value: 10, season: SEASON }
      ]
    },
    example_answer: 'Ederson'
  },
  {
    title: 'Players with 2000+ minutes played this season',
    difficulty: 'hard',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'minutes_played', scope: 'Season Total', op: '>=', value: 2000, season: SEASON }
      ]
    },
    example_answer: 'Bruno Fernandes'
  },
  {
    title: 'Players with 1000+ ICT Threat score this season',
    difficulty: 'hard',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'threat', scope: 'ICT', op: '>=', value: 1000, season: SEASON }
      ]
    },
    example_answer: 'Erling Haaland'
  },
  {
    title: 'Players with 1000+ ICT Creativity score this season',
    difficulty: 'hard',
    predicate: {
      type: 'player',
      conditions: [
        { fact_type: 'creativity', scope: 'ICT', op: '>=', value: 1000, season: SEASON }
      ]
    },
    example_answer: 'Kevin De Bruyne'
  },

  // ============ CLUB CATEGORIES ============
  {
    title: 'Premier League clubs with Elo rating above 1900',
    difficulty: 'easy',
    predicate: {
      type: 'club',
      conditions: [
        { fact_type: 'elo_rating', scope: 'Current', op: '>=', value: 1900, season: SEASON }
      ]
    },
    example_answer: 'Manchester City'
  },
  {
    title: 'Premier League clubs with FPL strength rating of 4 or 5',
    difficulty: 'easy',
    predicate: {
      type: 'club',
      conditions: [
        { fact_type: 'fpl_strength', scope: 'Overall', op: '>=', value: 4, season: SEASON }
      ]
    },
    example_answer: 'Arsenal'
  },
  {
    title: 'Premier League clubs with Elo rating above 1850',
    difficulty: 'medium',
    predicate: {
      type: 'club',
      conditions: [
        { fact_type: 'elo_rating', scope: 'Current', op: '>=', value: 1850, season: SEASON }
      ]
    },
    example_answer: 'Liverpool'
  }
];

/**
 * Seed categories into database
 */
async function seedCategories() {
  console.log('🎯 Seeding categories...');

  // Clear existing categories if needed
  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.warn('Warning clearing categories:', deleteError.message);
  }

  // Insert categories
  const { data, error } = await supabase
    .from('categories')
    .insert(categories)
    .select();

  if (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }

  console.log(`✅ Successfully seeded ${data.length} categories`);

  // Show breakdown by difficulty
  const easyCount = categories.filter(c => c.difficulty === 'easy').length;
  const mediumCount = categories.filter(c => c.difficulty === 'medium').length;
  const hardCount = categories.filter(c => c.difficulty === 'hard').length;

  console.log('\n📊 Categories by difficulty:');
  console.log(`   Easy: ${easyCount}`);
  console.log(`   Medium: ${mediumCount}`);
  console.log(`   Hard: ${hardCount}`);

  return data;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting category seeding...\n');

  try {
    await seedCategories();
    console.log('\n✨ Category seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedCategories, categories };
