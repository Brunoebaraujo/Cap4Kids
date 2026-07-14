# Art Direction

Capitalism 4 Kids targets warm 16-bit pixel art inspired by Sega Mega Drive and SNES-era farming and adventure games.

## Style Pillars

- Clean readable pixels.
- Cartoon proportions.
- Warm farming colors.
- Strong silhouettes.
- Tile-based environments.
- Sprite and spritesheet animation.

## Current Asset Strategy

The foundation uses generated Phaser graphics as placeholder pixel assets. These are intentionally simple but pixel-compatible, so they can later be replaced with real tilesets and spritesheets without changing the architecture.

Current placeholders:

- Grass tile
- Dirt path tile
- Harvested field tile
- Prepared field tile
- Planted field tile
- Locked field tile
- Fence tile
- Water tile
- Maya sprite frames

## Rules

- Do not use a large background PNG for the farm.
- Do not use screenshots as gameplay.
- Do not swap full-screen images to fake progression.
- Do not use realistic, painterly, or HD-style assets.
- Build the world from tilemaps, tilesets, sprites, spritesheets, frame animations, and Phaser game objects.
# Vertical slice visual target

The approved direction is a premium painterly-realistic 2.5D farming RTS. The first implementation uses a single world plate behind deterministic Phaser interactions. This is transitional: buildings, terrain, crops, vegetation, and props will be extracted into independently depth-sorted assets after the interaction model is validated.

Rules for every production asset:

- Orthographic 2:1 isometric projection.
- Light from the upper-left; shadows fall lower-right.
- Natural greens, wheat gold, terracotta, weathered timber, cream plaster.
- Readable silhouettes before surface detail.
- Logical collision and interaction data never baked into the artwork.
- UI remains HTML/CSS; text is never burned into world imagery.
