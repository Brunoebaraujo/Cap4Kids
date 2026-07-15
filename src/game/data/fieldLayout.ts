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
      { x: 0.4038, y: 0.4635 },
      { x: 0.2951, y: 0.5654 },
      { x: 0.5441, y: 0.8744 },
      { x: 0.6581, y: 0.7245 },
    ],
    workPoint: { x: 0.4071, y: 0.5373 },
  },
  {
    id: 2,
    polygon: [
      { x: 0.0619, y: 0.4893 },
      { x: 0.002, y: 0.5455 },
      { x: 0.0026, y: 0.652 },
      { x: 0.0619, y: 0.7292 },
      { x: 0.1792, y: 0.6028 },
    ],
    workPoint: { x: 0.0599, y: 0.5642 },
  },
  {
    id: 3,
    polygon: [
      { x: 0.2708, y: 0.6215 },
      { x: 0.1318, y: 0.7503 },
      { x: 0.307, y: 0.9891 },
      { x: 0.4493, y: 0.9926 },
      { x: 0.5329, y: 0.8837 },
    ],
    workPoint: { x: 0.2569, y: 0.7058 },
  },
];

export function fieldPolygon(layout: FieldLayout, width: number, height: number) {
  return layout.polygon.map(({ x, y }) => ({ x: x * width, y: y * height }));
}

export function fieldWorkPoint(layout: FieldLayout, width: number, height: number) {
  return { x: layout.workPoint.x * width, y: layout.workPoint.y * height };
}
