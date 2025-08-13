# Captaincy UI (React + TypeScript + Tailwind + Vite)

Pixel-accurate implementation of the Captaincy Showdown mockup using React, TypeScript and Tailwind CSS.

## What’s included
- Vite React + TS scaffold in `captaincy-ui/`
- Tailwind CSS v3 configured via PostCSS
- Exact UI components and styles matching the mockup
- Mock data for players (Haaland, Luis Díaz, Palmer, Watkins, M.Salah)
- Responsive grid and interactive controls (filters, sort, compare mode pill)

## Run locally
1. Install dependencies
  - From repo root:
    - `cd captaincy-ui`
    - `npm install`
2. Start dev server
  - `npm run dev`
  - Open http://localhost:5173/
3. Build
  - `npm run build`

## Key files
- `src/App.tsx`: Main UI with Header, Controls, Player Cards, and mock data.
- `src/index.css`: Tailwind directives and base global styles (gradient background, Inter font).
- `tailwind.config.cjs`: Tailwind content globs.
- `postcss.config.cjs`: PostCSS plugins (Tailwind, Autoprefixer).

## Fixes applied during setup
Tailwind utilities initially didn’t render, causing unstyled content. Applied fixes:
1. Configured Tailwind v3 with PostCSS:
  - Added `tailwind.config.cjs` and `postcss.config.cjs` (CommonJS to work with `type: module`).
  - Replaced `@import "tailwindcss";` with Tailwind v3 directives in `src/index.css`:
    - `@tailwind base; @tailwind components; @tailwind utilities;`
2. Removed ESM `postcss.config.js` to avoid Vite PostCSS loading error; kept `postcss.config.cjs` only.
3. Verified build and dev server run after configuration.

## Notes
- The UI uses Tailwind utilities and a few inline gradients to exactly match the mockup.
- Timestamp updates every ~30 seconds.
- Clicking a card slightly scales it and highlights the border to indicate selection.

## Next steps
- Split UI into smaller components (`Header`, `Controls`, `PlayerCard`).
- Add a Tailwind theme extension for brand colors (gradients, chips) if desired.
- Wire in real data per development plan.
