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

## Tailwind v4 tokens
Tokens are defined in `src/index.css` under `@theme`:
- --color-brand-coral, --color-brand-green, --color-brand-dark, --color-brand-gold, --color-brand-golden, --color-brand-blue
- --font-inter, --backdrop-blur-xl

These power classes like `bg-brand-coral`, `to-brand-golden`, `text-brand-dark`, etc.
