/**
 * Import FPL Data into Football Tennis Database
 *
 * This script reads the FPL CSV data and populates the entities and facts tables
 * for use in the Football Knowledge Tennis game.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SEASON = '2024-2025';
const DATA_PATH = path.join(process.cwd(), '..', '..', 'data', SEASON);

/**
 * Read CSV file and return parsed data
 */
function readCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
    cast_date: false
  });
}

/**
 * Import teams as club entities
 */
async function importTeams() {
  console.log('📊 Importing teams...');

  const teamsPath = path.join(DATA_PATH, 'teams', 'teams.csv');
  const teams = readCSV(teamsPath);

  const entities = [];
  const facts = [];

  for (const team of teams) {
    const entityId = crypto.randomUUID();

    // Create entity
    entities.push({
      id: entityId,
      name: team.name,
      type: 'club',
      country: 'England', // Premier League teams
      active: true,
      fpl_team_id: parseInt(team.id)
    });

    // Create facts for team strength and Elo
    if (team.elo) {
      facts.push({
        entity_id: entityId,
        fact_type: 'elo_rating',
        value: parseFloat(team.elo),
        scope: 'Current',
        season: SEASON,
        verified: true,
        source: 'fpl_data'
      });
    }

    if (team.strength) {
      facts.push({
        entity_id: entityId,
        fact_type: 'fpl_strength',
        value: parseInt(team.strength),
        scope: 'Overall',
        season: SEASON,
        verified: true,
        source: 'fpl_data'
      });
    }
  }

  // Batch insert entities
  const { data: insertedEntities, error: entitiesError } = await supabase
    .from('entities')
    .upsert(entities, { onConflict: 'fpl_team_id' })
    .select();

  if (entitiesError) {
    console.error('Error inserting team entities:', entitiesError);
    return;
  }

  // Batch insert facts
  if (facts.length > 0) {
    const { error: factsError } = await supabase
      .from('facts')
      .upsert(facts, {
        onConflict: 'entity_id,fact_type,scope,season',
        ignoreDuplicates: false
      });

    if (factsError) {
      console.error('Error inserting team facts:', factsError);
    }
  }

  console.log(`✅ Imported ${entities.length} teams with ${facts.length} facts`);
}

/**
 * Import players as player entities
 */
async function importPlayers() {
  console.log('👥 Importing players...');

  const playersPath = path.join(DATA_PATH, 'players', 'players.csv');
  const players = readCSV(playersPath);

  const entities = [];

  for (const player of players) {
    // Skip invalid players
    if (player.position === 'Unknown') continue;

    entities.push({
      id: crypto.randomUUID(),
      name: `${player.first_name} ${player.second_name}`.trim(),
      type: 'player',
      country: null, // We don't have country data in the CSV
      active: true,
      fpl_player_id: parseInt(player.player_id)
    });
  }

  // Batch insert players in chunks
  const CHUNK_SIZE = 100;
  for (let i = 0; i < entities.length; i += CHUNK_SIZE) {
    const chunk = entities.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('entities')
      .upsert(chunk, { onConflict: 'fpl_player_id' });

    if (error) {
      console.error(`Error inserting players chunk ${i}-${i + CHUNK_SIZE}:`, error);
    }
  }

  console.log(`✅ Imported ${entities.length} players`);
}

/**
 * Import player statistics as facts
 */
async function importPlayerStats() {
  console.log('📈 Importing player statistics...');

  // First, get all player entities with their FPL IDs
  const { data: playerEntities, error: entitiesError } = await supabase
    .from('entities')
    .select('id, fpl_player_id')
    .eq('type', 'player')
    .not('fpl_player_id', 'is', null);

  if (entitiesError) {
    console.error('Error fetching player entities:', entitiesError);
    return;
  }

  // Create a map of FPL ID to entity ID
  const fplIdToEntityId = new Map();
  playerEntities.forEach(entity => {
    fplIdToEntityId.set(entity.fpl_player_id, entity.id);
  });

  // Read player stats from FPL data
  // Note: The actual playerstats.csv may not have all stats, so we'll check what's available
  const statsPath = path.join(DATA_PATH, 'playerstats', 'playerstats.csv');

  if (!fs.existsSync(statsPath)) {
    console.warn('⚠️  playerstats.csv not found, skipping player stats import');
    return;
  }

  const stats = readCSV(statsPath);

  const facts = [];

  // Define which stats to import and their mappings
  const statMappings = [
    { csv: 'total_points', fact_type: 'fpl_points', scope: 'Season Total' },
    { csv: 'minutes', fact_type: 'minutes_played', scope: 'Season Total' },
    { csv: 'goals_scored', fact_type: 'goals', scope: 'Season Total' },
    { csv: 'assists', fact_type: 'assists', scope: 'Season Total' },
    { csv: 'clean_sheets', fact_type: 'clean_sheets', scope: 'Season Total' },
    { csv: 'goals_conceded', fact_type: 'goals_conceded', scope: 'Season Total' },
    { csv: 'saves', fact_type: 'saves', scope: 'Season Total' },
    { csv: 'bonus', fact_type: 'bonus_points', scope: 'Season Total' },
    { csv: 'yellow_cards', fact_type: 'yellow_cards', scope: 'Season Total' },
    { csv: 'red_cards', fact_type: 'red_cards', scope: 'Season Total' },
    { csv: 'expected_goals', fact_type: 'xg', scope: 'Season Total' },
    { csv: 'expected_assists', fact_type: 'xa', scope: 'Season Total' },
    { csv: 'influence', fact_type: 'influence', scope: 'ICT' },
    { csv: 'creativity', fact_type: 'creativity', scope: 'ICT' },
    { csv: 'threat', fact_type: 'threat', scope: 'ICT' }
  ];

  for (const playerStat of stats) {
    const playerId = parseInt(playerStat.id);
    const entityId = fplIdToEntityId.get(playerId);

    if (!entityId) continue;

    // Import each stat type
    for (const mapping of statMappings) {
      const value = playerStat[mapping.csv];

      // Only import if value exists and is not zero
      if (value !== undefined && value !== null && value !== '' && parseFloat(value) > 0) {
        facts.push({
          entity_id: entityId,
          fact_type: mapping.fact_type,
          value: parseFloat(value),
          scope: mapping.scope,
          season: SEASON,
          verified: true,
          source: 'fpl_data'
        });
      }
    }
  }

  // Batch insert facts in chunks
  const CHUNK_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < facts.length; i += CHUNK_SIZE) {
    const chunk = facts.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('facts')
      .upsert(chunk, {
        onConflict: 'entity_id,fact_type,scope,season',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error inserting facts chunk ${i}-${i + CHUNK_SIZE}:`, error);
    } else {
      inserted += chunk.length;
    }
  }

  console.log(`✅ Imported ${inserted} player facts`);
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting FPL data import...\n');

  try {
    await importTeams();
    await importPlayers();
    await importPlayerStats();

    console.log('\n✨ Data import completed successfully!');

    // Print summary
    const { count: entitiesCount } = await supabase
      .from('entities')
      .select('*', { count: 'exact', head: true });

    const { count: factsCount } = await supabase
      .from('facts')
      .select('*', { count: 'exact', head: true });

    console.log('\n📊 Database Summary:');
    console.log(`   Entities: ${entitiesCount}`);
    console.log(`   Facts: ${factsCount}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { importTeams, importPlayers, importPlayerStats };
