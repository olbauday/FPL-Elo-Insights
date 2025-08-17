import { getCsvPath } from '../utils/csvPathConfig';
import { loadCSVData } from '../utils/dataLoader';
import { mapToCaptainCandidates } from '../utils/candidateMapper';
import { updateCaptainScores } from '../engine/captainScore';

export async function getCaptainCandidates(gameweek: number, season: string = '2025-2026') {
  try {
    // Load all required data files
    const playersPath = getCsvPath({ season, dataType: 'players' });
    const teamsPath = getCsvPath({ season, dataType: 'teams' });
    const playerstatsPath = getCsvPath({ season, dataType: 'playerstats' });
    const fixturesPath = getCsvPath({ season, dataType: 'matches', gameweek }); // Load fixtures for the specific gameweek
    
    // Load data in parallel
    const [players, teams, playerstats, fixtures] = await Promise.all([
      loadCSVData<any>(playersPath),
      loadCSVData<any>(teamsPath),
      loadCSVData<any>(playerstatsPath),
      loadCSVData<any>(fixturesPath).catch(err => {
        console.warn('Failed to load fixtures, using default difficulty:', err);
        return [];
      })
    ]);
    
    // Filter playerstats to only include the specified gameweek (to avoid duplicates)
    const gwPlayerStats = playerstats.filter((stats: any) => Number(stats.gw) === gameweek);
    
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
    
    // Join the data
    const enrichedPlayerStats = gwPlayerStats.map((stats: any) => {
      const player = players.find((p: any) => p.player_id === stats.id || Number(p.id) === Number(stats.id));
      const team = teams.find((t: any) => Number(t.code) === Number(player?.team_code) || Number(t.id) === Number(player?.team_id));
      
      return {
        ...stats,
  web_name: player?.web_name ?? player?.name ?? 'Unknown',
  team: team?.short_name ?? team?.name ?? 'Unknown',
  position: player?.position ?? player?.element_type ?? 'Unknown',
        fixture_difficulty: getFixtureDifficulty(player?.team_code) // Calculate real fixture difficulty
      };
    });
    
    const candidates = mapToCaptainCandidates(enrichedPlayerStats);
    const candidatesWithScores = updateCaptainScores(candidates);
    
    // Filter out players with missing/invalid data
    const validCandidates = candidatesWithScores.filter(candidate => 
      candidate.name !== 'Unknown' && 
      candidate.team !== 'Unknown' &&
      candidate.price > 0 &&
      !isNaN(candidate.captain_score)
    );
    
    // Sort by captain score (highest first)
    const sortedCandidates = validCandidates.sort((a, b) => b.captain_score - a.captain_score);
    
    // Console log top 20 for analysis
    console.log('\n🏆 TOP 20 CAPTAIN CANDIDATES (2024-25 GW38) 🏆');
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
    
    // Return top 10 for display
    return sortedCandidates.slice(0, 10);
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
