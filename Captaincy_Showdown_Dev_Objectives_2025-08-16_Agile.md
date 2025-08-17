# Captaincy Showdown — Development Objectives & Agile Plan
**Version:** 2025-08-16  
**Owner:** Engineering (Agile)  
**Context:** React+TypeScript+Tailwind app for Fantasy Premier League captaincy comparison and stream overlays.  
**Sources:** Extended dev plan【31†captaincy_dev_plan.md】 and dataset spec【30†README.md】.  
**Status Input:** Provided by GitHub Copilot summary.

---

## 0) Current State
- **Phase 0 (Foundation):** ✅ Completed (Vite+React+TS+Tailwind setup, CSV loader, types).  
- **Phase 1 (Data Engine):** ⚠️ Partial (captain score algo + pipeline in place, but perf & error handling gaps).  
- **Phase 2 (UI Components):** ⚠️ Partial (cards, layouts built; missing full test suite).  
- **Phase 3 (Interactive Selection):** ⚠️ Partial (multi-select working; missing search, quick-select, URL persistence).  
- **Phase 4 (Visual Polish):** ⚠️ Partial (styling/animations; missing logo/theme toggle).  
- **Phase 5–7:** 🚫 Not started (Export, Data Integration, Stream).  
- **Cross-cutting:** Testing infra present but shallow; no CI; no perf tracking.

---

## 1) Development Objectives (Next Iterations)
**High-Level Goals:**
1. Close **Phases 1–3** gaps → stable comparison engine with usable UI.
2. Deliver **Phase 4 minimal polish** for stream use (branding, dark/light mode).
3. Implement **Phase 5 Export MVP** for social/thumbnail content.  
4. Establish **CI/CD and coverage gates** for maintainability.  
5. Prepare **Phase 6 Data Integration** with FPL-Elo-Insights【34†README.md】.

---

## 2) Epics, Features, and Stories

### EPIC A — Data Processing Engine (Phase 1 Completion)
**Goal:** Reliable captain score calculation under performance limits.

- **Story A1.1** — *Robust Captain Score Calculation*  
  **As a** data engineer **I want** to handle missing/invalid CSV gracefully **so that** app doesn’t break.  
  **AC:** Returns fallback values or excludes invalid players; error messages logged.  
  **Estimate:** 3 pts • `backend`, `typescript` • Priority: High  

- **Story A1.2** — *Performance Benchmark*  
  **As a** dev **I want** to measure pipeline runtime for 600+ players **so that** perf target (<100ms) is enforced.  
  **AC:** Unit test with mock dataset passes within threshold.  
  **Estimate:** 2 pts • `perf`, `tests` • Priority: High  

- **Story A1.3** — *Top-N Candidates API*  
  **As a** frontend dev **I want** top-N candidates returned from data service **so that** UI quick-select works.  
  **AC:** Function getTopCandidates(n) returns ordered list by captain_score.  
  **Estimate:** 2 pts • `backend`, `typescript` • Priority: Medium  

---

### EPIC B — UI Components & Responsiveness (Phase 2)
**Goal:** Reusable, tested UI cards and comparison view.

- **Story B2.1** — *PlayerCard Tests*  
  **AC:** Renders all fields, resizes 300–1200px, passes accessibility audit.  
  **Estimate:** 3 pts • `frontend`, `tests` • Priority: High  

- **Story B2.2** — *ComparisonView Wiring*  
  **AC:** When 2 players selected, ComparisonView renders with VersusIndicator.  
  **Estimate:** 2 pts • `frontend` • Priority: Medium  

- **Story B2.3** — *Hover/Focus States*  
  **AC:** Verified via jest-axe + snapshots.  
  **Estimate:** 2 pts • `frontend`, `a11y` • Priority: Medium  

---

### EPIC C — Interactive Selection (Phase 3)
**Goal:** Intuitive selection/search with persistence.

- **Story C3.1** — *Player Search Dropdown*  
  **AC:** Can search/select from full dataset by name/team.  
  **Estimate:** 3 pts • `frontend` • Priority: High  

- **Story C3.2** — *Quick-Select Top 5*  
  **AC:** Buttons render top-5 captain candidates (from A1.3).  
  **Estimate:** 2 pts • `frontend`, `backend` • Priority: High  

- **Story C3.3** — *URL State Persistence*  
  **AC:** Query params preserve selected players & filters across reload.  
  **Estimate:** 3 pts • `frontend` • Priority: Medium  

---

### EPIC D — Branding & Export (Phase 4–5)
**Goal:** Make app stream/social ready.

- **Story D4.1** — *Logo & Watermark Slot*  
  **AC:** Configurable image slot appears on all cards/exports.  
  **Estimate:** 2 pts • `frontend` • Priority: Medium  

- **Story D4.2** — *Theme Toggle*  
  **AC:** Dark/light mode switch via Tailwind tokens.  
  **Estimate:** 2 pts • `frontend` • Priority: Medium  

- **Story D5.1** — *Export to Canvas*  
  **AC:** Exports Instagram 1080x1080 image preserving layout.  
  **Estimate:** 5 pts • `frontend`, `export` • Priority: High  

---

### EPIC E — Data Integration (Phase 6 Prep)
**Goal:** Connect to FPL-Elo-Insights data【32†README.md】.

- **Story E6.1** — *GitHub Raw Fetcher*  
  **AC:** Loads `players.csv`, `playerstats.csv`, `fixtures.csv` from repo.  
  **Estimate:** 3 pts • `backend` • Priority: High  

- **Story E6.2** — *Data Caching & Error Handling*  
  **AC:** Cache results for session; retry on timeout with message.  
  **Estimate:** 3 pts • `backend` • Priority: High  

---

### EPIC F — Cross-Cutting Quality
**Goal:** Testing, CI/CD, linting.

- **Story F7.1** — *Component Test Coverage*  
  **AC:** >80% coverage via Vitest/RTL.  
  **Estimate:** 3 pts • `tests` • Priority: High  

- **Story F7.2** — *GitHub Actions CI*  
  **AC:** Build+Lint+Tests run on PR; coverage threshold enforced.  
  **Estimate:** 3 pts • `ci`, `devops` • Priority: High  

- **Story F7.3** — *ESLint/Prettier/Husky Hooks*  
  **AC:** Lint/prettier run pre-commit.  
  **Estimate:** 2 pts • `devops` • Priority: Medium  

---

## 3) Tracking & Metrics
- **Board:** GitHub Projects → Epics as Milestones, Stories as Issues.  
- **Labels:** `frontend`, `backend`, `tests`, `ci`, `a11y`, `perf`.  
- **Points:** Fibonacci (1,2,3,5).  
- **Definition of Done:** Tests pass, AC met, reviewed, deployed to staging.

---

## 4) Next Sprint Recommendation (2 weeks)
**Sprint Goal:** Close Phases 1–3 gaps to MVP interactive app.  
**Stories:** A1.1, A1.2, B2.1, C3.1, C3.2, F7.1.  
**Stretch:** C3.3, D4.1.

---
