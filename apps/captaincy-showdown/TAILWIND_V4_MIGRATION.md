# Tailwind v4 Migration and Runtime Guide

This app is configured for Tailwind CSS v4 using the Vite plugin and CSS `@theme` tokens. No `tailwind.config.js` is used.

## What changed
- Replaced legacy `tailwind.config.js` with CSS tokens in `src/index.css` via `@theme`.
- Enabled Tailwind via the Vite plugin `@tailwindcss/vite` (see `vite.config.ts`).
- PostCSS only runs `autoprefixer` (Tailwind is handled by Vite).
- Restored a clean `index.html` and ensured the React entry is in `src/main.tsx`.

## Required files and snippets

1) package.json (devDependencies)
- tailwindcss ^4.x
- @tailwindcss/vite ^4.x
- autoprefixer ^10.x

2) vite.config.ts
```
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

3) postcss.config.cjs
```
module.exports = {
  plugins: {
    autoprefixer: {},
  },
}
```

4) src/index.css
```
@import "tailwindcss";

@theme {
  --color-brand-coral: #FF6A4D;
  --color-brand-green: #02EBAE;
  --color-brand-dark: #211F29;
  --color-brand-gold: #F2C572;
  --color-brand-golden: #F2C572; /* alias used in classes */
  --color-brand-blue: #1F4B59;

  --font-inter: "Inter", sans-serif;
  --backdrop-blur-xl: 20px;
}

/* globals */
html, body, #app, #root { height: 100%; }
body { font-family: var(--font-inter), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
```

5) Ensure there is NO `tailwind.config.js` in this app.

## Install from scratch
```
cd apps/captaincy-showdown
npm install
```

## Run in dev
```
npm run dev
```

## Build and preview
```
npm run build
npm run preview
```

## Common issues
- Unknown `@theme` rule in editor: this is an editor lint warning; the Tailwind v4 compiler understands it when building through Vite.
- Classes like `bg-brand-coral` or `to-brand-golden` not working: ensure tokens exist in `@theme` and you restarted the dev server after changes.
- Duplicate entrypoint errors: only `src/main.tsx` should render React. If `src/main.ts` exists, keep it empty (export {}) or remove it.

## Rollback (optional)
If you need to temporarily restore v3 behavior, reintroduce a `tailwind.config.js` and replace `@import "tailwindcss";` with v3 `@tailwind base; @tailwind components; @tailwind utilities;`. Not recommended.
