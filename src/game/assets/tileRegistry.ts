import Phaser from 'phaser';
import { TILE_SIZE } from '../types';

export type TileId =
  | 'grass_light'
  | 'grass_dark'
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
  | 'tree'
  | 'rock'
  | 'flower';

export interface TileDefinition {
  id: TileId;
  textureKey: string;
  assetPath: string;
  atlasIndex: number;
}

export const TILE_REGISTRY: TileDefinition[] = [
  { id: 'grass_light', textureKey: 'tile-grass-light', assetPath: 'assets/tiles/grass-light.png', atlasIndex: 0 },
  { id: 'grass_dark', textureKey: 'tile-grass-dark', assetPath: 'assets/tiles/grass-dark.png', atlasIndex: 1 },
  { id: 'dirt_path', textureKey: 'tile-dirt-path', assetPath: 'assets/tiles/dirt-path.png', atlasIndex: 2 },
  { id: 'dirt_path_edge', textureKey: 'tile-dirt-path-edge', assetPath: 'assets/tiles/dirt-path-edge.png', atlasIndex: 3 },
  { id: 'field_harvested', textureKey: 'tile-field-harvested', assetPath: 'assets/tiles/field-harvested.png', atlasIndex: 4 },
  { id: 'field_prepared', textureKey: 'tile-field-prepared', assetPath: 'assets/tiles/field-prepared.png', atlasIndex: 5 },
  { id: 'field_planted', textureKey: 'tile-field-planted', assetPath: 'assets/tiles/field-planted.png', atlasIndex: 6 },
  { id: 'field_locked', textureKey: 'tile-field-locked', assetPath: 'assets/tiles/field-locked.png', atlasIndex: 7 },
  { id: 'water', textureKey: 'tile-water', assetPath: 'assets/tiles/water.png', atlasIndex: 8 },
  { id: 'fence_horizontal', textureKey: 'tile-fence-horizontal', assetPath: 'assets/tiles/fence-horizontal.png', atlasIndex: 9 },
  { id: 'fence_vertical', textureKey: 'tile-fence-vertical', assetPath: 'assets/tiles/fence-vertical.png', atlasIndex: 10 },
  { id: 'fence_corner', textureKey: 'tile-fence-corner', assetPath: 'assets/tiles/fence-corner.png', atlasIndex: 11 },
  { id: 'tree', textureKey: 'tile-tree', assetPath: 'assets/tiles/tree.png', atlasIndex: 12 },
  { id: 'rock', textureKey: 'tile-rock', assetPath: 'assets/tiles/rock.png', atlasIndex: 13 },
  { id: 'flower', textureKey: 'tile-flower', assetPath: 'assets/tiles/flower.png', atlasIndex: 14 },
];

export const TILE_INDEX_BY_ID = TILE_REGISTRY.reduce<Record<TileId, number>>((indexes, tile) => {
  indexes[tile.id] = tile.atlasIndex;
  return indexes;
}, {} as Record<TileId, number>);

export function preloadTilePngs(scene: Phaser.Scene) {
  TILE_REGISTRY.forEach((tile) => {
    if (!scene.textures.exists(tile.textureKey)) {
      scene.load.image(tile.textureKey, tile.assetPath);
    }
  });
}

export function getTileIndex(id: TileId) {
  return TILE_INDEX_BY_ID[id];
}

export { TILE_SIZE };
