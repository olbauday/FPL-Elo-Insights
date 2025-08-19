# Captaincy Showdown (Tailwind v4 + Vite + React)

This app uses Tailwind CSS v4 with the Vite plugin and CSS `@theme` tokens (no tailwind.config.js). See `TAILWIND_V4_MIGRATION.md` for the full migration details.

## Prerequisites
- Node 18+ and npm

## Install
```
cd apps/captaincy-showdown
npm install
```

## Develop
```
npm run dev
```

## Build & Preview
```
npm run build
npm run preview
```

## Data refresh (optional)
- The UI reads CSVs from `public/data/{season}`.
- To refresh from the original source (Supabase), run the repo script `scripts/export_data.py` after setting `SUPABASE_URL` and `SUPABASE_KEY` in a `.env` at the repo root.
- That script writes to `data/{SEASON}/...`. Then mirror `data/` into `apps/captaincy-showdown/public/data/`.

### Quick sync from root → app
- Use the PowerShell helper to mirror `data/` into the app:
	- `scripts/sync-data.ps1` (supports optional upstream fast‑forward and pushing to origin)
	- Example:
		- Run once: powershell -ExecutionPolicy Bypass -File scripts/sync-data.ps1
		- Pull upstream and push origin: powershell -ExecutionPolicy Bypass -File scripts/sync-data.ps1 -PushOrigin

### Schedule daily updates
- Upstream refresh times: 05:00 and 17:00 UTC. Schedule the sync to run a few minutes after, e.g., 05:15 & 17:15 UTC.
- Windows Task Scheduler steps:
	- Action: Start a program
	- Program/script: powershell.exe
	- Add arguments:
		-ExecutionPolicy Bypass -File "C:\\Users\\<you>\\FPL-Elo-Insights\\scripts\\sync-data.ps1" -PushOrigin
	- Start in: C:\\Users\\<you>\\FPL-Elo-Insights
	- Configure for: Windows 10+; set triggers for the two daily times (UTC converted to your local time).

## Tailwind v4 tokens
Tokens are defined in `src/index.css` under `@theme`:
- --color-brand-coral, --color-brand-green, --color-brand-dark, --color-brand-gold, --color-brand-golden, --color-brand-blue
- --font-inter, --backdrop-blur-xl

These power classes like `bg-brand-coral`, `to-brand-golden`, `text-brand-dark`, etc.
