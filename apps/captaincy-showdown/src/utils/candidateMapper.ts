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
      if (!row) return null;

      // Accept multiple common ID shapes
      const rawId = row.id ?? row.player_id ?? row.element_id ?? row.element ?? row.playerId;
      if (rawId === undefined || rawId === null || rawId === '') return null;

      const id = Number(rawId);
      const name = String(
        row.web_name ??
        (row.first_name && row.second_name ? `${row.first_name} ${row.second_name}` : undefined) ??
        row.name ??
        ''
      ).trim() || 'Unknown';
      const team = String(row.team ?? row.team_name ?? '').trim() || 'Unknown';

      // If both name and team are unknown, exclude (likely broken join)
      if (name === 'Unknown' && team === 'Unknown') return null;

  const price = Number(row.now_cost ?? row.price ?? row.cost);
  const ownership = Number(row.selected_by_percent ?? row.ownership);
      const expectedOwnership = Number(row.expected_ownership ?? ownership);
      const form = row.form !== undefined ? Number(row.form) : 0;
      const fixtureDifficulty = row.fixture_difficulty !== undefined ? Number(row.fixture_difficulty) : 3;
      // Prefer explicit chance fields; if absent/blank, derive from minutes/starts heuristics
      const rawChanceNext = row.chance_of_playing_next_round ?? row.chance_of_playing_this_round;
      let minutesRisk = 50; // default mid risk if we know nothing
      if (rawChanceNext !== undefined && String(rawChanceNext).trim() !== '') {
        const chanceNext = Number(rawChanceNext);
        if (Number.isFinite(chanceNext)) minutesRisk = Math.min(Math.max(100 - chanceNext, 0), 100);
      } else {
        const recentAvg = Number(row.recent_minutes_avg ?? row.minutes ?? 0);
        const recentStarts = Number(row.recent_starts ?? row.starts ?? 0);
  const recentMatches = Number(row.recent_matches ?? 0);
  const cautious = recentMatches < 2; // early-season / scarce sample
  if (recentStarts >= 2 && recentAvg >= 70) minutesRisk = cautious ? 15 : 10;
  else if (recentAvg >= 80) minutesRisk = cautious ? 10 : 5;
  else if (recentAvg >= 60) minutesRisk = 15;
        else if (recentAvg >= 30) minutesRisk = 30;
        else if (recentAvg > 0) minutesRisk = 45;
        else minutesRisk = 60; // no minutes so far this season
      }
      const baseXgi90 = (row.expected_goal_involvements_per_90 !== undefined)
        ? Number(row.expected_goal_involvements_per_90)
        : Number(row.xgi_per_90 ?? row.xgi90 ?? 0);
      const hasRolling = row.rolling_xgi_per_90 !== undefined && !Number.isNaN(Number(row.rolling_xgi_per_90));
      if (hasRolling) {
        const rolling = Number(row.rolling_xgi_per_90);
        const minutesTotal = Number(row.recent_minutes_total ?? 0);
        // Blend to reduce noise when minutes are scarce: weight rolling by min(minutes/180, 1)
        const w = Math.max(0, Math.min(minutesTotal / 180, 1));
        var xgi90 = (1 - w) * (Number.isFinite(baseXgi90) ? baseXgi90 : 0) + w * rolling;
      } else {
        var xgi90 = Number.isFinite(baseXgi90) ? baseXgi90 : 0;
      }

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
  opponent: typeof row.opponent === 'string' ? row.opponent : undefined,
  home: typeof row.home === 'boolean' ? row.home : undefined,
        minutes_risk: minutesRisk,
        xgi_per_90: Number.isFinite(xgi90) ? xgi90 : 0,
        captain_score: 0,
      } as CaptainCandidate;
    })
    .filter((candidate): candidate is CaptainCandidate => candidate !== null);
}
