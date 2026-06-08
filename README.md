# Capitalism 4 Kids

A Vite, React, TypeScript, and Phaser pixel-art farming game foundation published with GitHub Pages.

React owns the HUD and interface panels. Phaser owns the entire farm world: tiles, sprites, movement, fields, animations, and interactions.

## Live Site

After the GitHub Pages workflow finishes, the game is available at:

https://brunoebaraujo.github.io/Cap4Kids/

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Pushes to `main` run `.github/workflows/pages.yml`, build the Vite app, and publish `dist` to GitHub Pages.

## Current Foundation

- Phaser renders the farm inside React.
- The Phaser instance is stored in a React ref and is not recreated by HUD rerenders.
- The farm world is composed from 32x32 tilemap layers using generated placeholder pixel tiles.
- Maya is a placeholder pixel sprite with animation states.
- Maya moves tile-by-tile with keyboard controls.
- Field 1 starts unlocked and cycles Harvested -> Prepared -> Planted -> Harvested.
- Field 2 starts locked and remains unavailable.
- One worker task runs at a time; extra tasks enter a queue.
- Inventory and economy state are reflected in the React HUD.

## Controls

- Arrow keys or WASD: move Maya one tile at a time.
- Space: perform the context field action.
- 1: Prepare Soil.
- 2: Plant Wheat.
- 3: Harvest Wheat.
- 4: Milk Cow.

## Docs

- `docs/vision.md`
- `docs/art-direction.md`
- `docs/technical-architecture.md`
- `docs/roadmap.md`
