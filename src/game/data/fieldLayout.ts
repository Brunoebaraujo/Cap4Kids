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
    "id": 1,
    "polygon": [
      {
        "x": 0.0242,
        "y": 0.372
      },
      {
        "x": 0.1685,
        "y": 0.2661
      },
      {
        "x": 0.299,
        "y": 0.361
      },
      {
        "x": 0.1526,
        "y": 0.4669
      },
      {
        "x": 0.058,
        "y": 0.3969
      }
    ],
    "workPoint": {
      "x": 0.1692,
      "y": 0.3941
    }
  },
  {
    "id": 2,
    "polygon": [
      {
        "x": 0.4378,
        "y": 0.2762
      },
      {
        "x": 0.491,
        "y": 0.232
      },
      {
        "x": 0.634,
        "y": 0.3462
      },
      {
        "x": 0.4793,
        "y": 0.4687
      },
      {
        "x": 0.337,
        "y": 0.3573
      }
    ],
    "workPoint": {
      "x": 0.4869,
      "y": 0.2983
    }
  },
  {
    "id": 3,
    "polygon": [
      {
        "x": 0.654,
        "y": 0.3582
      },
      {
        "x": 0.7003,
        "y": 0.3877
      },
      {
        "x": 0.7873,
        "y": 0.4576
      },
      {
        "x": 0.6402,
        "y": 0.5746
      },
      {
        "x": 0.5083,
        "y": 0.4751
      }
    ],
    "workPoint": {
      "x": 0.6381,
      "y": 0.3932
    }
  },
  {
    "id": 4,
    "polygon": [
      {
        "x": 0.3225,
        "y": 0.3711
      },
      {
        "x": 0.384,
        "y": 0.4171
      },
      {
        "x": 0.4572,
        "y": 0.4761
      },
      {
        "x": 0.3149,
        "y": 0.5893
      },
      {
        "x": 0.1747,
        "y": 0.4807
      }
    ],
    "workPoint": {
      "x": 0.3163,
      "y": 0.4245
    }
  },
  {
    "id": 5,
    "polygon": [
      {
        "x": 0.4786,
        "y": 0.4926
      },
      {
        "x": 0.5463,
        "y": 0.5414
      },
      {
        "x": 0.6167,
        "y": 0.6004
      },
      {
        "x": 0.4703,
        "y": 0.7081
      },
      {
        "x": 0.3425,
        "y": 0.6096
      }
    ],
    "workPoint": {
      "x": 0.4765,
      "y": 0.5341
    }
  },
  {
    "id": 6,
    "polygon": [
      {
        "x": 0.1519,
        "y": 0.5
      },
      {
        "x": 0.3004,
        "y": 0.6059
      },
      {
        "x": 0.1554,
        "y": 0.7182
      },
      {
        "x": 0.009,
        "y": 0.6022
      },
      {
        "x": 0.0725,
        "y": 0.5552
      }
    ],
    "workPoint": {
      "x": 0.1485,
      "y": 0.5534
    }
  }
];

export function fieldPolygon(layout: FieldLayout, width: number, height: number) {
  return layout.polygon.map(({ x, y }) => ({ x: x * width, y: y * height }));
}

export function fieldWorkPoint(layout: FieldLayout, width: number, height: number) {
  return { x: layout.workPoint.x * width, y: layout.workPoint.y * height };
}
