import { describe, expect, test } from 'vitest';
import { loadCSVData } from '../utils/dataLoader';
import { getCsvPath } from '../utils/csvPathConfig';
import { enrichWithRecentPerformance } from '../utils/performanceEnricher';
import { mapToCaptainCandidates } from '../utils/candidateMapper';

describe('Epic A1: Recent performance enrichment + mapper blending', () => {
  test('enricher computes rolling_xgi_per_90 and minutes aggregates for GW1 2025-2026', async () => {
    const season = '2025-2026';
    const gw = 1;
    const pstatsPath = getCsvPath({ season, dataType: 'playerstats' });
    const raw = await loadCSVData<any>(pstatsPath);
    // pick a player with non-zero minutes if present
    const sample = raw.find(r => Number(r.minutes || 0) > 0) || raw[0];
    const enriched = await enrichWithRecentPerformance(sample, season, gw);
    expect(enriched).toHaveProperty('recent_minutes_total');
    expect(enriched).toHaveProperty('recent_matches');
    expect(enriched).toHaveProperty('rolling_xgi_per_90');
    expect(Number.isFinite(Number(enriched.rolling_xgi_per_90))).toBe(true);
  });

  test('mapper blends rolling_xgi_per_90 with base when minutes are scarce', () => {
    const scarce = mapToCaptainCandidates([
      {
        id: 10,
        web_name: 'Sample', team: 'ABC', position: 'MID', now_cost: 7.0,
        expected_goal_involvements_per_90: 0.5,
        rolling_xgi_per_90: 1.2,
        recent_minutes_total: 45,
      }
    ])[0];
    expect(scarce.xgi_per_90).toBeGreaterThan(0.5);
    expect(scarce.xgi_per_90).toBeLessThan(1.2);

    const solid = mapToCaptainCandidates([
      {
        id: 11,
        web_name: 'Solid', team: 'DEF', position: 'FWD', now_cost: 8.0,
        expected_goal_involvements_per_90: 0.5,
        rolling_xgi_per_90: 1.2,
        recent_minutes_total: 270,
      }
    ])[0];
    expect(Math.abs(solid.xgi_per_90 - 1.2)).toBeLessThan(1e-6);
  });

  test('minutes_risk stays conservative with tiny sample', () => {
    const c = mapToCaptainCandidates([
      { id: 12, web_name: 'Cautious', team: 'LMN', position: 'MID', now_cost: 6.5,
        recent_matches: 1, recent_starts: 1, recent_minutes_avg: 85 }
    ])[0];
    // conservative <= 10 becomes 10 with cautious
    expect(c.minutes_risk).toBe(10);
  });
});
