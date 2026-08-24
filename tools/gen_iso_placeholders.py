"""Gera tiles e sprites isometricos placeholder para o Cap4Kids.

Convencoes travadas (ver docs/art-direction.md):
  - Projecao dimetrica 2:1. Tile de chao = 128x64 px.
  - Luz vinda de NOROESTE. Face esquerda clara, face direita escura.
  - Sprites ancorados em BOTTOM-CENTER, origin (0.5, 1.0) no Phaser.
  - A aresta inferior do canvas coincide com o vertice INFERIOR do losango de base.
  - Sem sombra de contato assada no sprite (a cena desenha sombra separada).

Rodar:  python3 tools/gen_iso_placeholders.py
Saida:  public/assets/iso/ground/*.png  e  public/assets/iso/sprites/*.png
"""

from __future__ import annotations

import json
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

TILE_W = 128
TILE_H = 64

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GROUND_DIR = os.path.join(ROOT, "public", "assets", "iso", "ground")
SPRITE_DIR = os.path.join(ROOT, "public", "assets", "iso", "sprites")

RNG = np.random.default_rng(20260824)

manifest: dict[str, dict] = {"ground": {}, "sprites": {}}


def shade(rgb: tuple[int, int, int], factor: float) -> tuple[int, int, int]:
    return tuple(max(0, min(255, int(c * factor))) for c in rgb)


def diamond_points(cx: float, cy: float, w: int, h: int):
    return [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]


def speckle(img: Image.Image, mask: Image.Image, colors, density: float, size: int = 2):
    draw = ImageDraw.Draw(img)
    mask_px = mask.load()
    w, h = img.size
    count = int(w * h * density)
    for _ in range(count):
        x = int(RNG.integers(0, w))
        y = int(RNG.integers(0, h))
        if mask_px[x, y] < 200:
            continue
        color = colors[int(RNG.integers(0, len(colors)))]
        draw.rectangle([x, y, x + size - 1, y + size - 1], fill=color + (255,))


def ground_tile(name: str, base: tuple[int, int, int], *, speckles=None,
                furrows: str | None = None, density: float = 0.02) -> None:
    """Desenha um losango 128x64 com ruido sutil e borda escurecida."""
    img = Image.new("RGBA", (TILE_W, TILE_H), (0, 0, 0, 0))
    mask = Image.new("L", (TILE_W, TILE_H), 0)
    ImageDraw.Draw(mask).polygon(
        diamond_points(TILE_W / 2, TILE_H / 2, TILE_W, TILE_H), fill=255
    )

    noise = RNG.normal(0.0, 5.0, (TILE_H, TILE_W, 1))
    field = np.clip(np.array(base, dtype=float)[None, None, :] + noise, 0, 255)
    body = Image.fromarray(field.astype(np.uint8), "RGB").convert("RGBA")
    img = Image.composite(body, img, mask)

    draw = ImageDraw.Draw(img)

    if furrows == "iso":
        for offset in range(-TILE_W, TILE_W, 12):
            draw.line(
                [(offset, TILE_H), (offset + TILE_W, 0)],
                fill=shade(base, 0.82) + (255,), width=2,
            )
            draw.line(
                [(offset + 3, TILE_H), (offset + TILE_W + 3, 0)],
                fill=shade(base, 1.10) + (255,), width=1,
            )
        img = Image.composite(img, Image.new("RGBA", img.size, (0, 0, 0, 0)), mask)
        draw = ImageDraw.Draw(img)

    if speckles:
        speckle(img, mask, speckles, density)

    edge = Image.new("RGBA", (TILE_W, TILE_H), (0, 0, 0, 0))
    ImageDraw.Draw(edge).polygon(
        diamond_points(TILE_W / 2, TILE_H / 2, TILE_W, TILE_H),
        outline=shade(base, 0.80) + (110,),
    )
    img = Image.alpha_composite(img, edge)
    img.putalpha(mask)

    path = os.path.join(GROUND_DIR, f"{name}.png")
    img.save(path, "PNG", optimize=True)
    manifest["ground"][name] = {"w": TILE_W, "h": TILE_H, "file": f"ground/{name}.png"}


