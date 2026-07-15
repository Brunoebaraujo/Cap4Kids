export interface NormalizedPoint { x: number; y: number }

export interface FieldLayout {
  id: number;
  polygon: NormalizedPoint[];
  workPoint: NormalizedPoint;
}

// Coordinates are normalized against the world plate, so the layout survives
// canvas resizing and future higher-resolution exports of the same composition.
export const FIELD_LAYOUTS: FieldLayout[] = [
  {
    id: 1,
    polygon: [
      { x: 0.2974, y: 0.5625 },
      { x: 0.4079, y: 0.4661 },
      { x: 0.6931, y: 0.7359 },
      { x: 0.6253, y: 0.7974 },
      { x: 0.5454, y: 0.8696 },
    ],
    workPoint: { x: 0.4079, y: 0.5251 },
  },
  {
    id: 2,
    polygon: [
      { x: 0.002, y: 0.5553 },
      { x: 0.0556, y: 0.4661 },
      { x: 0.2066, y: 0.5974 },
      { x: 0.0732, y: 0.7588 },
      { x: 0.0054, y: 0.6721 },
    ],
    workPoint: { x: 0.1504, y: 0.6083 },
  },
  {
    id: 3,
    polygon: [
      { x: 0.1321, y: 0.7576 },
      { x: 0.2683, y: 0.6155 },
      { x: 0.5366, y: 0.8985 },
      { x: 0.4248, y: 0.9997 },
      { x: 0.3117, y: 0.9937 },
    ],
    workPoint: { x: 0.2615, y: 0.6781 },
  },
];

export function fieldPolygon(layout: FieldLayout, width: number, height: number) {
  return layout.polygon.map(({ x, y }) => ({ x: x * width, y: y * height }));
}

export function fieldWorkPoint(layout: FieldLayout, width: number, height: number) {
  return { x: layout.workPoint.x * width, y: layout.workPoint.y * height };
}
