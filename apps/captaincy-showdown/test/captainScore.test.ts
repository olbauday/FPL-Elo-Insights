import { describe, expect, test } from 'vitest';
import type { CaptainCandidate } from '../src/types';
import { calculateCaptainScore, updateCaptainScores } from '../src/engine/captainScore';

describe('Captain Score Calculation', () => {
  // Test data representing various real-world scenarios
  const testPlayers: CaptainCandidate[] = [
    {
      // Haaland in good form against weak team
      player_id: 1,
      name: "Erling Haaland",
      team: "Manchester City",
      position: "FWD",
      price: 14.5,
      ownership: 85.5,
      expected_ownership: 90.0,
      form_score: 8.5, // High form
      fixture_difficulty: 2, // Easy fixture
      minutes_risk: 10, // Very likely to start
      xgi_per_90: 1.8, // High xGI
      captain_score: 0 // Will be calculated
    },
    {
      // Salah against top 6 opponent
      player_id: 2,
      name: "Mohamed Salah",
      team: "Liverpool",
      position: "MID",
      price: 13.2,
      ownership: 65.3,
      expected_ownership: 68.0,
      form_score: 7.0, // Good form
      fixture_difficulty: 4, // Tough fixture
      minutes_risk: 5, // Almost certain to start
      xgi_per_90: 1.2, // Good xGI
      captain_score: 0
    },
    {
      // Rotation risk premium player
      player_id: 3,
      name: "Phil Foden",
      team: "Manchester City",
      position: "MID",
      price: 10.5,
      ownership: 25.0,
      expected_ownership: 22.0,
      form_score: 6.5,
      fixture_difficulty: 2,
      minutes_risk: 40, // Significant rotation risk
      xgi_per_90: 1.0,
      captain_score: 0
    },
    {
      // Out of form premium
      player_id: 4,
      name: "Harry Kane",
      team: "Bayern Munich",
      position: "FWD",
      price: 12.8,
      ownership: 45.0,
      expected_ownership: 40.0,
      form_score: 4.0, // Poor form
      fixture_difficulty: 3,
      minutes_risk: 0, // Nailed on
      xgi_per_90: 0.8,
      captain_score: 0
    }
  ];

  test('should calculate higher scores for in-form players against weak teams', () => {
    const scores = updateCaptainScores(testPlayers);
    const haaland = scores.find(p => p.name === "Erling Haaland");
    const salah = scores.find(p => p.name === "Mohamed Salah");

    expect(haaland?.captain_score).toBeGreaterThan(80); // Should be a very high score
    expect(haaland?.captain_score).toBeGreaterThan(salah?.captain_score || 0); // Haaland should outscore Salah
  });

  test('should penalize rotation risks', () => {
    const scores = updateCaptainScores(testPlayers);
    const foden = scores.find(p => p.name === "Phil Foden");
    const salah = scores.find(p => p.name === "Mohamed Salah");

    expect(foden?.captain_score).toBeLessThan(salah?.captain_score || 0); // Rotation risk should hurt score
  });

  test('should calculate reasonable scores for all scenarios', () => {
    const scores = updateCaptainScores(testPlayers);
    
    scores.forEach(player => {
      expect(player.captain_score).toBeGreaterThanOrEqual(0);
      expect(player.captain_score).toBeLessThanOrEqual(100);
    });

    // Sort by score to verify relative rankings
    const sortedScores = scores.sort((a, b) => b.captain_score - a.captain_score);
    expect(sortedScores[0].name).toBe("Erling Haaland"); // Should be top captain
    expect(sortedScores[3].name).toBe("Harry Kane"); // Should be worst captain
  });
});
