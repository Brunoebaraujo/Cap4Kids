# Capitalism 4 Kids Vision

Capitalism 4 Kids is a tile-based farming and household economy game for kids. The player learns practical resource tradeoffs by helping Maya run a small farm, complete chores, manage debt, and keep the household supplied.

The first milestone is not a full game. It is the engine foundation: a real pixel-art farm world rendered by Phaser, with React limited to menus and interface surfaces.

## Experience Goals

- Feel like a playable 16-bit farming adventure, not a dashboard.
- Teach money, production, debt, household costs, and opportunity cost through action.
- Keep actions concrete: prepare soil, plant wheat, harvest wheat, milk cows, earn and spend resources.
- Make every economy change visible in the HUD.

## Current Scope

- Maya moves tile-by-tile.
- One unlocked field can be prepared, planted, and harvested.
- A second field is visible but locked.
- Worker tasks are serialized through one active task plus a queue.
- Inventory and household stats update through game systems.

## Out Of Scope For This Foundation

- Market
- Admin events
- Multiplayer
- Family accounts
- Contracts
- NPCs
- Visual polish pass
