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
  return rawPlayerStats
    .map((row) => {
      // Guard essential fields; exclude if id is missing or name/team unknown
      if (!row || row.id === undefined || row.id === null) {
        return null;
      }

      const id = Number(row.id);
      const name = String(row.web_name ?? '').trim() || 'Unknown';
      const team = String(row.team ?? '').trim() || 'Unknown';

      // If both name and team are unknown, exclude (likely broken join)
      if (name === 'Unknown' && team === 'Unknown') return null;

      const price = Number(row.now_cost);
      const ownership = Number(row.selected_by_percent);
      const expectedOwnership = Number(row.expected_ownership ?? ownership);
      const form = row.form !== undefined ? Number(row.form) : 0;
      const fixtureDifficulty = row.fixture_difficulty !== undefined ? Number(row.fixture_difficulty) : 3;
      const chanceNext = row.chance_of_playing_next_round !== undefined ? Number(row.chance_of_playing_next_round) : 100;
      const minutesRisk = Math.min(Math.max(100 - chanceNext, 0), 100);
      const xgi90 = row.expected_goal_involvements_per_90 !== undefined
        ? Number(row.expected_goal_involvements_per_90)
        : 0;

      // Exclude clearly invalid numerical rows (NaN or negative price)
      if (Number.isNaN(id) || price <= 0 || Number.isNaN(xgi90)) return null;

      return {
        player_id: id,
        name,
        team,
        position: normalizePosition(row.position, row.element_type),
        price,
        ownership: Number.isFinite(ownership) ? ownership : 0,
        expected_ownership: Number.isFinite(expectedOwnership) ? expectedOwnership : 0,
        form_score: Number.isFinite(form) ? form : 0,
        fixture_difficulty: Number.isFinite(fixtureDifficulty) ? fixtureDifficulty : 3,
        minutes_risk: minutesRisk,
        xgi_per_90: Number.isFinite(xgi90) ? xgi90 : 0,
        captain_score: 0,
      } as CaptainCandidate;
    })
    .filter((candidate): candidate is CaptainCandidate => candidate !== null);
}
