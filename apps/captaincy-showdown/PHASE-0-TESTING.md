# Phase 0 Testing Checklist ✅

## How to Test This Phase as Complete

### 1. ✅ **Development Server Running**
- URL: http://127.0.0.1:5174/
- Status: Server should be running and accessible
- Expected: Vite dev server loads without errors

### 2. ✅ **UI Renders Correctly**
Visit http://127.0.0.1:5174/ and verify:

**Header:**
- [ ] Shows "Captaincy Candidates (GW1)" title
- [ ] Clear, readable typography

**Player Cards Display:**
- [ ] Shows exactly 10 player cards in a flexbox layout
- [ ] Each card has white background with subtle shadow
- [ ] Cards are properly spaced and responsive

**Each Player Card Shows:**
- [ ] **Player Name** (bold, larger text)
- [ ] **Team** (e.g., "Manchester City")
- [ ] **Position** (e.g., "FWD", "MID", "DEF", "GK") 
- [ ] **Price** (formatted as "£X.Xm")
- [ ] **Ownership** (percentage)
- [ ] **Form** (numerical score)
- [ ] **Fixture Difficulty** (1-5 scale)
- [ ] **xGI/90** (expected goal involvements per 90 mins)
- [ ] **Minutes Risk** (0-100 scale)
- [ ] **Captain Score** (prominently displayed in blue)

### 3. ✅ **Data Loading Works**
- [ ] Page shows "Loading..." briefly then displays data
- [ ] No "Unknown" values in player names or teams
- [ ] Captain scores are calculated numbers (not 0)
- [ ] All 10 cards show realistic FPL data

### 4. ✅ **Build System Works**
Run in terminal:
```bash
npm run build
```
- [ ] Build completes successfully
- [ ] No compilation errors for main application code
- [ ] Output shows bundle size (~165KB)

### 5. ✅ **Data Files Accessible**
Test these URLs directly:
- [ ] http://127.0.0.1:5174/data/2025-2026/playerstats.csv
- [ ] http://127.0.0.1:5174/data/2025-2026/players.csv  
- [ ] http://127.0.0.1:5174/data/2025-2026/teams.csv

### 6. ✅ **Browser Console Clean**
- [ ] Open browser DevTools → Console
- [ ] No critical errors (red messages)
- [ ] Data loads without 404 errors
- [ ] React renders without warnings

## Expected Visual Result

You should see:
```
Captaincy Candidates (GW1)

[Player Card 1]    [Player Card 2]    [Player Card 3]
Name: Erling       Name: Mohamed      Name: ...
Team: Man City     Team: Liverpool    Team: ...
Position: FWD      Position: MID      Position: ...
Price: £14.5m      Price: £13.2m      Price: ...
Ownership: 85.5%   Ownership: 65.3%   Ownership: ...
Form: 8.5          Form: 7.2          Form: ...
Fixture Diff: 2    Fixture Diff: 3    Fixture Diff: ...
xGI/90: 1.8        xGI/90: 1.4        xGI/90: ...
Minutes Risk: 10   Minutes Risk: 5    Minutes Risk: ...
Captain Score: 85.2 Captain Score: 73.4 Captain Score: ...

[... 7 more player cards arranged in rows]
```

## Common Issues & Solutions

**Blank Page?**
- Check browser console for errors
- Verify HTML has `<div id="app"></div>`
- Restart dev server if needed

**No Data Loading?**
- Check if data files exist in `public/data/2025-2026/`
- Look for 404 errors in browser Network tab
- Verify CSV files are not empty

**Build Failures?**
- Test files excluded from TypeScript compilation
- Main app code should compile cleanly

## ✅ **Success Criteria Met:**
When all checkboxes above are ticked, **Phase 0 is COMPLETE** and ready for Phase 1!

## Next: Phase 1 Goals
- Enhanced captain score algorithm
- Performance optimization (<100ms for 600+ players)
- Better error handling
- Fixture difficulty calculation improvements
