import type { CaptainCandidate } from '../types';

export function mapToCaptainCandidates(rawPlayerStats: any[]): CaptainCandidate[] {
  return rawPlayerStats.map((row) => {
    // Only skip if essential IDs are missing - 0 values are valid for stats
    if (!row.id || row.form === undefined || row.expected_goal_involvements_per_90 === undefined) {
      return null;
    }
    return {
      player_id: Number(row.id),
      name: row.web_name,
      team: row.team, // Join with teams.csv if needed for full name
      position: row.position,
      price: Number(row.now_cost), // FPL prices are already in correct format (4.0-14.5)
      ownership: Number(row.selected_by_percent),
      expected_ownership: Number(row.selected_by_percent), // Or use a projection
      form_score: Number(row.form),
      fixture_difficulty: Number(row.fixture_difficulty), // Join with fixtures/matches if needed
      minutes_risk: 100 - Number(row.chance_of_playing_next_round),
      xgi_per_90: Number(row.expected_goal_involvements_per_90),
      captain_score: 0
    };
  }).filter(candidate => candidate !== null);
}
