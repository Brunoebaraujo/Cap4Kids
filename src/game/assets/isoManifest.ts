/**
 * CONTRATO DE ASSETS.
 *
 * Este arquivo e a unica ponte entre a arte e o codigo. Nenhuma cena
 * referencia caminho de arquivo: tudo passa por `GROUND` e `SPRITES`.
 *
 * Ao trocar os placeholders pelo pack comprado no itch.io, edite SOMENTE
 * este arquivo (caminho, largura, altura, footprint). Nenhuma cena muda.
 *
 * Regras de aceitacao do pack (ver docs/art-direction.md):
 *   - Projecao dimetrica 2:1 (tile de chao com o dobro da largura da altura).
 *   - Luz vinda de NOROESTE, constante em todos os sprites.
 *   - PNG com canal alpha. Nunca JPG.
 *   - Sem sombra de contato assada no sprite.
 */

export const GROUND_TILE_W = 128;
export const GROUND_TILE_H = 64;

const BASE = `${import.meta.env.BASE_URL}assets/iso/`;

export interface SpriteDef {
  /** Chave de textura no Phaser. */
  key: string;
  /** Caminho relativo a public/assets/iso/. */
  file: string;
  /** Quantos tiles o objeto ocupa em cada eixo. */
  footprint: number;
}

export type GroundKey =
  | 'grass_00' | 'grass_01' | 'grass_02' | 'grass_03'
  | 'dirt' | 'path' | 'soil_plowed' | 'soil_planted' | 'water';

export type SpriteKey =
  | 'farmhouse' | 'barn' | 'silo' | 'shipping_bin' | 'well'
  | 'wheat_0' | 'wheat_1' | 'wheat_2' | 'wheat_3'
  | 'worker_maya' | 'cow'
  | 'tree' | 'fence_ne' | 'fence_nw';

export const GROUND: Record<GroundKey, string> = {
  grass_00: 'ground/grass_00.png',
  grass_01: 'ground/grass_01.png',
  grass_02: 'ground/grass_02.png',
  grass_03: 'ground/grass_03.png',
  dirt: 'ground/dirt.png',
  path: 'ground/path.png',
  soil_plowed: 'ground/soil_plowed.png',
  soil_planted: 'ground/soil_planted.png',
  water: 'ground/water.png',
};

export const SPRITES: Record<SpriteKey, SpriteDef> = {
  farmhouse: { key: 'farmhouse', file: 'sprites/farmhouse.png', footprint: 2 },
  barn: { key: 'barn', file: 'sprites/barn.png', footprint: 2 },
  silo: { key: 'silo', file: 'sprites/silo.png', footprint: 1 },
  shipping_bin: { key: 'shipping_bin', file: 'sprites/shipping_bin.png', footprint: 1 },
  well: { key: 'well', file: 'sprites/well.png', footprint: 1 },
  wheat_0: { key: 'wheat_0', file: 'sprites/wheat_0.png', footprint: 1 },
  wheat_1: { key: 'wheat_1', file: 'sprites/wheat_1.png', footprint: 1 },
  wheat_2: { key: 'wheat_2', file: 'sprites/wheat_2.png', footprint: 1 },
  wheat_3: { key: 'wheat_3', file: 'sprites/wheat_3.png', footprint: 1 },
  worker_maya: { key: 'worker_maya', file: 'sprites/worker_maya.png', footprint: 1 },
  cow: { key: 'cow', file: 'sprites/cow.png', footprint: 1 },
  tree: { key: 'tree', file: 'sprites/tree.png', footprint: 1 },
  fence_ne: { key: 'fence_ne', file: 'sprites/fence_ne.png', footprint: 1 },
  fence_nw: { key: 'fence_nw', file: 'sprites/fence_nw.png', footprint: 1 },
};

export const GRASS_VARIANTS: GroundKey[] = ['grass_00', 'grass_01', 'grass_02', 'grass_03'];

export function groundUrl(key: GroundKey): string {
  return BASE + GROUND[key];
}

export function spriteUrl(key: SpriteKey): string {
  return BASE + SPRITES[key].file;
}

/** Estagio visual do trigo a partir do estado do campo. */
export function wheatSpriteFor(state: string): SpriteKey | null {
  switch (state) {
    case 'Planted':
      return 'wheat_0';
    case 'Growing Stage 1':
      return 'wheat_1';
    case 'Growing Stage 2':
      return 'wheat_2';
    case 'Growing Stage 3':
    case 'Ready To Harvest':
      return 'wheat_3';
    default:
      return null;
  }
}
