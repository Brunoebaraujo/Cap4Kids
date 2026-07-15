export interface NormalizedPoint { x: number; y: number }

export interface MapArea {
  id: string;
  type: string;
  label: string;
  polygon: NormalizedPoint[];
  workPoint: NormalizedPoint;
  grid?: { rows: number; cols: number };
}

// Full calibrated area map exported from public/area-calibrator.html.
export const MAP_AREAS: MapArea[] = [
  {
    "id": "field-1",
    "type": "fieldBlock",
    "label": "Campo 1",
    "grid": {
      "rows": 6,
      "cols": 6
    },
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
    "id": "field-2",
    "type": "fieldBlock",
    "label": "Campo 2",
    "grid": {
      "rows": 6,
      "cols": 6
    },
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
    "id": "field-3",
    "type": "fieldBlock",
    "label": "Campo 3",
    "grid": {
      "rows": 6,
      "cols": 6
    },
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
    "id": "field-4",
    "type": "fieldBlock",
    "label": "Campo 4",
    "grid": {
      "rows": 6,
      "cols": 6
    },
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
    "id": "field-5",
    "type": "fieldBlock",
    "label": "Campo 5",
    "grid": {
      "rows": 6,
      "cols": 6
    },
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
    "id": "field-6",
    "type": "fieldBlock",
    "label": "Campo 6",
    "grid": {
      "rows": 6,
      "cols": 6
    },
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
  },
  {
    "id": "farmhouse",
    "type": "buildingArea",
    "label": "Casa",
    "polygon": [
      {
        "x": 0.2113,
        "y": 0.1584
      },
      {
        "x": 0.2977,
        "y": 0.1068
      },
      {
        "x": 0.4738,
        "y": 0.2155
      },
      {
        "x": 0.317,
        "y": 0.3361
      },
      {
        "x": 0.1443,
        "y": 0.2044
      }
    ],
    "workPoint": {
      "x": 0.3508,
      "y": 0.2366
    }
  },
  {
    "id": "corral",
    "type": "animalArea",
    "label": "Curral",
    "polygon": [
      {
        "x": 0.615,
        "y": 0.083
      },
      {
        "x": 0.6713,
        "y": 0.1243
      },
      {
        "x": 0.7417,
        "y": 0.1869
      },
      {
        "x": 0.6333,
        "y": 0.2652
      },
      {
        "x": 0.5,
        "y": 0.1676
      }
    ],
    "workPoint": {
      "x": 0.6264,
      "y": 0.1832
    }
  },
  {
    "id": "silos",
    "type": "storageArea",
    "label": "Silos",
    "polygon": [
      {
        "x": 0.7845,
        "y": 0.2109
      },
      {
        "x": 0.8681,
        "y": 0.2302
      },
      {
        "x": 0.9351,
        "y": 0.2901
      },
      {
        "x": 0.8536,
        "y": 0.3646
      },
      {
        "x": 0.7134,
        "y": 0.268
      }
    ],
    "workPoint": {
      "x": 0.7838,
      "y": 0.2726
    }
  },
  {
    "id": "machinery",
    "type": "machineryArea",
    "label": "Maquinario",
    "polygon": [
      {
        "x": 0.8225,
        "y": 0.4125
      },
      {
        "x": 0.8826,
        "y": 0.3895
      },
      {
        "x": 0.9869,
        "y": 0.4816
      },
      {
        "x": 0.8605,
        "y": 0.5976
      },
      {
        "x": 0.768,
        "y": 0.5304
      }
    ],
    "workPoint": {
      "x": 0.888,
      "y": 0.479
    }
  },
  {
    "id": "lake",
    "type": "waterArea",
    "label": "Lago",
    "polygon": [
      {
        "x": 0.6167,
        "y": 0.6685
      },
      {
        "x": 0.804,
        "y": 0.577
      },
      {
        "x": 0.9496,
        "y": 0.6584
      },
      {
        "x": 0.9544,
        "y": 0.7799
      },
      {
        "x": 0.6885,
        "y": 0.9659
      },
      {
        "x": 0.5421,
        "y": 0.826
      }
    ],
    "workPoint": {
      "x": 0.7162,
      "y": 0.7486
    }
  },
  {
    "id": "shop",
    "type": "marketArea",
    "label": "Lojinha",
    "polygon": [
      {
        "x": 0.2597,
        "y": 0.6676
      },
      {
        "x": 0.3211,
        "y": 0.6262
      },
      {
        "x": 0.451,
        "y": 0.7339
      },
      {
        "x": 0.2901,
        "y": 0.8278
      },
      {
        "x": 0.1954,
        "y": 0.7293
      }
    ],
    "workPoint": {
      "x": 0.3308,
      "y": 0.7606
    }
  },
  {
    "id": "road",
    "type": "roadArea",
    "label": "Estrada",
    "polygon": [
      {
        "x": 0.1416,
        "y": 0.7753
      },
      {
        "x": 0.1789,
        "y": 0.7468
      },
      {
        "x": 0.3605,
        "y": 0.9945
      },
      {
        "x": 0.2838,
        "y": 0.9954
      }
    ],
    "workPoint": {
      "x": 0.2286,
      "y": 0.8425
    }
  }
];
