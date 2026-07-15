export interface NormalizedPoint { x: number; y: number }

export interface FieldLayout {
  id: number;
  polygon: NormalizedPoint[];
  workPoint: NormalizedPoint;
}

// Coordinates are normalized against the 1448x1086 large farm map.
// Each large block will later be subdivided into a logical 6x6 plot grid.
export const FIELD_LAYOUTS: FieldLayout[] = [
  {
    id: 1,
    polygon: [
      { x: 0.0373, y: 0.3444 },
      { x: 0.1906, y: 0.2983 },
      { x: 0.3191, y: 0.3867 },
      { x: 0.1782, y: 0.4770 },
      { x: 0.0207, y: 0.4180 },
    ],
    workPoint: { x: 0.1692, y: 0.3941 },
  },
  {
    id: 2,
    polygon: [
      { x: 0.4378, y: 0.2762 },
      { x: 0.6064, y: 0.2882 },
      { x: 0.6968, y: 0.3913 },
      { x: 0.4986, y: 0.4567 },
      { x: 0.3515, y: 0.3683 },
    ],
    workPoint: { x: 0.5276, y: 0.3729 },
  },
  {
    id: 3,
    polygon: [
      { x: 0.6112, y: 0.0994 },
      { x: 0.8218, y: 0.1105 },
      { x: 0.8923, y: 0.2320 },
      { x: 0.6961, y: 0.2523 },
      { x: 0.5753, y: 0.1703 },
    ],
    workPoint: { x: 0.7355, y: 0.1740 },
  },
  {
    id: 4,
    polygon: [
      { x: 0.3232, y: 0.4678 },
      { x: 0.4972, y: 0.4494 },
      { x: 0.6229, y: 0.5691 },
      { x: 0.4358, y: 0.6547 },
      { x: 0.2182, y: 0.5516 },
    ],
    workPoint: { x: 0.4323, y: 0.5488 },
  },
  {
    id: 5,
    polygon: [
      { x: 0.6706, y: 0.4328 },
      { x: 0.8329, y: 0.3877 },
      { x: 0.9917, y: 0.4954 },
      { x: 0.8011, y: 0.6087 },
      { x: 0.5787, y: 0.5295 },
    ],
    workPoint: { x: 0.7873, y: 0.5046 },
  },
  {
    id: 6,
    polygon: [
      { x: 0.1395, y: 0.5691 },
      { x: 0.3218, y: 0.6510 },
      { x: 0.2044, y: 0.8057 },
      { x: 0.0173, y: 0.7320 },
      { x: 0.0331, y: 0.6308 },
    ],
    workPoint: { x: 0.1740, y: 0.6934 },
  },
];

export function fieldPolygon(layout: FieldLayout, width: number, height: number) {
  return layout.polygon.map(({ x, y }) => ({ x: x * width, y: y * height }));
}

export function fieldWorkPoint(layout: FieldLayout, width: number, height: number) {
  return { x: layout.workPoint.x * width, y: layout.workPoint.y * height };
}