def iso_box(footprint: int, height: int, base: tuple[int, int, int]) -> Image.Image:
    """Cuboide isometrico com a aresta inferior do canvas no vertice inferior da base."""
    bw, bh = TILE_W * footprint, TILE_H * footprint
    img = Image.new("RGBA", (bw, bh + height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = bw / 2
    top_cy = bh / 2
    bot_cy = bh / 2 + height

    left_face = [
        (0, top_cy), (cx, bh), (cx, bh + height), (0, top_cy + height),
    ]
    right_face = [
        (bw, top_cy), (cx, bh), (cx, bh + height), (bw, top_cy + height),
    ]
    draw.polygon(left_face, fill=shade(base, 0.86) + (255,))
    draw.polygon(right_face, fill=shade(base, 0.64) + (255,))
    draw.polygon(diamond_points(cx, top_cy, bw, bh), fill=base + (255,))

    outline = shade(base, 0.45) + (255,)
    draw.line([(0, top_cy), (cx, bh), (bw, top_cy)], fill=outline, width=2)
    draw.line([(cx, bh), (cx, bh + height)], fill=outline, width=2)
    draw.line([(0, top_cy), (0, top_cy + height)], fill=outline, width=2)
    draw.line([(bw, top_cy), (bw, top_cy + height)], fill=outline, width=2)
    draw.line([(0, top_cy + height), (cx, bh + height), (bw, top_cy + height)],
              fill=outline, width=2)
    _ = bot_cy
    return img


def save_sprite(name: str, img: Image.Image, footprint: int) -> None:
    path = os.path.join(SPRITE_DIR, f"{name}.png")
    img.save(path, "PNG", optimize=True)
    manifest["sprites"][name] = {
        "w": img.width,
        "h": img.height,
        "footprint": footprint,
        "anchor": [0.5, 1.0],
        "file": f"sprites/{name}.png",
    }


def building(name: str, footprint: int, height: int, wall: tuple[int, int, int],
             roof: tuple[int, int, int] | None = None, roof_h: int = 0) -> None:
    img = iso_box(footprint, height, wall)
    if roof and roof_h:
        cap = iso_box(footprint, roof_h, roof)
        top = Image.new("RGBA", img.size, (0, 0, 0, 0))
        top.paste(cap, (0, 0), cap)
        shifted = Image.new("RGBA", img.size, (0, 0, 0, 0))
        shifted.paste(cap, (0, -roof_h), cap)
        img = Image.alpha_composite(img, shifted)
        _ = top
    save_sprite(name, img, footprint)


def crop_stage(name: str, stage: int) -> None:
    img = Image.new("RGBA", (TILE_W, TILE_H + 48), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    base_y = 48
    heights = [6, 14, 24, 34]
    colors = [(120, 168, 78), (110, 160, 70), (168, 176, 62), (206, 176, 62)]
    h = heights[stage]
    color = colors[stage]
    for _ in range(26):
        u = float(RNG.uniform(-0.42, 0.42))
        v = float(RNG.uniform(-0.42, 0.42))
        x = TILE_W / 2 + (u - v) * TILE_W / 2
        y = base_y + TILE_H / 2 + (u + v) * TILE_H / 2
        jitter = float(RNG.uniform(0.75, 1.2))
        draw.line([(x, y), (x, y - h * jitter)], fill=color + (255,), width=2)
        if stage >= 2:
            draw.ellipse(
                [x - 2, y - h * jitter - 4, x + 2, y - h * jitter],
                fill=shade(color, 1.15) + (255,),
            )
    save_sprite(name, img, 1)


def unit(name: str, body: tuple[int, int, int], accent: tuple[int, int, int],
         height: int) -> None:
    img = Image.new("RGBA", (TILE_W, TILE_H + height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = TILE_W / 2
    feet = TILE_H + height - TILE_H / 2
    draw.rounded_rectangle(
        [cx - 12, feet - height, cx + 12, feet], radius=8, fill=body + (255,),
        outline=shade(body, 0.5) + (255,), width=2,
    )
    draw.ellipse(
        [cx - 11, feet - height - 18, cx + 11, feet - height + 4],
        fill=accent + (255,), outline=shade(accent, 0.55) + (255,), width=2,
    )
    save_sprite(name, img, 1)


def prop_tree() -> None:
    img = Image.new("RGBA", (TILE_W, TILE_H + 96), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, feet = TILE_W / 2, TILE_H + 96 - TILE_H / 2
    draw.rectangle([cx - 7, feet - 44, cx + 7, feet], fill=(104, 72, 44, 255),
                   outline=(64, 44, 26, 255), width=2)
    for i, (r, dy, col) in enumerate(
        [(40, 44, (58, 108, 52)), (32, 66, (72, 128, 60)), (22, 84, (92, 148, 70))]
    ):
        draw.ellipse([cx - r, feet - dy - r * 0.72, cx + r, feet - dy + r * 0.72],
                     fill=col + (255,), outline=shade(col, 0.6) + (255,), width=2)
        _ = i
    save_sprite("tree", img, 1)


def prop_fence(name: str, direction: str) -> None:
    img = Image.new("RGBA", (TILE_W, TILE_H + 40), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    top = 40
    if direction == "ne":
        a, b = (0, top + TILE_H / 2), (TILE_W / 2, top)
    else:
        a, b = (TILE_W / 2, top), (TILE_W, top + TILE_H / 2)
    wood, dark = (156, 116, 70), (98, 70, 40)
    draw.line([(a[0], a[1] - 6), (b[0], b[1] - 6)], fill=wood + (255,), width=4)
    draw.line([(a[0], a[1] - 22), (b[0], b[1] - 22)], fill=wood + (255,), width=4)
    for t in (0.0, 0.5, 1.0):
        px = a[0] + (b[0] - a[0]) * t
        py = a[1] + (b[1] - a[1]) * t
        draw.rectangle([px - 3, py - 34, px + 3, py], fill=dark + (255,))
    save_sprite(name, img, 1)


def contact_sheet() -> None:
    tiles = sorted(os.listdir(GROUND_DIR))
    sprites = sorted(os.listdir(SPRITE_DIR))
    sheet = Image.new("RGBA", (1180, 760), (46, 52, 44, 255))
    draw = ImageDraw.Draw(sheet)
    x, y = 20, 20
    for f in tiles:
        im = Image.open(os.path.join(GROUND_DIR, f))
        sheet.paste(im, (x, y), im)
        draw.text((x, y + 68), f[:-4], fill=(220, 220, 210, 255))
        x += 148
        if x > 1000:
            x, y = 20, y + 96
    x, y = 20, y + 110
    for f in sprites:
        im = Image.open(os.path.join(SPRITE_DIR, f))
        sheet.paste(im, (x, y + (300 - im.height)), im)
        draw.text((x, y + 310), f[:-4], fill=(220, 220, 210, 255))
        x += im.width + 16
        if x > 900:
            x, y = 20, y + 340
    sheet.save(os.path.join(ROOT, "tools", "contact_sheet.png"))


def main() -> None:
    os.makedirs(GROUND_DIR, exist_ok=True)
    os.makedirs(SPRITE_DIR, exist_ok=True)

    ground_tile("grass_00", (96, 148, 72),
                speckles=[(112, 168, 84), (82, 132, 62)], density=0.020)
    ground_tile("grass_01", (90, 142, 68),
                speckles=[(118, 172, 88), (76, 126, 58)], density=0.028)
    ground_tile("grass_02", (102, 154, 76),
                speckles=[(126, 180, 92), (86, 136, 66), (196, 196, 108)], density=0.024)
    ground_tile("grass_03", (86, 136, 66),
                speckles=[(108, 162, 80), (72, 120, 54)], density=0.016)
    ground_tile("dirt", (150, 118, 78),
                speckles=[(172, 140, 96), (124, 96, 60)], density=0.026)
    ground_tile("path", (168, 142, 100),
                speckles=[(190, 166, 124), (140, 116, 80)], density=0.030)
    ground_tile("soil_plowed", (122, 88, 58), furrows="iso",
                speckles=[(142, 106, 70)], density=0.012)
    ground_tile("soil_planted", (112, 82, 54), furrows="iso",
                speckles=[(120, 160, 74)], density=0.020)
    ground_tile("water", (72, 122, 158),
                speckles=[(96, 148, 184), (58, 104, 138)], density=0.030)

    building("farmhouse", 2, 58, (196, 176, 140), roof=(168, 84, 62), roof_h=34)
    building("barn", 2, 62, (170, 74, 60), roof=(96, 72, 56), roof_h=30)
    building("silo", 1, 96, (206, 200, 186), roof=(140, 146, 152), roof_h=18)
    building("shipping_bin", 1, 34, (146, 112, 72))
    building("well", 1, 30, (140, 138, 132), roof=(120, 88, 60), roof_h=22)

    for i in range(4):
        crop_stage(f"wheat_{i}", i)

    unit("worker_maya", (74, 118, 168), (232, 196, 160), 40)
    unit("cow", (238, 236, 228), (74, 66, 58), 30)

    prop_tree()
    prop_fence("fence_ne", "ne")
    prop_fence("fence_nw", "nw")

    with open(os.path.join(ROOT, "tools", "iso_manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)

    contact_sheet()
    print(f"ground: {len(manifest['ground'])} tiles")
    print(f"sprites: {len(manifest['sprites'])} sprites")


if __name__ == "__main__":
    main()
