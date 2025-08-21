# Epic A1: Data Enrichment + UX Safety

Goal
- Improve captain recommendations by enriching recent performance from playermatchstats.
- Add essential UX safety: clear loading/empty states and better URL history behavior.

Why now
- Stable shows good cards and opponent/venue, but minutes/form are heuristic.
- Users need clearer feedback during loads and natural back/forward behavior.

Scope
1) Recent performance enrichment
   - Read By Gameweek playermatchstats for the selected GW and the last N (e.g., 3) finished GWs.
   - Compute:
     - rolling_xgi_per_90 (sum xg+xa over minutes, scaled to per-90)
     - recent_starts (count of starts over last N)
     - recent_minutes_avg
   - Feed into candidate mapping:
     - Prefer rolling_xgi_per_90 when available
     - Adjust minutes_risk down when recent_starts>=2 and recent_minutes_avg>=70
   - Keep function behind enrichWithRecentPerformance(stats, season, gw).

2) UX safety
   - Loading state: show a tasteful loader when fetching season/GW data.
   - Empty state: show a short message when 0 candidates.
   - URL history: use pushState on season/GW changes so back/forward works.

Out of scope
- Full export engine
- Widget/no-chrome mode

Acceptance criteria
- Enrichment
  - Given real data for a GW with finished matches, rolling_xgi_per_90 is computed and used when >0.
  - A player with 2+ recent starts and avg minutes >=70 shows minutes_risk <= 15% (unless explicit chance<85 overrides).
  - Unit tests cover: (a) xgi aggregation; (b) minutes starts logic; (c) fallback when no data.
- UX
  - Loader appears during data fetch and disappears once loaded.
  - Empty state renders for 0 candidates, with retry link.
  - Using Season or GW selector adds a new entry to browser history; Back/Forward restores previous selection.

Work items
- [ ] utils/performanceEnricher.ts: implement rolling xGI/90 and minutes/starts aggregation from playermatchstats.
- [ ] services/captaincyDataService.ts: call enricher before mapping.
- [ ] utils/candidateMapper.ts: consume enriched fields (rolling_xgi_per_90; adjust minutes_risk thresholding).
- [ ] components/EnhancedApp.tsx: add loading/empty states; switch replaceState -> pushState for user-initiated changes.
- [ ] tests: add unit tests for enricher and mapper integration.

Risks
- Inconsistent schemas across seasons; use safe fallbacks.
- Performance: reading multiple GW CSVs; limit to last 3 and short-circuit on missing files.

Metrics
- Build passes; tests green.
- Enrichment adds <30ms on typical dev machine for N≈600 players.
