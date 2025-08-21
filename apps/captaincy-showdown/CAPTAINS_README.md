# Captaincy Score — How it’s calculated

This document explains how the captain score is computed in the Captaincy Showdown app. It’s separate from the repository root README to keep app-specific details local to this package.

## Overview
A composite score from 0–100 ranks captain candidates for an upcoming gameweek. It blends four pillars:
- Form (recent performance proxy)
- Fixture difficulty (opponent strength)
- Expected goal involvement per 90 (xGI/90)
- Minutes risk (likelihood to play; lower is better)

All sub-scores and the final score are clamped to the 0–100 range.

## Inputs
Each candidate provides the following inputs after mapping and enrichment:
- form_score: number (0–10) — from dataset “form” with safe fallback to 0.
- fixture_difficulty: number (1–5) — 1 is easiest. Derived from the opponent’s strength; defaults to 3 if unknown.
- xgi_per_90: number — blended value using base xGI/90 and a recent rolling xGI/90, weighted by recent minutes.
- minutes_risk: number (0–100) — lower is better. From chance_of_playing_next_round when available, or heuristics based on recent starts/minutes (early-season conservative).

## Normalization (to 0–100)
- Form: form_score/10 × 100
- Fixture: (6 − fixture_difficulty) × 20  (so 1 → 100, 5 → 20)
- xGI: xgi_per_90 × 50  (keeps typical 0–2 in 0–100)
- Minutes: 100 − minutes_risk

Each of the above is clamped to [0, 100].

## Weights
- Form: 40%
- Fixture: 30%
- xGI/90: 20%
- Minutes: 10%

## Formula
score = 0.4×Form + 0.3×Fixture + 0.2×xGI + 0.1×Minutes
Then clamp final score to [0, 100].

## Example
Inputs:
- form_score = 8.0 → Form = 80
- fixture_difficulty = 2 → Fixture = (6 − 2) × 20 = 80
- xgi_per_90 = 1.2 → xGI = 60
- minutes_risk = 25 → Minutes = 75
Score = 0.4×80 + 0.3×80 + 0.2×60 + 0.1×75 = 75.5

## Where inputs come from
- xgi_per_90 blending:
  - recent_weight = min(recent_minutes_total / 180, 1)
  - xgi_blended = base_xgi_per_90 × (1 − recent_weight) + rolling_xgi_per_90 × recent_weight
- minutes_risk:
  - If chance_of_playing_next_round exists, risk = 100 − chance (with floors/caps).
  - Else use recent_starts and recent_minutes_avg; small-sample early-season remains cautious.
- fixture_difficulty:
  - From next fixture’s opponent “strength” (2–5) as a 1–5 difficulty proxy (default 3 when missing).

## Edge behavior
- Missing/unknown data uses safe defaults (e.g., fixture 3, form 0, xGI 0, conservative risk).
- All sub-scores and the final composite score are clamped to 0–100 to ensure a stable UI scale.

## Code references
- Scoring: `src/engine/captainScore.ts`
- Candidate mapping (fallbacks, xGI blend, minutes risk): `src/utils/candidateMapper.ts`
- Recent performance enrichment (rolling xGI/90, starts, minutes): `src/utils/performanceEnricher.ts`
- Data loading and joins (players, teams, fixtures): `src/services/captaincyDataService.ts`

## Notes
- Score weights and transforms are intentionally simple and transparent; they can be tuned in future iterations.
- Recent performance is minutes-aware and robust to early-season small samples.
