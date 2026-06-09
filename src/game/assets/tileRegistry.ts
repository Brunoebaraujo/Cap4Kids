import Phaser from 'phaser';
import { TILE_SIZE } from '../types';

export type TileId =
  | 'grass_base'
  | 'grass_light'
  | 'grass_dark'
  | 'grass_flower'
  | 'grass_rock_small'
  | 'grass_clover'
  | 'grass_worn'
  | 'path_horizontal'
  | 'path_vertical'
  | 'path_corner_ne'
  | 'path_corner_se'
  | 'path_corner_sw'
  | 'path_corner_nw'
  | 'path_t_north'
  | 'path_t_east'
  | 'path_t_south'
  | 'path_t_west'
  | 'path_cross'
  | 'path_edge'
  | 'dirt_path'
  | 'dirt_path_edge'
  | 'field_harvested'
  | 'field_prepared'
  | 'field_planted'
  | 'field_locked'
  | 'water'
  | 'fence_horizontal'
  | 'fence_vertical'
  | 'fence_corner'
  | 'fence_gate'
  | 'corral_dirt'
  | 'house_wall'
  | 'house_roof'
  | 'house_roof_left'
  | 'house_roof_right'
  | 'house_door'
  | 'house_window'
  | 'house_chimney'
  | 'house_flower_box'
  | 'tree'
  | 'bush'
  | 'rock'
  | 'flower';

export interface TileDefinition {
  id: TileId;
  textureKey: string;
  assetPath: string;
  atlasIndex: number;
}

const tile = (id: TileId, fileName: string, atlasIndex: number): TileDefinition => ({
  id,
  textureKey: `tile-${id.replace(/_/g, '-')}`,
  assetPath: `assets/tiles/${fileName}.png`,
  atlasIndex,
});

export const TILE_REGISTRY: TileDefinition[] = [
  tile('grass_base', 'grass-base', 0),
  tile('grass_light', 'grass-light', 1),
  tile('grass_dark', 'grass-dark', 2),
  tile('grass_flower', 'grass-flower', 3),
  tile('grass_rock_small', 'grass-rock-small', 4),
  tile('grass_clover', 'grass-clover', 5),
  tile('grass_worn', 'grass-worn', 6),
  tile('path_horizontal', 'path-horizontal', 7),
  tile('path_vertical', 'path-vertical', 8),
  tile('path_corner_ne', 'path-corner-ne', 9),
  tile('path_corner_se', 'path-corner-se', 10),
  tile('path_corner_sw', 'path-corner-sw', 11),
  tile('path_corner_nw', 'path-corner-nw', 12),
  tile('path_t_north', 'path-t-north', 13),
  tile('path_t_east', 'path-t-east', 14),
  tile('path_t_south', 'path-t-south', 15),
  tile('path_t_west', 'path-t-west', 16),
  tile('path_cross', 'path-cross', 17),
  tile('path_edge', 'path-edge', 18),
  tile('dirt_path', 'dirt-path', 19),
  tile('dirt_path_edge', 'dirt-path-edge', 20),
  tile('field_harvested', 'field-harvested', 21),
  tile('field_prepared', 'field-prepared', 22),
  tile('field_planted', 'field-planted', 23),
  tile('field_locked', 'field-locked', 24),
  tile('water', 'water', 25),
  tile('fence_horizontal', 'fence-horizontal', 26),
  tile('fence_vertical', 'fence-vertical', 27),
  tile('fence_corner', 'fence-corner', 28),
  tile('fence_gate', 'fence-gate', 29),
  tile('corral_dirt', 'corral-dirt', 30),
  tile('house_wall', 'house-wall', 31),
  tile('house_roof', 'house-roof', 32),
  tile('house_roof_left', 'house-roof-left', 33),
  tile('house_roof_right', 'house-roof-right', 34),
  tile('house_door', 'house-door', 35),
  tile('house_window', 'house-window', 36),
  tile('house_chimney', 'house-chimney', 37),
  tile('house_flower_box', 'house-flower-box', 38),
  tile('tree', 'tree', 39),
  tile('bush', 'bush', 40),
  tile('rock', 'rock', 41),
  tile('flower', 'flower', 42),
];

export const TILE_INDEX_BY_ID = TILE_REGISTRY.reduce<Record<TileId, number>>((indexes, definition) => {
  indexes[definition.id] = definition.atlasIndex;
  return indexes;
}, {} as Record<TileId, number>);

export function preloadTilePngs(scene: Phaser.Scene) {
  TILE_REGISTRY.forEach((definition) => {
    if (!scene.textures.exists(definition.textureKey)) {
      scene.load.image(definition.textureKey, definition.assetPath);
    }
  });
}

export function getTileIndex(id: TileId) {
  return TILE_INDEX_BY_ID[id];
}

export { TILE_SIZE };
