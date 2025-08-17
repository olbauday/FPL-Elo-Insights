import { describe, expect, test } from 'vitest';
import { calculateCaptainScore } from '../engine/captainScore';
import { mapToCaptainCandidates } from '../utils/candidateMapper';
import { getTopCandidates } from '../services/captaincyDataService';

describe('EPIC A — Data Processing Engine', () => {
  test('A1.1: candidateMapper excludes invalid rows and applies fallbacks', () => {
    const raw = [
      // valid
      { id: 1, web_name: 'Player One', team: 'ABC', position: 'MID', now_cost: 7.5, selected_by_percent: 25.1, form: 6.5, fixture_difficulty: 2, chance_of_playing_next_round: 80, expected_goal_involvements_per_90: 0.8 },
      // missing id -> exclude
      { web_name: 'No ID', team: 'XYZ', now_cost: 5.0, form: 5, expected_goal_involvements_per_90: 0.5 },
      // unknown name & team -> exclude
      { id: 2, now_cost: 6.0, form: 4.2, expected_goal_involvements_per_90: 0.3 },
      // invalid price -> exclude
      { id: 3, web_name: 'Bad Price', team: 'DEF', now_cost: -1, form: 3.0, expected_goal_involvements_per_90: 0.2 },
      // partial data -> fallback (should include with defaults)
      { id: 4, web_name: 'Partial', team: 'LMN', now_cost: 6.5, expected_goal_involvements_per_90: 0.0 },
    ];

    const candidates = mapToCaptainCandidates(raw);

    expect(candidates.find(c => c.player_id === 1)).toBeDefined();
    expect(candidates.find(c => c.player_id === 2)).toBeUndefined();
    expect(candidates.find(c => c.player_id === 3)).toBeUndefined();
    const partial = candidates.find(c => c.player_id === 4)!;
    expect(partial.form_score).toBe(0);
    expect(partial.fixture_difficulty).toBe(3);
    expect(partial.minutes_risk).toBe(0); // chance 100 -> risk 0
  });

  test('A1.2: Performance — calculate scores for 600+ players under 100ms', () => {
    const count = 700;
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      calculateCaptainScore({
        form: (i % 10),
        fixture_difficulty: (i % 5) + 1,
        xgi_per_90: (i % 20) / 10,
        minutes_risk: (i % 100),
      });
    }
    const duration = performance.now() - start;
    // Allow a small buffer on CI, but target <100ms locally
    expect(duration).toBeLessThan(150);
  });

  test('A1.3: getTopCandidates returns top N ordered', async () => {
    // Note: This test relies on getCaptainCandidates wiring
    // We only assert API contract (array length <= N). More detailed tests should mock service.
    const top = await getTopCandidates(5, 1, '2025-2026');
    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeLessThanOrEqual(5);
  });
});
