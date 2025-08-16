import type { CaptainCandidate } from '../types';

function normalizePosition(pos: any, elementType?: any): 'GKP'|'DEF'|'MID'|'FWD'|'Unknown' {
  const s = String(pos ?? '').trim().toUpperCase();
  if (['GKP','GK','GOALKEEPER'].includes(s)) return 'GKP';
  if (['DEF','DEFENDER'].includes(s)) return 'DEF';
  if (['MID','MIDFIELDER'].includes(s)) return 'MID';
  if (['FWD','FORWARD','ST','STRIKER'].includes(s)) return 'FWD';

  // FPL suele traer element_type numérico: 1=GKP, 2=DEF, 3=MID, 4=FWD
  const n = Number(elementType ?? pos);
  if (n === 1) return 'GKP';
  if (n === 2) return 'DEF';
  if (n === 3) return 'MID';
  if (n === 4) return 'FWD';
  return 'Unknown';
}

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
      position: normalizePosition(row.position),
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
