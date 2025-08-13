# Captaincy Showdown Overlay - Extended Development Plan

## Data Model & Requirements Specification

### Core Data Structure
```typescript
interface CaptainCandidate {
  player_id: number;
  name: string;
  team: string;
  position: string;
  price: number;
  ownership: number;
  expected_ownership: number;
  form_score: number; // Last 4 GW average points
  fixture_difficulty: number; // Opponent Elo normalized 1-5
  minutes_risk: number; // 0-100 based on recent rotation/injuries
  xgi_per_90: number; // Expected goals + assists per 90 mins
  captain_score: number; // Calculated composite score
}

interface MatchupData {
  candidate_a: CaptainCandidate;
  candidate_b: CaptainCandidate;
  gameweek: number;
  last_updated: string;
}
```

### Visual Requirements
- **Dimensions:** 300px min → 1200px max width
- **Aspect Ratios:** 16:9 (stream), 1:1 (Instagram), 9:16 (Stories/TikTok)
- **Color Scheme:** Customizable primary/secondary colors
- **Typography:** Readable at mobile sizes, bold headers
- **Animations:** Subtle transitions, no performance impact

## Incremental Development Phases

### Phase 0: Foundation & Setup (Day 1)
**Goal:** Basic project structure with data loading capability

**Deliverables:**
- React + TypeScript + Tailwind setup
- CSV data loader utility
- Basic type definitions
- Simple test data mock

**Test Criteria:**
- [ ] Project builds without errors
- [ ] Can load and parse sample CSV data
- [ ] TypeScript types compile correctly
- [ ] Basic component renders "Hello World"

**Files to Create:**
```
src/
├── types/index.ts          # Data interfaces
├── utils/dataLoader.ts     # CSV parsing utility
├── components/App.tsx      # Root component
└── __tests__/dataLoader.test.ts
```

---

### Phase 1: Data Processing Engine (Day 2-3)
**Goal:** Calculate captain scores and handle real FPL data

**Deliverables:**
- Captain score calculation algorithm
- Data transformation pipeline
- Error handling for missing data
- Unit tests for calculations

**Test Criteria:**
- [ ] Correctly calculates captain score from input metrics
- [ ] Handles missing player data gracefully
- [ ] Returns top N candidates sorted by score
- [ ] Performance: Processes 600+ players in <100ms

**Algorithm Definition:**
```typescript
// Captain Score = (Form * 0.4) + (Fixture * 0.3) + (xGI * 0.2) + (Minutes Certainty * 0.1)
// Normalized to 0-100 scale
function calculateCaptainScore(player: PlayerStats): number {
  const formScore = (player.form / 10) * 100; // Normalize form
  const fixtureScore = (6 - player.fixture_difficulty) * 20; // Inverse difficulty
  const xgiScore = Math.min(player.xgi_per_90 * 50, 100); // Cap at 100
  const minutesScore = 100 - player.minutes_risk;
  
  return (formScore * 0.4) + (fixtureScore * 0.3) + (xgiScore * 0.2) + (minutesScore * 0.1);
}
```

---

### Phase 2: Basic UI Components (Day 4-5)
**Goal:** Create reusable UI building blocks

**Deliverables:**
- PlayerCard component
- ComparisonView component
- Basic responsive layout
- Component tests

**Test Criteria:**
- [ ] PlayerCard displays all required data fields
- [ ] Components resize properly 300px-1200px
- [ ] Hover states work correctly
- [ ] Accessibility: proper ARIA labels, keyboard navigation

**Component Structure:**
```jsx
<ComparisonView>
  <PlayerCard player={candidateA} side="left" />
  <VersusIndicator />
  <PlayerCard player={candidateB} side="right" />
</ComparisonView>
```

---

### Phase 3: Interactive Selection (Day 6-7)
**Goal:** Allow users to select and compare different captain candidates

**Deliverables:**
- Player selection dropdown/search
- State management for comparisons
- Quick-select buttons for top candidates
- URL state persistence

**Test Criteria:**
- [ ] Can search and select players from full list
- [ ] State updates correctly when selections change
- [ ] Back button preserves comparison state
- [ ] Quick-select shows current top 5 candidates

---

### Phase 4: Visual Polish & Branding (Day 8-9)
**Goal:** Make it stream-ready with professional appearance

**Deliverables:**
- Brand color customization
- Logo/watermark integration
- Smooth animations and transitions
- Dark/light mode support

