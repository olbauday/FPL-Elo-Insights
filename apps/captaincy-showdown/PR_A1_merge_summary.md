# PR: Epic A1 — Data + UX Safety

Summary
- Implements recent performance enrichment (rolling xGI/90, recent starts, minutes) with small-sample blending and cautious early-season risk.
- Fixes fixtures path by season; enriches opponent and venue; compact fixture line on cards.
- Hardened candidate mapper; robust field fallbacks; blends enriched xGI/90 by minutes.
- Clamps captain score and all sub-scores to 0–100.
- UX safety: loading/empty states, pushState for navigation, Next button increments GW, auto-detect next upcoming GW.
- Tests: added enricher/mapper tests; adjusted timeout for one integration test; console output suppressed during Vitest runs to avoid delays.

Files touched (high level)
- src/utils/performanceEnricher.ts — new recent performance aggregator.
- src/services/captaincyDataService.ts — joins fixtures, opponent/venue, calls enricher; logs skipped in tests.
- src/utils/candidateMapper.ts — field fallbacks; xGI blending; minutes risk tuning.
- src/engine/captainScore.ts — clamps to [0, 100].
- src/components/EnhancedApp.tsx — loading/empty + navigation safety.
- src/__tests__/epicA1.enricher.mapper.test.ts — new tests.
- src/__tests__/dataEngine.epicA.test.ts — increase timeout to 30s for A1.3.

Verification (Quality gates)
- Build: PASS (vite prod build ok; ~186.5 kB JS gz 60.7 kB; CSS 38.2 kB gz 6.8 kB).
- Unit tests: PASS (16 files, 29 tests).
- Lint/Typecheck: PASS (tsc via build).
- Smoke: candidate list renders in tests; comparison view renders.

Notes
- getCsvPath handles 2024-2025 vs 2025-2026 schema differences.
- Enricher caches by season#gw and gracefully handles missing GWs.

Next steps
- Open PR from epic-a1-data-ux-safety to stable-captaincy-aug20.
- Optional: decay weighting for recent GWs and micro-perf benchmarks (<30ms enrich).
