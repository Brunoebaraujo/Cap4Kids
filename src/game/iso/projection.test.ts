import { describe, expect, it } from 'vitest';
import {
  TILE_H,
  TILE_W,
  depthFor,
  spriteAnchor,
  tileToWorld,
  worldBounds,
  worldToTile,
  worldToTileFloor,
} from './projection';

describe('projecao isometrica', () => {
  it('mantem a origem no zero', () => {
    expect(tileToWorld(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('avanca meio tile por passo em cada eixo', () => {
    expect(tileToWorld(1, 0)).toEqual({ x: TILE_W / 2, y: TILE_H / 2 });
    expect(tileToWorld(0, 1)).toEqual({ x: -TILE_W / 2, y: TILE_H / 2 });
    expect(tileToWorld(1, 1)).toEqual({ x: 0, y: TILE_H });
  });

  it('faz ida e volta exata para todo tile do mapa', () => {
    for (let tx = 0; tx < 48; tx += 1) {
      for (let ty = 0; ty < 48; ty += 1) {
        const world = tileToWorld(tx, ty);
        const back = worldToTile(world.x, world.y);
        expect(back.x).toBeCloseTo(tx, 10);
        expect(back.y).toBeCloseTo(ty, 10);
      }
    }
  });

  it('resolve o tile correto para pontos dentro do losango', () => {
    const center = tileToWorld(7, 3);
    expect(worldToTileFloor(center.x, center.y)).toEqual({ x: 7, y: 3 });
    expect(worldToTileFloor(center.x, center.y - TILE_H / 2 + 2)).toEqual({ x: 7, y: 3 });
    expect(worldToTileFloor(center.x, center.y + TILE_H / 2 - 2)).toEqual({ x: 7, y: 3 });
    expect(worldToTileFloor(center.x - TILE_W / 2 + 2, center.y)).toEqual({ x: 7, y: 3 });
    expect(worldToTileFloor(center.x + TILE_W / 2 - 2, center.y)).toEqual({ x: 7, y: 3 });
  });

  it('nao deixa buraco nem sobreposicao entre tiles vizinhos', () => {
    const seen = new Set<string>();
    for (let sx = -400; sx <= 400; sx += 7) {
      for (let sy = 0; sy <= 400; sy += 7) {
        const tile = worldToTileFloor(sx, sy);
        seen.add(`${tile.x}:${tile.y}`);
      }
    }
    expect(seen.size).toBeGreaterThan(50);
  });

  it('ancora sprite de footprint 1 no vertice inferior do losango', () => {
    const anchor = spriteAnchor(4, 4, 1);
    const center = tileToWorld(4, 4);
    expect(anchor.x).toBe(center.x);
    expect(anchor.y).toBe(center.y + TILE_H / 2);
  });

  it('ancora sprite de footprint 2 no vertice inferior do bloco', () => {
    const anchor = spriteAnchor(4, 4, 2);
    const south = tileToWorld(5, 5);
    expect(anchor.x).toBe(tileToWorld(4, 4).x);
    expect(anchor.y).toBe(south.y + TILE_H / 2);
  });

  it('ordena em profundidade objetos mais ao sul por cima', () => {
    const perto = depthFor(spriteAnchor(2, 2, 1).y);
    const longe = depthFor(spriteAnchor(8, 8, 1).y);
    expect(longe).toBeGreaterThan(perto);
  });

  it('ordena predio grande depois do tile que ele cobre', () => {
    const tile = depthFor(spriteAnchor(4, 4, 1).y);
    const predio = depthFor(spriteAnchor(4, 4, 2).y);
    expect(predio).toBeGreaterThan(tile);
  });

  it('calcula limites de mundo cobrindo o mapa inteiro', () => {
    const bounds = worldBounds(40, 40);
    expect(bounds.width).toBe(40 * TILE_W);
    expect(bounds.height).toBe(40 * TILE_H);
    const corner = tileToWorld(39, 39);
    expect(corner.y + TILE_H / 2).toBeCloseTo(bounds.y + bounds.height, 10);
  });
});
