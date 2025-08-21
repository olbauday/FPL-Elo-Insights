import type { CaptainCandidate } from '../types';

interface PlayerStats {
  form: number;
  fixture_difficulty: number;
  xgi_per_90: number;
  minutes_risk: number;
}

/**
 * Calculates a composite captain score from 0-100 based on key player metrics
 * 
 * Weights:
 * - Form: 40%
 * - Fixture: 30%
 * - xGI: 20%
 * - Minutes: 10%
 */
export function calculateCaptainScore(player: PlayerStats): number {
  // Normalize each metric to 0-100 scale
  const formScore = Math.min(Math.max((player.form / 10) * 100, 0), 100); // cap 0-100
  const diff = Math.min(Math.max(player.fixture_difficulty, 1), 5);
  const fixtureScore = Math.min(Math.max((6 - diff) * 20, 0), 100); // cap 0-100
  const xgiScore = Math.min(Math.max(player.xgi_per_90 * 50, 0), 100); // cap 0-100
  const minutesScore = Math.min(Math.max(100 - player.minutes_risk, 0), 100); // cap 0-100

  // Apply weights and combine
  const total = (
    formScore * 0.4 +
    fixtureScore * 0.3 +
    xgiScore * 0.2 +
    minutesScore * 0.1
  );
  return Math.min(Math.max(total, 0), 100);
}

/**
 * Updates the captain_score property for a list of captain candidates
 */
export function updateCaptainScores(candidates: CaptainCandidate[]): CaptainCandidate[] {
  return candidates.map(candidate => ({
    ...candidate,
    captain_score: calculateCaptainScore({
      form: candidate.form_score,
      fixture_difficulty: candidate.fixture_difficulty,
      xgi_per_90: candidate.xgi_per_90,
      minutes_risk: candidate.minutes_risk
    })
  }));
}
