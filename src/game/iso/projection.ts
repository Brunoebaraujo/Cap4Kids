/**
 * Projecao isometrica dimetrica 2:1.
 *
 * Esta e a UNICA fonte de verdade da projecao. A simulacao (FieldSystem,
 * EconomySystem, ...) nunca ve pixels: ela trabalha em coordenadas de tile.
 * Somente o render e o picking passam por aqui.
 *
 * Convencao:
 *   - tileToWorld(tx, ty) devolve o CENTRO do losango.
 *   - Ida e volta sao exatas (ver projection.test.ts).
 *   - Sprites sao ancorados em bottom-center no VERTICE INFERIOR do losango,
 *     isto e, em (world.y + TILE_H / 2).
 */

export const TILE_W = 128;
export const TILE_H = 64;

const HALF_W = TILE_W / 2;
const HALF_H = TILE_H / 2;

export interface Point {
  x: number;
  y: number;
}

/** Centro do losango do tile, em pixels de mundo. */
export function tileToWorld(tileX: number, tileY: number): Point {
  return {
    x: (tileX - tileY) * HALF_W,
    y: (tileX + tileY) * HALF_H,
  };
}

/** Coordenada de tile fracionaria a partir de um ponto de mundo. */
export function worldToTile(worldX: number, worldY: number): Point {
  return {
    x: (worldX / HALF_W + worldY / HALF_H) / 2,
    y: (worldY / HALF_H - worldX / HALF_W) / 2,
  };
}

/** Tile inteiro que contem o ponto de mundo. */
export function worldToTileFloor(worldX: number, worldY: number): Point {
  const tile = worldToTile(worldX, worldY);
  return { x: Math.floor(tile.x + 0.5), y: Math.floor(tile.y + 0.5) };
}

/**
 * Ponto de ancoragem de um sprite ocupando `footprint` x `footprint` tiles
 * a partir do tile norte (tileX, tileY). Devolve o vertice inferior da base.
 */
export function spriteAnchor(tileX: number, tileY: number, footprint = 1): Point {
  const south = tileToWorld(tileX + footprint - 1, tileY + footprint - 1);
  return { x: tileToWorld(tileX, tileY).x, y: south.y + HALF_H };
}

/**
 * Chave de ordenacao do painter's algorithm. Usar a coordenada Y da ancora
 * ordena corretamente sprites de footprints diferentes, o que `tx + ty`
 * sozinho nao faz.
 */
export function depthFor(anchorY: number): number {
  return Math.round(anchorY);
}

/** Retangulo de mundo que envolve um mapa de `cols` x `rows` tiles. */
export function worldBounds(cols: number, rows: number) {
  const left = tileToWorld(0, rows - 1).x - HALF_W;
  const right = tileToWorld(cols - 1, 0).x + HALF_W;
  const top = tileToWorld(0, 0).y - HALF_H;
  const bottom = tileToWorld(cols - 1, rows - 1).y + HALF_H;
  return { x: left, y: top, width: right - left, height: bottom - top };
}