**Test Criteria:**
- [ ] Custom colors apply consistently
- [ ] Logo placement doesn't break layout
- [ ] Animations perform well on mobile devices
- [ ] Theme switching works without flash

---

### Phase 5: Export Engine MVP (Day 10-12)
**Goal:** Generate static images for social media

**Deliverables:**
- HTML-to-canvas export functionality
- Preset dimensions for major platforms
- Download trigger
- Basic export queue

**Test Criteria:**
- [ ] Generates 1080x1080 Instagram post correctly
- [ ] Exports maintain visual quality
- [ ] Download works in all major browsers
- [ ] Export completes in <5 seconds

**Export Presets:**
- Instagram Post: 1080x1080
- Instagram Story: 1080x1920
- Twitter Card: 1200x675
- YouTube Thumbnail: 1280x720

---

### Phase 6: Data Integration (Day 13-14)
**Goal:** Connect to live FPL-Elo-Insights data

**Deliverables:**
- GitHub raw file fetcher
- Data caching strategy
- Loading states and error handling
- Automatic refresh mechanism

**Test Criteria:**
- [ ] Loads current gameweek data successfully
- [ ] Handles network failures gracefully
- [ ] Shows loading indicators during fetch
- [ ] Caches data to reduce API calls

---

### Phase 7: Stream Integration (Day 15-16)
**Goal:** Optimize for Evmux and live streaming

**Deliverables:**
- Fullscreen widget mode
- Click-to-expand functionality
- Keyboard shortcuts for presenter
- No-chrome display option

**Test Criteria:**
- [ ] Widget scales properly in Evmux
- [ ] Keyboard controls work reliably
- [ ] No scroll bars in widget mode
- [ ] Transitions are smooth at 60fps

---

## Testing Strategy

### Unit Tests (Each Phase)
- Jest + React Testing Library
- Minimum 80% code coverage
- Mock external data sources
- Test edge cases (empty data, network errors)

### Integration Tests (Phases 3, 6, 7)
- End-to-end user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarks

### Manual Testing Checklist
- [ ] Visual regression testing with screenshot comparisons
- [ ] Accessibility audit with screen reader
- [ ] Performance profiling with React DevTools
- [ ] Real data validation against FPL website

## Performance Requirements

- **Load Time:** Initial render <1 second
- **Data Processing:** 600 players processed <100ms
- **Export Time:** Image generation <5 seconds
- **Memory Usage:** <50MB peak
- **Bundle Size:** <500KB gzipped

## Error Handling Strategy

### Data Errors
- Missing player data → Use previous gameweek or exclude
- Invalid CSV format → Show user-friendly error message
- Network timeouts → Retry with exponential backoff

### UI Errors
- Component crashes → Error boundary with reload option
- Export failures → Clear error message with retry button
- Mobile orientation → Graceful layout adjustment

## Development Workflow

### Daily Cycle with AI Tools
1. **Start:** Define specific goal for the session
2. **Plan:** Break goal into 2-3 small tasks
3. **Code:** Implement one task at a time with AI assistance
4. **Test:** Run automated tests + manual verification
5. **Commit:** Small, descriptive commits for each working feature
6. **Review:** Check against phase completion criteria

### AI Prompting Strategy
```
Context: Building Captaincy Showdown widget for FPL streaming
Current Phase: [X] - [Goal]
Task: [Specific technical task]
Constraints: [Performance/size/compatibility requirements]
Test Success: [How to verify it works]
```

## Technical Debt Management

### Code Quality Gates
- ESLint/Prettier configuration
- TypeScript strict mode
- Husky pre-commit hooks
- Automated testing in CI

### Refactoring Schedule
- After Phase 3: Component structure review
- After Phase 5: Performance optimization
- After Phase 7: Code cleanup and documentation

## Deployment Strategy

### Development Phases
- **Local:** Vite dev server for rapid iteration
- **Staging:** Vercel preview deployments for testing
- **Production:** Main branch auto-deploys to primary domain

### Environment Configuration
```typescript
interface Config {
  DATA_SOURCE_URL: string;
  CACHE_DURATION: number;
  ANALYTICS_ID?: string;
  BRAND_COLORS: {
    primary: string;
    secondary: string;
    accent: string;
  };
}
```

This plan ensures you can work in small, testable increments while building toward a professional, production-ready tool for your Bendito Fantasy streams.