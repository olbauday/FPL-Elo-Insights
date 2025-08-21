import { getCsvPath } from '../utils/csvPathConfig';
import { loadCSVData } from '../utils/dataLoader';
import { mapToCaptainCandidates } from '../utils/candidateMapper';
import { updateCaptainScores } from '../engine/captainScore';
import { enrichWithRecentPerformance } from '../utils/performanceEnricher';

export async function getCaptainCandidates(gameweek: number, season: string = '2025-2026') {
  try {
    // Load all required data files
    const playersPath = getCsvPath({ season, dataType: 'players' });
    const teamsPath = getCsvPath({ season, dataType: 'teams' });
    const playerstatsPath = getCsvPath({ season, dataType: 'playerstats' });
    const fixturesPath = getCsvPath({ season, dataType: 'matches', gameweek });
    
    // Try GW-specific playerstats first, then fall back to master
    const gwPlayerstatsPath = getCsvPath({ season, gameweek, dataType: 'playerstats' });
    
    // Load data in parallel
    const [players, teams, fixtures] = await Promise.all([
      loadCSVData<any>(playersPath),
      loadCSVData<any>(teamsPath),
      loadCSVData<any>(fixturesPath).catch(err => {
        console.warn('Failed to load fixtures, using default difficulty:', err);
        return [];
      })
    ]);

    // Enhanced playerstats loading strategy
    let gwPlayerStats: any[] = [];
    let dataSource = 'unknown';

    // Strategy 1: Try GW-specific playerstats (with schema validation)
    try {
      gwPlayerStats = await loadCSVData<any>(gwPlayerstatsPath);
      if (gwPlayerStats.length > 0) {
        // Validate schema: require an id-like field
        const first = gwPlayerStats[0] || {};
        const keys = Object.keys(first);
        const hasIdField = 'id' in first || 'element_id' in first || 'player_id' in first || 'element' in first || 'playerId' in first;
        if (!hasIdField) {
          console.warn(`❗ Invalid GW-specific playerstats schema (missing id). Falling back. Keys:`, keys);
          gwPlayerStats = [];
        } else {
          dataSource = `GW-specific (${gwPlayerstatsPath})`;
          console.log(`✅ Using GW-specific playerstats: ${gwPlayerStats.length} players`);
        }
      }
    } catch (err) {
      console.warn(`GW-specific playerstats not found: ${gwPlayerstatsPath}`);
    }

    // Strategy 2: Fall back to master file with GW filtering
    if (gwPlayerStats.length === 0) {
      try {
        const masterStats = await loadCSVData<any>(playerstatsPath);
        gwPlayerStats = masterStats.filter((stats: any) => Number(stats.gw) === gameweek);
        if (gwPlayerStats.length > 0) {
          dataSource = `master filtered by GW${gameweek}`;
          console.log(`⚠️ Using master playerstats filtered by GW: ${gwPlayerStats.length} players`);
        }
      } catch (err) {
        console.warn(`Failed to load master playerstats: ${playerstatsPath}`);
      }
    }

    // Strategy 3: Use all master data as last resort
    if (gwPlayerStats.length === 0) {
      try {
        gwPlayerStats = await loadCSVData<any>(playerstatsPath);
        dataSource = 'master (all season)';
        console.warn(`🔄 Fallback: Using all season playerstats (${gwPlayerStats.length} players) - recommendations will be static`);
      } catch (err) {
        throw new Error(`All playerstats loading strategies failed for ${season} GW${gameweek}`);
      }
    }

  console.log(`📊 Data source: ${dataSource}`);
    
    // Debug: check what fields we actually have
    if (gwPlayerStats.length > 0) {
      console.log('🔍 Sample raw data (first row):', gwPlayerStats[0]);
      console.log('🔍 Available fields:', Object.keys(gwPlayerStats[0]));
    }
    
    // Create fixture difficulty lookup
    const getFixtureDifficulty = (teamCode: string): number => {
      if (!fixtures.length) return 3; // Default if no fixtures loaded
      
      // Convert teamCode to number for comparison (fixtures have numeric team codes)
      const teamCodeNum = Number(teamCode);
      
      const fixture = fixtures.find((f: any) => 
        Number(f.home_team) === teamCodeNum || Number(f.away_team) === teamCodeNum
      );
      
      if (!fixture) return 3; // Default if no fixture found
      
      const isHome = Number(fixture.home_team) === teamCodeNum;
      const opponentCode = isHome ? Number(fixture.away_team) : Number(fixture.home_team);
      const opponent = teams.find((t: any) => Number(t.code) === opponentCode);
      
      if (!opponent) return 3; // Default if opponent not found
      
      // Use team strength (2-5 scale) as fixture difficulty
      return Number(opponent.strength) || 3;
    };
    
    // Join the data with performance enrichment
    const enrichedPlayerStats = await Promise.all(
      gwPlayerStats.map(async (stats: any) => {
        // Resolve id across schemas
        const sid = stats.id ?? stats.element_id ?? stats.element ?? stats.player_id ?? stats.playerId;
        const player = players.find((p: any) => {
          return (
            String(p.player_id) === String(sid) ||
            String(p.id) === String(sid) ||
            String(p.element_id) === String(sid)
          );
        });
        const team = teams.find((t: any) => Number(t.code) === Number(player?.team_code) || Number(t.id) === Number(player?.team_id));
        
        // Enrich with recent performance if data seems stale
        const enrichedStats = await enrichWithRecentPerformance(stats, season, gameweek);
        
        return {
          ...enrichedStats,
          web_name: player?.web_name ?? (player?.first_name && player?.second_name ? `${player.first_name} ${player.second_name}` : player?.name) ?? 'Unknown',
          team: team?.short_name ?? team?.name ?? player?.team_code ?? 'Unknown',
          position: player?.position ?? player?.element_type ?? 'Unknown',
          fixture_difficulty: getFixtureDifficulty(player?.team_code) // Calculate real fixture difficulty
        };
      })
    );
    
    const candidates = mapToCaptainCandidates(enrichedPlayerStats);
    const candidatesWithScores = updateCaptainScores(candidates);
    
    // Filter out players with missing/invalid data
    const validCandidates = candidatesWithScores.filter(candidate => {
      const isValid = (
        candidate.name !== 'Unknown' && 
        candidate.team !== 'Unknown' &&
        candidate.price > 0 &&
        !isNaN(candidate.captain_score)
      );
      
      if (!isValid) {
        console.log('❌ Filtering out candidate:', {
          name: candidate.name,
          team: candidate.team,
          price: candidate.price,
          score: candidate.captain_score,
          reason: candidate.name === 'Unknown' ? 'Unknown name' :
                 candidate.team === 'Unknown' ? 'Unknown team' :
                 candidate.price <= 0 ? 'Invalid price' :
                 isNaN(candidate.captain_score) ? 'Invalid score' : 'Unknown'
        });
      }
      
      return isValid;
    });
    
    console.log('📊 Validation results:', {
      totalMapped: candidates.length,
      withScores: candidatesWithScores.length,
      valid: validCandidates.length,
      filtered: candidatesWithScores.length - validCandidates.length
    });
    
    // Sort by captain score (highest first)
    const sortedCandidates = validCandidates.sort((a, b) => b.captain_score - a.captain_score);
    
    // Console log top 20 for analysis
    console.log(`\n🏆 TOP 20 CAPTAIN CANDIDATES (${season} GW${gameweek}) 🏆`);
    console.table(
      sortedCandidates.slice(0, 20).map((candidate, index) => ({
        Rank: index + 1,
        Name: candidate.name,
        Team: candidate.team,
        Position: candidate.position,
        Price: `£${candidate.price}m`,
        Form: candidate.form_score,
        'Fixture Diff': candidate.fixture_difficulty,
        'xGI/90': candidate.xgi_per_90.toFixed(2),
        'Min Risk': candidate.minutes_risk,
        'Captain Score': candidate.captain_score.toFixed(1)
      }))
    );
    
    console.log('🎯 Returning candidates:', sortedCandidates.length, 'total, top 50 to UI');
    
    // Return top 50 for display (increased from 10 to show more options)
    return sortedCandidates.slice(0, 50);
  } catch (error) {
    console.error('Error loading captain candidates:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Returns top N captain candidates for a given GW and season.
 * Provides a reusable API for quick-select and other UI elements.
 */
export async function getTopCandidates(n: number, gameweek: number, season: string = '2025-2026') {
  const candidates = await getCaptainCandidates(gameweek, season);
  if (!Array.isArray(candidates) || candidates.length === 0) return [];
  const topN = Math.max(0, Math.min(n, candidates.length));
  return candidates.slice(0, topN);
}
