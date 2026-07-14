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
      { x: 0.315, y: 0.53 },
      { x: 0.40, y: 0.495 },
      { x: 0.60, y: 0.575 },
      { x: 0.455, y: 0.68 },
      { x: 0.32, y: 0.60 },
    ],
    workPoint: { x: 0.47, y: 0.53 },
  },
  {
    id: 2,
    polygon: [
      { x: 0.01, y: 0.545 },
      { x: 0.13, y: 0.525 },
      { x: 0.225, y: 0.615 },
      { x: 0.085, y: 0.72 },
      { x: 0.01, y: 0.68 },
    ],
    workPoint: { x: 0.22, y: 0.59 },
  },
  {
    id: 3,
    polygon: [
      { x: 0.15, y: 0.745 },
      { x: 0.37, y: 0.625 },
      { x: 0.64, y: 0.75 },
      { x: 0.39, y: 0.96 },
      { x: 0.16, y: 0.82 },
    ],
    workPoint: { x: 0.42, y: 0.70 },
  },
];

export function fieldPolygon(layout: FieldLayout, width: number, height: number) {
  return layout.polygon.map(({ x, y }) => ({ x: x * width, y: y * height }));
}

export function fieldWorkPoint(layout: FieldLayout, width: number, height: number) {
  return { x: layout.workPoint.x * width, y: layout.workPoint.y * height };
}
