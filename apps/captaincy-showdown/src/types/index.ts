export interface CaptainCandidate {
  player_id: number;
  name: string;
  team: string;
  position: string;
  price: number;
  ownership: number;
  expected_ownership: number;
  form_score: number; // Last 4 GW average points
  fixture_difficulty: number; // Opponent Elo normalized 1-5
  opponent?: string; // Opponent short name (e.g., MCI)
  home?: boolean; // true if home, false if away
  minutes_risk: number; // 0-100 based on recent rotation/injuries
  xgi_per_90: number; // Expected goals + assists per 90 mins
  captain_score: number; // Calculated composite score
}

export interface MatchupData {
  candidate_a: CaptainCandidate;
  candidate_b: CaptainCandidate;
  gameweek: number;
  last_updated: string;
}
