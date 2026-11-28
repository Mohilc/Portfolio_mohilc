import * as THREE from 'three';

export const ATLAS_GRID_SIZE = 8; // 8x8 tiles
export const TILE_PX = 32; // 32x32 crisp texels per tile -> 256x256 PBR pixel-art atlas

/**
 * Tile coordinates [col, row] (row 0 = top of texture image)
 */
export const TILES = {
  GRASS: [0, 0],
  GRASS_FLOWER: [1, 0],
  STONE_PATH: [2, 0],
  WOOD_FLOOR: [3, 0],
  LAB_TILE: [4, 0],
  ARCADE_CARPET: [5, 0],
  WALL_CREAM: [6, 0],
  WALL_WAINSCOT: [7, 0],

  WALL_BRICK: [0, 1],
  ROOF_SHINGLE: [1, 1],
  WOOD_OAK: [2, 1],
  WOOD_WALNUT: [3, 1],
  SOFA_FABRIC: [4, 1],
  SOFA_PILLOW: [5, 1],
  RUG_WARM: [6, 1],
  RUG_CORNER: [7, 1],

  BOOK_RED: [0, 2],
  BOOK_BLUE: [1, 2],
  BOOK_GREEN: [2, 2],
  BOOK_GOLD: [3, 2],
  MONITOR_CODE: [4, 2],
  TV_SCREEN: [5, 2],
  ARCADE_SCREEN: [6, 2],
  ARCADE_SIDE: [7, 2],

  WINDOW_DAY: [0, 3],
  WINDOW_NIGHT: [1, 3],
  DOOR_WOOD: [2, 3],
  LEAF_OAK: [3, 3],
  TRUNK_BARK: [4, 3],
  METAL_DARK: [5, 3],
  METAL_ACCENT: [6, 3],
  MIRROR_GLASS: [7, 3],

  SUNDIAL_STONE: [0, 4],
  LANTERN_GLOW: [1, 4],
  POSTER_AI: [2, 4],
  POSTER_UAV: [3, 4],
  TROPHY_GOLD: [4, 4],
  DRONE_BODY: [5, 4],
  SERVER_RACK: [6, 4],
  MAILBOX_BLUE: [7, 4],

  WATER_POND: [0, 5],
  SOCCER_BALL: [1, 5],
  CRATE_WOOD: [2, 5],
  ASPHALT_ROAD: [3, 5],
  ROAD_STRIPE: [4, 5],
  SIDEWALK_CURB: [5, 5],
  BUILDING_GLASS: [6, 5],
  BUILDING_CONCRETE: [7, 5],

  AWNING_STRIPE: [0, 6],
  CROSSWALK: [1, 6],
  FOUNTAIN_WATER: [2, 6],
  COURT_TURF: [3, 6],
  SIGN_TECH_HUB: [4, 6],
  FENCE_WHITE: [5, 6],
  CAR_BODY: [6, 6],
  POOKALAM_TILE: [7, 6],

  TEA_CROP: [0, 7],
  SPACE_DOME: [1, 7],
  HEARTH_FIRE: [2, 7],
};

function makeRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Generates synchronized PBR Pixel-Art Atlases:
 * - Diffuse Albedo Map (32x32 pixel detail per tile)
 * - Tangent-Space Normal Map (derived from per-tile pixel heightmaps with zero edge bleeding)
 * - Roughness & Metalness Maps (matte grass/brick vs glossy wood/metal/glass/water)
 * - Emissive Map (monitors, arcade, windows, lanterns)
 * All bound to ONE shared MeshStandardMaterial for minimal WebGL draw calls.
 */
export function createPixelTextureAtlas() {
  const size = ATLAS_GRID_SIZE * TILE_PX;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = size;
  emissiveCanvas.height = size;
  const eCtx = emissiveCanvas.getContext('2d');
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, size, size);

  const heightBuf = new Float32Array(size * size).fill(0.5);
  const roughBuf = new Float32Array(size * size).fill(0.85);
  const metalBuf = new Float32Array(size * size).fill(0.0);

  const setTileMeta = (col, row, roughness, metalness = 0.0, height = 0.5) => {
    const ox = col * TILE_PX;
    const oy = row * TILE_PX;
    for (let y = 0; y < TILE_PX; y += 1) {
      for (let x = 0; x < TILE_PX; x += 1) {
        const idx = (oy + y) * size + (ox + x);
        roughBuf[idx] = roughness;
        metalBuf[idx] = metalness;
        heightBuf[idx] = height;
      }
    }
  };

  const px = (targetCtx, col, row, x, y, color, w = 1, h = 1, meta = null) => {
    targetCtx.fillStyle = color;
    targetCtx.fillRect(col * TILE_PX + x, row * TILE_PX + y, w, h);
    if (meta && targetCtx === ctx) {
      const ox = col * TILE_PX;
      const oy = row * TILE_PX;
      for (let dy = 0; dy < h; dy += 1) {
        for (let dx = 0; dx < w; dx += 1) {
          const tx = ox + x + dx;
          const ty = oy + y + dy;
          if (tx >= 0 && tx < size && ty >= 0 && ty < size) {
            const idx = ty * size + tx;
            if (meta.h !== undefined) heightBuf[idx] = meta.h;
            if (meta.r !== undefined) roughBuf[idx] = meta.r;
            if (meta.m !== undefined) metalBuf[idx] = meta.m;
          }
        }
      }
    }
  };

  const drawTileBase = (col, row, color, roughness = 0.85, metalness = 0.0, height = 0.5) => {
    px(ctx, col, row, 0, 0, color, TILE_PX, TILE_PX);
    setTileMeta(col, row, roughness, metalness, height);
  };

  const paintNoiseTile = (col, row, palette, seed, roughness = 0.85, metalness = 0.0, heightRange = [0.35, 0.7]) => {
    const rand = makeRand(seed);
    for (let y = 0; y < TILE_PX; y += 1) {
      for (let x = 0; x < TILE_PX; x += 1) {
        const r = rand();
        const idx = Math.floor(r * palette.length);
        const h = heightRange[0] + r * (heightRange[1] - heightRange[0]);
        px(ctx, col, row, x, y, palette[idx], 1, 1, { h, r: roughness, m: metalness });
      }
    }
  };

  // === ROW 0: Terrain, Floors & Interior Walls ===
  paintNoiseTile(...TILES.GRASS, ['#3f7d34', '#498f3c', '#38702e', '#569e46', '#4c943e'], 101, 0.94, 0.0, [0.25, 0.75]);
  // Grass blade highlights
  for (let i = 0; i < 14; i += 1) {
    px(ctx, ...TILES.GRASS, (i * 7 + 3) % 30, (i * 11 + 2) % 30, '#6bbf59', 1, 2, { h: 0.88 });
  }

  paintNoiseTile(...TILES.GRASS_FLOWER, ['#3f7d34', '#498f3c', '#38702e', '#569e46'], 102, 0.92, 0.0, [0.3, 0.7]);
  const flowers = [[5, 6, '#fde047'], [21, 9, '#f472b6'], [13, 22, '#ffffff'], [25, 25, '#fb923c']];
  for (const [fx, fy, fc] of flowers) {
    px(ctx, ...TILES.GRASS_FLOWER, fx, fy, fc, 3, 3, { h: 0.95 });
    px(ctx, ...TILES.GRASS_FLOWER, fx + 1, fy + 1, '#fef08a', 1, 1, { h: 1.0 });
  }

  // Cobblestone path with recessed mortar & specular bevels
  drawTileBase(...TILES.STONE_PATH, '#646973', 0.88, 0.05, 0.2);
  const stones = [
    [1, 1, 13, 13], [16, 1, 15, 10], [16, 13, 15, 18], [1, 16, 13, 15],
  ];
  for (const [sx, sy, sw, sh] of stones) {
    px(ctx, ...TILES.STONE_PATH, sx, sy, '#949aa6', sw, sh, { h: 0.72, r: 0.76 });
    px(ctx, ...TILES.STONE_PATH, sx, sy, '#aeb5c2', sw - 1, 2, { h: 0.85, r: 0.7 });
    px(ctx, ...TILES.STONE_PATH, sx + 1, sy + sh - 2, '#7b818c', sw - 1, 2, { h: 0.55, r: 0.82 });
  }

  // Polished hardwood floor planks with wood grain & plank grooves
  drawTileBase(...TILES.WOOD_FLOOR, '#b27848', 0.42, 0.05, 0.65);
  for (let y = 0; y < 32; y += 8) {
    px(ctx, ...TILES.WOOD_FLOOR, 0, y, '#6e4221', 32, 1, { h: 0.15, r: 0.8 });
    px(ctx, ...TILES.WOOD_FLOOR, 0, y + 1, '#cb8e5a', 32, 1, { h: 0.78, r: 0.36 });
    px(ctx, ...TILES.WOOD_FLOOR, (y * 3 + 7) % 28, y + 1, '#6e4221', 1, 7, { h: 0.18 });
    px(ctx, ...TILES.WOOD_FLOOR, (y * 5 + 3) % 24, y + 3, '#9e6639', 8, 2, { h: 0.6 });
    px(ctx, ...TILES.WOOD_FLOOR, (y * 2 + 12) % 22, y + 5, '#c28550', 6, 1, { h: 0.72 });
  }

  // Glossy Lab Tile with subtle bevel
  drawTileBase(...TILES.LAB_TILE, '#cbd5e1', 0.3, 0.12, 0.68);
  for (let y = 0; y < 32; y += 8) {
    for (let x = 0; x < 32; x += 8) {
      const even = ((x + y) / 8) % 2 === 0;
      px(ctx, ...TILES.LAB_TILE, x, y, even ? '#e2e8f0' : '#94a3b8', 8, 8, { h: 0.7, r: even ? 0.25 : 0.35 });
      px(ctx, ...TILES.LAB_TILE, x, y, '#64748b', 8, 1, { h: 0.2, r: 0.65 });
      px(ctx, ...TILES.LAB_TILE, x, y, '#64748b', 1, 8, { h: 0.2, r: 0.65 });
    }
  }

  // Arcade dark patterned carpet
  paintNoiseTile(...TILES.ARCADE_CARPET, ['#1e1836', '#261e45', '#19142e'], 106, 0.95, 0.0, [0.4, 0.6]);
  const neonDots = [[5, 6, '#ec4899'], [18, 9, '#38bdf8'], [11, 22, '#facc15'], [25, 24, '#4ade80']];
  for (const [nx, ny, nc] of neonDots) {
    px(ctx, ...TILES.ARCADE_CARPET, nx, ny, nc, 3, 3, { h: 0.75 });
    px(eCtx, ...TILES.ARCADE_CARPET, nx, ny, nc, 2, 2);
  }

  paintNoiseTile(...TILES.WALL_CREAM, ['#efe6d5', '#e9dec9', '#f5efe2'], 107, 0.85, 0.0, [0.46, 0.54]);
  drawTileBase(...TILES.WALL_WAINSCOT, '#efe6d5', 0.82, 0.0, 0.5);
  px(ctx, ...TILES.WALL_WAINSCOT, 0, 20, '#7c5338', 32, 12, { h: 0.65, r: 0.55 });
  px(ctx, ...TILES.WALL_WAINSCOT, 0, 19, '#5e3d28', 32, 2, { h: 0.85, r: 0.45 });
  px(ctx, ...TILES.WALL_WAINSCOT, 4, 22, '#8f6345', 10, 8, { h: 0.78, r: 0.5 });
  px(ctx, ...TILES.WALL_WAINSCOT, 18, 22, '#8f6345', 10, 8, { h: 0.78, r: 0.5 });

  // === ROW 1: Brick, Shingles, Wood, Sofa, Rugs ===
  drawTileBase(...TILES.WALL_BRICK, '#d6c7b8', 0.92, 0.0, 0.22); // mortar base
  for (let rowIdx = 0; rowIdx < 4; rowIdx += 1) {
    const by = rowIdx * 8 + 1;
    const offset = rowIdx % 2 === 0 ? 0 : 8;
    for (let bx = -offset; bx < 32; bx += 16) {
      const startX = Math.max(0, bx + 1);
      const endX = Math.min(32, bx + 15);
      if (endX > startX) {
        const w = endX - startX;
        px(ctx, ...TILES.WALL_BRICK, startX, by, rowIdx % 2 === 0 ? '#b25642' : '#a34c39', w, 6, { h: 0.78, r: 0.82 });
        px(ctx, ...TILES.WALL_BRICK, startX, by, '#c96b55', w, 1, { h: 0.9, r: 0.75 });
        px(ctx, ...TILES.WALL_BRICK, startX, by + 5, '#8a3e2e', w, 1, { h: 0.62, r: 0.88 });
      }
    }
  }

  // Layered roof shingles
  drawTileBase(...TILES.ROOF_SHINGLE, '#632226', 0.85, 0.05, 0.25);
  for (let y = 0; y < 32; y += 8) {
    px(ctx, ...TILES.ROOF_SHINGLE, 0, y, '#8f3539', 32, 6, { h: 0.75, r: 0.78 });
    px(ctx, ...TILES.ROOF_SHINGLE, 0, y + 6, '#50191c', 32, 2, { h: 0.2, r: 0.9 });
    for (let x = (y === 8 || y === 24 ? 8 : 0); x < 32; x += 16) {
      px(ctx, ...TILES.ROOF_SHINGLE, x, y, '#50191c', 1, 6, { h: 0.2 });
      px(ctx, ...TILES.ROOF_SHINGLE, x + 2, y + 1, '#ab4549', 10, 2, { h: 0.85 });
    }
  }

  paintNoiseTile(...TILES.WOOD_OAK, ['#a87041', '#9a6436', '#b67d4c'], 203, 0.56, 0.02, [0.45, 0.62]);
  paintNoiseTile(...TILES.WOOD_WALNUT, ['#5e3a24', '#4d2e1b', '#6d452c'], 204, 0.5, 0.04, [0.45, 0.6]);
  paintNoiseTile(...TILES.SOFA_FABRIC, ['#356599', '#3d72ab', '#2e5887', '#457db8'], 205, 0.94, 0.0, [0.42, 0.68]);
  paintNoiseTile(...TILES.SOFA_PILLOW, ['#f59e0b', '#fbbf24', '#d97706'], 206, 0.88, 0.0, [0.55, 0.8]);

  // Rugs
  drawTileBase(...TILES.RUG_WARM, '#9e3543', 0.94, 0.0, 0.45);
  px(ctx, ...TILES.RUG_WARM, 2, 2, '#f3c669', 28, 28, { h: 0.62 });
  px(ctx, ...TILES.RUG_WARM, 4, 4, '#802835', 24, 24, { h: 0.55 });
  px(ctx, ...TILES.RUG_WARM, 10, 10, '#e8dcc8', 12, 12, { h: 0.68 });
  px(ctx, ...TILES.RUG_WARM, 14, 14, '#3b82f6', 4, 4, { h: 0.72 });

  drawTileBase(...TILES.RUG_CORNER, '#245b69', 0.92, 0.0, 0.5);
  px(ctx, ...TILES.RUG_CORNER, 3, 3, '#64dfdf', 26, 26, { h: 0.65 });
  px(ctx, ...TILES.RUG_CORNER, 6, 6, '#1b4965', 20, 20, { h: 0.55 });

  // === ROW 2: Books & Glossy Emissive Screens ===
  const paintBooks = (tile, colors) => {
    drawTileBase(...tile, '#2f1c11', 0.75, 0.0, 0.2);
    let x = 2;
    for (const c of colors) {
      px(ctx, ...tile, x, 2, c, 5, 28, { h: 0.82, r: 0.55 });
      px(ctx, ...tile, x + 1, 2, '#ffffff33', 1, 28, { h: 0.9 });
      px(ctx, ...tile, x + 1, 8, '#f8fafc', 3, 4, { h: 0.88 });
      x += 6;
    }
  };
  paintBooks(TILES.BOOK_RED, ['#ef4444', '#f97316', '#dc2626', '#fbbf24', '#e11d48']);
  paintBooks(TILES.BOOK_BLUE, ['#3b82f6', '#06b6d4', '#6366f1', '#60a5fa', '#2563eb']);
  paintBooks(TILES.BOOK_GREEN, ['#22c55e', '#10b981', '#84cc16', '#16a34a', '#14b8a6']);
  paintBooks(TILES.BOOK_GOLD, ['#eab308', '#f59e0b', '#a855f7', '#ec4899', '#facc15']);

  // Glossy code monitor
  drawTileBase(...TILES.MONITOR_CODE, '#1e293b', 0.35, 0.5, 0.85);
  px(ctx, ...TILES.MONITOR_CODE, 2, 2, '#091120', 28, 24, { h: 0.4, r: 0.12, m: 0.1 });
  px(ctx, ...TILES.MONITOR_CODE, 4, 6, '#22c55e', 14, 2);
  px(ctx, ...TILES.MONITOR_CODE, 4, 10, '#38bdf8', 20, 2);
  px(ctx, ...TILES.MONITOR_CODE, 8, 14, '#f472b6', 12, 2);
  px(ctx, ...TILES.MONITOR_CODE, 4, 18, '#facc15', 16, 2);
  px(eCtx, ...TILES.MONITOR_CODE, 2, 2, '#0d2538', 28, 24);
  px(eCtx, ...TILES.MONITOR_CODE, 4, 6, '#22c55e', 14, 2);
  px(eCtx, ...TILES.MONITOR_CODE, 4, 10, '#38bdf8', 20, 2);
  px(eCtx, ...TILES.MONITOR_CODE, 8, 14, '#f472b6', 12, 2);
  px(eCtx, ...TILES.MONITOR_CODE, 4, 18, '#facc15', 16, 2);

  // Retro TV screen
  drawTileBase(...TILES.TV_SCREEN, '#18181b', 0.38, 0.4, 0.82);
  px(ctx, ...TILES.TV_SCREEN, 2, 2, '#1e3a8a', 28, 24, { h: 0.42, r: 0.12 });
  px(ctx, ...TILES.TV_SCREEN, 4, 6, '#38bdf8', 10, 6);
  px(ctx, ...TILES.TV_SCREEN, 16, 6, '#f43f5e', 12, 6);
  px(ctx, ...TILES.TV_SCREEN, 4, 16, '#4ade80', 24, 6);
  px(eCtx, ...TILES.TV_SCREEN, 2, 2, '#1e3a8a', 28, 24);
  px(eCtx, ...TILES.TV_SCREEN, 4, 6, '#38bdf8', 10, 6);
  px(eCtx, ...TILES.TV_SCREEN, 16, 6, '#f43f5e', 12, 6);
  px(eCtx, ...TILES.TV_SCREEN, 4, 16, '#4ade80', 24, 6);

  // Arcade screen & side
  drawTileBase(...TILES.ARCADE_SCREEN, '#090d16', 0.15, 0.1, 0.45);
  px(ctx, ...TILES.ARCADE_SCREEN, 4, 4, '#22c55e', 12, 4);
  px(ctx, ...TILES.ARCADE_SCREEN, 20, 10, '#f43f5e', 4, 4);
  px(ctx, ...TILES.ARCADE_SCREEN, 12, 20, '#facc15', 8, 4);
  px(eCtx, ...TILES.ARCADE_SCREEN, 4, 4, '#22c55e', 12, 4);
  px(eCtx, ...TILES.ARCADE_SCREEN, 20, 10, '#f43f5e', 4, 4);
  px(eCtx, ...TILES.ARCADE_SCREEN, 12, 20, '#facc15', 8, 4);

  drawTileBase(...TILES.ARCADE_SIDE, '#312e81', 0.45, 0.2, 0.55);
  px(ctx, ...TILES.ARCADE_SIDE, 4, 4, '#ec4899', 4, 24, { h: 0.72 });
  px(ctx, ...TILES.ARCADE_SIDE, 10, 8, '#38bdf8', 4, 16, { h: 0.72 });
  px(eCtx, ...TILES.ARCADE_SIDE, 4, 4, '#701a45', 4, 24);

  // === ROW 3: Windows, Doors, Nature, Brushed Metal, Mirror ===
  drawTileBase(...TILES.WINDOW_DAY, '#5e3d28', 0.55, 0.05, 0.85);
  px(ctx, ...TILES.WINDOW_DAY, 4, 4, '#93c5fd', 10, 10, { h: 0.3, r: 0.08, m: 0.15 });
  px(ctx, ...TILES.WINDOW_DAY, 18, 4, '#93c5fd', 10, 10, { h: 0.3, r: 0.08, m: 0.15 });
  px(ctx, ...TILES.WINDOW_DAY, 4, 18, '#bae6fd', 10, 10, { h: 0.3, r: 0.08, m: 0.15 });
  px(ctx, ...TILES.WINDOW_DAY, 18, 18, '#bae6fd', 10, 10, { h: 0.3, r: 0.08, m: 0.15 });

  drawTileBase(...TILES.WINDOW_NIGHT, '#4a2f1d', 0.52, 0.05, 0.85);
  px(ctx, ...TILES.WINDOW_NIGHT, 4, 4, '#fcd34d', 10, 10, { h: 0.3, r: 0.1 });
  px(ctx, ...TILES.WINDOW_NIGHT, 18, 4, '#fcd34d', 10, 10, { h: 0.3, r: 0.1 });
  px(ctx, ...TILES.WINDOW_NIGHT, 4, 18, '#fde68a', 10, 10, { h: 0.3, r: 0.1 });
  px(ctx, ...TILES.WINDOW_NIGHT, 18, 18, '#fde68a', 10, 10, { h: 0.3, r: 0.1 });
  px(eCtx, ...TILES.WINDOW_NIGHT, 4, 4, '#f59e0b', 10, 10);
  px(eCtx, ...TILES.WINDOW_NIGHT, 18, 4, '#f59e0b', 10, 10);
  px(eCtx, ...TILES.WINDOW_NIGHT, 4, 18, '#fbbf24', 10, 10);
  px(eCtx, ...TILES.WINDOW_NIGHT, 18, 18, '#fbbf24', 10, 10);

  drawTileBase(...TILES.DOOR_WOOD, '#74482a', 0.58, 0.04, 0.65);
  px(ctx, ...TILES.DOOR_WOOD, 4, 4, '#8b5734', 24, 10, { h: 0.42 });
  px(ctx, ...TILES.DOOR_WOOD, 4, 18, '#8b5734', 24, 10, { h: 0.42 });
  px(ctx, ...TILES.DOOR_WOOD, 24, 16, '#facc15', 4, 4, { h: 0.95, r: 0.2, m: 0.85 });

  paintNoiseTile(...TILES.LEAF_OAK, ['#245732', '#2d6a3e', '#3a824d', '#49985b', '#60b06f'], 404, 0.88, 0.0, [0.2, 0.92]);
  paintNoiseTile(...TILES.TRUNK_BARK, ['#5c371e', '#6b4226', '#7b4d2e', '#4b2c17'], 405, 0.92, 0.0, [0.25, 0.85]);
  paintNoiseTile(...TILES.METAL_DARK, ['#334155', '#1e293b', '#475569'], 406, 0.32, 0.72, [0.45, 0.6]);
  paintNoiseTile(...TILES.METAL_ACCENT, ['#64748b', '#94a3b8', '#475569'], 407, 0.26, 0.82, [0.45, 0.62]);

  drawTileBase(...TILES.MIRROR_GLASS, '#64748b', 0.25, 0.85, 0.82);
  px(ctx, ...TILES.MIRROR_GLASS, 4, 4, '#bae6fd', 24, 24, { h: 0.35, r: 0.05, m: 0.92 });
  px(ctx, ...TILES.MIRROR_GLASS, 8, 6, '#ffffff', 4, 12, { h: 0.36 });
  px(ctx, ...TILES.MIRROR_GLASS, 14, 10, '#e0f2fe', 2, 8, { h: 0.36 });
  px(eCtx, ...TILES.MIRROR_GLASS, 4, 4, '#1e3a5f', 24, 24);

  // === ROW 4: Props ===
  paintNoiseTile(...TILES.SUNDIAL_STONE, ['#cbd5e1', '#94a3b8', '#e2e8f0'], 501, 0.78, 0.08, [0.4, 0.78]);
  drawTileBase(...TILES.LANTERN_GLOW, '#fde047', 0.35, 0.05, 0.7);
  px(ctx, ...TILES.LANTERN_GLOW, 6, 6, '#fef9c3', 20, 20, { h: 0.85 });
  px(eCtx, ...TILES.LANTERN_GLOW, 0, 0, '#fbbf24', 32, 32);

  drawTileBase(...TILES.POSTER_AI, '#0f172a', 0.45, 0.1, 0.55);
  px(ctx, ...TILES.POSTER_AI, 4, 4, '#38bdf8', 24, 4);
  px(ctx, ...TILES.POSTER_AI, 8, 12, '#a855f7', 16, 12);
  px(eCtx, ...TILES.POSTER_AI, 8, 12, '#6d28d9', 16, 12);

  drawTileBase(...TILES.POSTER_UAV, '#14532d', 0.45, 0.1, 0.55);
  px(ctx, ...TILES.POSTER_UAV, 4, 14, '#4ade80', 24, 4);
  px(ctx, ...TILES.POSTER_UAV, 14, 4, '#4ade80', 4, 24);
  px(eCtx, ...TILES.POSTER_UAV, 14, 14, '#22c55e', 4, 4);

  drawTileBase(...TILES.TROPHY_GOLD, '#713f12', 0.3, 0.85, 0.65);
  px(ctx, ...TILES.TROPHY_GOLD, 6, 4, '#facc15', 20, 16, { h: 0.9, r: 0.18, m: 0.95 });
  px(ctx, ...TILES.TROPHY_GOLD, 12, 20, '#eab308', 8, 8, { h: 0.85, r: 0.22, m: 0.92 });
  px(eCtx, ...TILES.TROPHY_GOLD, 8, 6, '#854d0e', 16, 8);

  drawTileBase(...TILES.DRONE_BODY, '#1e293b', 0.32, 0.65, 0.68);
  px(ctx, ...TILES.DRONE_BODY, 6, 6, '#f97316', 20, 20, { h: 0.85, r: 0.28, m: 0.4 });
  px(ctx, ...TILES.DRONE_BODY, 12, 12, '#38bdf8', 8, 8, { h: 0.9, r: 0.1, m: 0.2 });
  px(eCtx, ...TILES.DRONE_BODY, 12, 12, '#38bdf8', 8, 8);

  drawTileBase(...TILES.SERVER_RACK, '#0f172a', 0.35, 0.72, 0.62);
  for (let y = 4; y < 28; y += 6) {
    px(ctx, ...TILES.SERVER_RACK, 4, y, '#334155', 24, 4, { h: 0.78, m: 0.75 });
    px(ctx, ...TILES.SERVER_RACK, 6, y + 1, '#22c55e', 4, 2);
    px(ctx, ...TILES.SERVER_RACK, 12, y + 1, '#38bdf8', 4, 2);
    px(eCtx, ...TILES.SERVER_RACK, 6, y + 1, '#22c55e', 4, 2);
    px(eCtx, ...TILES.SERVER_RACK, 12, y + 1, '#38bdf8', 4, 2);
  }

  drawTileBase(...TILES.MAILBOX_BLUE, '#1d4ed8', 0.35, 0.65, 0.65);
  px(ctx, ...TILES.MAILBOX_BLUE, 4, 8, '#f8fafc', 24, 6, { h: 0.7 });
  px(ctx, ...TILES.MAILBOX_BLUE, 22, 4, '#ef4444', 6, 4, { h: 0.9 });

  // === ROW 5: Water Pond, Soccer Ball, Physics Wooden Crate ===
  paintNoiseTile(...TILES.WATER_POND, ['#0284c7', '#0ea5e9', '#38bdf8', '#0369a1'], 601, 0.06, 0.25, [0.35, 0.65]);
  px(ctx, ...TILES.WATER_POND, 5, 7, '#bae6fd', 8, 2, { h: 0.8 });
  px(ctx, ...TILES.WATER_POND, 18, 20, '#e0f2fe', 7, 2, { h: 0.8 });

  // Classic checkered pixel soccer ball
  drawTileBase(...TILES.SOCCER_BALL, '#f8fafc', 0.48, 0.05, 0.7);
  px(ctx, ...TILES.SOCCER_BALL, 4, 4, '#0f172a', 8, 8, { h: 0.65 });
  px(ctx, ...TILES.SOCCER_BALL, 20, 4, '#0f172a', 8, 8, { h: 0.65 });
  px(ctx, ...TILES.SOCCER_BALL, 12, 12, '#0f172a', 8, 8, { h: 0.65 });
  px(ctx, ...TILES.SOCCER_BALL, 4, 20, '#0f172a', 8, 8, { h: 0.65 });
  px(ctx, ...TILES.SOCCER_BALL, 20, 20, '#0f172a', 8, 8, { h: 0.65 });

  // Physics Wooden Crate with diagonal brace
  drawTileBase(...TILES.CRATE_WOOD, '#9a6234', 0.72, 0.02, 0.55);
  px(ctx, ...TILES.CRATE_WOOD, 0, 0, '#6e4221', 32, 4, { h: 0.85 });
  px(ctx, ...TILES.CRATE_WOOD, 0, 28, '#6e4221', 32, 4, { h: 0.85 });
  px(ctx, ...TILES.CRATE_WOOD, 0, 0, '#6e4221', 4, 32, { h: 0.85 });
  px(ctx, ...TILES.CRATE_WOOD, 28, 0, '#6e4221', 4, 32, { h: 0.85 });
  for (let i = 4; i < 28; i += 2) {
    px(ctx, ...TILES.CRATE_WOOD, i, i, '#7c4c27', 3, 3, { h: 0.72 });
  }

  // Asphalt Road & Center Yellow Stripe
  paintNoiseTile(...TILES.ASPHALT_ROAD, ['#262b36', '#2e3440', '#21252e', '#323846'], 604, 0.9, 0.05, [0.4, 0.6]);
  paintNoiseTile(...TILES.ROAD_STRIPE, ['#262b36', '#2e3440', '#21252e'], 605, 0.9, 0.05, [0.4, 0.6]);
  px(ctx, ...TILES.ROAD_STRIPE, 4, 14, '#facc15', 10, 4, { h: 0.65, r: 0.7 });
  px(ctx, ...TILES.ROAD_STRIPE, 18, 14, '#facc15', 10, 4, { h: 0.65, r: 0.7 });

  // Concrete Sidewalk Pavers
  drawTileBase(...TILES.SIDEWALK_CURB, '#9aa3b2', 0.82, 0.04, 0.4);
  for (let y = 0; y < 32; y += 16) {
    for (let x = 0; x < 32; x += 16) {
      px(ctx, ...TILES.SIDEWALK_CURB, x + 1, y + 1, '#bcc4d1', 14, 14, { h: 0.72, r: 0.75 });
      px(ctx, ...TILES.SIDEWALK_CURB, x + 1, y + 1, '#cfd6e0', 14, 2, { h: 0.82 });
    }
  }

  // City Skyscraper Glass Curtain Wall (lit windows at night!)
  drawTileBase(...TILES.BUILDING_GLASS, '#1e293b', 0.28, 0.65, 0.85);
  for (let wy = 3; wy < 30; wy += 9) {
    for (let wx = 3; wx < 30; wx += 9) {
      const lit = (wx + wy) % 18 === 6;
      px(ctx, ...TILES.BUILDING_GLASS, wx, wy, lit ? '#fef08a' : '#38bdf8', 6, 6, { h: 0.35, r: 0.08, m: 0.2 });
      if (lit) px(eCtx, ...TILES.BUILDING_GLASS, wx, wy, '#fbbf24', 6, 6);
      else px(eCtx, ...TILES.BUILDING_GLASS, wx, wy, '#0c4a6e', 6, 6);
    }
  }

  // City Concrete Architectural Panel
  paintNoiseTile(...TILES.BUILDING_CONCRETE, ['#cbd5e1', '#b6c2d1', '#dbe3ee'], 608, 0.84, 0.05, [0.45, 0.6]);
  for (let wy = 5; wy < 28; wy += 11) {
    for (let wx = 4; wx < 28; wx += 12) {
      px(ctx, ...TILES.BUILDING_CONCRETE, wx, wy, '#334155', 8, 7, { h: 0.25, r: 0.12 });
      px(ctx, ...TILES.BUILDING_CONCRETE, wx + 1, wy + 1, '#93c5fd', 6, 5, { h: 0.3, r: 0.08 });
      if ((wx + wy) % 2 === 0) px(eCtx, ...TILES.BUILDING_CONCRETE, wx + 1, wy + 1, '#fde68a', 6, 5);
    }
  }

  // === ROW 6: Cafe Awning, Crosswalk, Fountain, Turf, Tech Sign, Fence, Car ===
  for (let x = 0; x < 32; x += 8) {
    px(ctx, ...TILES.AWNING_STRIPE, x, 0, '#dc2626', 4, 32, { h: 0.72, r: 0.82 });
    px(ctx, ...TILES.AWNING_STRIPE, x + 4, 0, '#fef2f2', 4, 32, { h: 0.65, r: 0.82 });
  }

  paintNoiseTile(...TILES.CROSSWALK, ['#262b36', '#2e3440'], 702, 0.88, 0.04, [0.4, 0.55]);
  for (let x = 2; x < 30; x += 8) {
    px(ctx, ...TILES.CROSSWALK, x, 2, '#f8fafc', 5, 28, { h: 0.65, r: 0.7 });
  }

  paintNoiseTile(...TILES.FOUNTAIN_WATER, ['#0ea5e9', '#38bdf8', '#7dd3fc'], 703, 0.05, 0.3, [0.3, 0.8]);
  px(ctx, ...TILES.FOUNTAIN_WATER, 8, 10, '#f0f9ff', 10, 3, { h: 0.9 });

  paintNoiseTile(...TILES.COURT_TURF, ['#15803d', '#16a34a', '#166534'], 704, 0.92, 0.0, [0.4, 0.6]);
  px(ctx, ...TILES.COURT_TURF, 0, 15, '#ffffff', 32, 2, { h: 0.62 });

  drawTileBase(...TILES.SIGN_TECH_HUB, '#0f172a', 0.35, 0.3, 0.65);
  px(ctx, ...TILES.SIGN_TECH_HUB, 2, 2, '#38bdf8', 28, 4);
  px(ctx, ...TILES.SIGN_TECH_HUB, 2, 26, '#ec4899', 28, 4);
  px(ctx, ...TILES.SIGN_TECH_HUB, 6, 12, '#facc15', 20, 8);
  px(eCtx, ...TILES.SIGN_TECH_HUB, 2, 2, '#38bdf8', 28, 4);
  px(eCtx, ...TILES.SIGN_TECH_HUB, 2, 26, '#ec4899', 28, 4);
  px(eCtx, ...TILES.SIGN_TECH_HUB, 6, 12, '#facc15', 20, 8);

  paintNoiseTile(...TILES.FENCE_WHITE, ['#f8fafc', '#e2e8f0', '#f1f5f9'], 706, 0.65, 0.02, [0.55, 0.72]);
  px(ctx, ...TILES.FENCE_WHITE, 0, 0, '#cbd5e1', 32, 2, { h: 0.4 });

  drawTileBase(...TILES.CAR_BODY, '#ef4444', 0.22, 0.45, 0.7);
  px(ctx, ...TILES.CAR_BODY, 4, 4, '#93c5fd', 24, 10, { h: 0.5, r: 0.08, m: 0.2 });

  // Kerala Onam Pookalam Floral Mosaic (mohil-c-mbc-pookalam-24)
  drawTileBase(...TILES.POOKALAM_TILE, '#fef08a', 0.85, 0.0, 0.6);
  px(ctx, ...TILES.POOKALAM_TILE, 2, 2, '#f97316', 28, 28, { h: 0.7 });
  px(ctx, ...TILES.POOKALAM_TILE, 6, 6, '#ec4899', 20, 20, { h: 0.76 });
  px(ctx, ...TILES.POOKALAM_TILE, 10, 10, '#22c55e', 12, 12, { h: 0.8 });
  px(ctx, ...TILES.POOKALAM_TILE, 13, 13, '#facc15', 6, 6, { h: 0.88 });

  // === ROW 7: Tea / AgriVision Crops, NASA Space Dome, Living Hearth ===
  paintNoiseTile(...TILES.TEA_CROP, ['#15803d', '#22c55e', '#4ade80', '#166534'], 801, 0.88, 0.0, [0.35, 0.9]);
  for (let y = 4; y < 30; y += 8) {
    px(ctx, ...TILES.TEA_CROP, 0, y, '#3f6212', 32, 2, { h: 0.2 });
    px(ctx, ...TILES.TEA_CROP, 6, y - 2, '#fde047', 3, 2, { h: 0.95 });
  }

  drawTileBase(...TILES.SPACE_DOME, '#e2e8f0', 0.28, 0.65, 0.7);
  px(ctx, ...TILES.SPACE_DOME, 4, 4, '#0f172a', 24, 6, { h: 0.35, r: 0.1 });
  px(ctx, ...TILES.SPACE_DOME, 10, 16, '#38bdf8', 12, 10, { h: 0.45, r: 0.15 });
  px(eCtx, ...TILES.SPACE_DOME, 10, 16, '#0ea5e9', 12, 10);

  drawTileBase(...TILES.HEARTH_FIRE, '#334155', 0.85, 0.1, 0.6);
  px(ctx, ...TILES.HEARTH_FIRE, 6, 8, '#0f172a', 20, 22, { h: 0.2 });
  px(ctx, ...TILES.HEARTH_FIRE, 10, 14, '#f97316', 12, 14, { h: 0.4 });
  px(ctx, ...TILES.HEARTH_FIRE, 13, 18, '#facc15', 6, 10, { h: 0.45 });
  px(eCtx, ...TILES.HEARTH_FIRE, 10, 14, '#ea580c', 12, 14);
  px(eCtx, ...TILES.HEARTH_FIRE, 13, 18, '#fde047', 6, 10);

  // Generate Tangent-Space Normal Canvas & Roughness/Metalness Canvas
  const normalCanvas = buildNormalCanvasFromHeight(heightBuf, size, 3.2);
  const roughCanvas = buildChannelCanvas(roughBuf, size);
  const metalCanvas = buildChannelCanvas(metalBuf, size);

  const makeTex = (cvs, isSRGB) => {
    const t = new THREE.CanvasTexture(cvs);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  };

  const map = makeTex(canvas, true);
  const emissiveMap = makeTex(emissiveCanvas, true);
  const normalMap = makeTex(normalCanvas, false);
  const roughnessMap = makeTex(roughCanvas, false);
  const metalnessMap = makeTex(metalCanvas, false);

  const sharedMaterial = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    normalScale: new THREE.Vector2(1.05, 1.05),
    roughnessMap,
    roughness: 1.0,
    metalnessMap,
    metalness: 1.0,
    emissiveMap,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.75,
    flatShading: true,
  });

  return { map, normalMap, roughnessMap, metalnessMap, emissiveMap, sharedMaterial, canvas };
}

function buildNormalCanvasFromHeight(heightBuf, size, strength = 3.0) {
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const nCtx = normalCanvas.getContext('2d');
  const img = nCtx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    const tileY0 = Math.floor(y / TILE_PX) * TILE_PX;
    const tileY1 = tileY0 + TILE_PX - 1;
    const ym = Math.max(tileY0, y - 1);
    const yp = Math.min(tileY1, y + 1);

    for (let x = 0; x < size; x += 1) {
      const tileX0 = Math.floor(x / TILE_PX) * TILE_PX;
      const tileX1 = tileX0 + TILE_PX - 1;
      const xm = Math.max(tileX0, x - 1);
      const xp = Math.min(tileX1, x + 1);

      const hL = heightBuf[y * size + xm];
      const hR = heightBuf[y * size + xp];
      const hU = heightBuf[ym * size + x];
      const hD = heightBuf[yp * size + x];

      const dx = (hL - hR) * strength;
      const dy = (hU - hD) * strength;
      const dz = 1.0;
      const invLen = 1 / Math.hypot(dx, dy, dz);

      const outIdx = (y * size + x) * 4;
      img.data[outIdx] = Math.round(((dx * invLen) * 0.5 + 0.5) * 255);
      img.data[outIdx + 1] = Math.round(((dy * invLen) * 0.5 + 0.5) * 255);
      img.data[outIdx + 2] = Math.round(((dz * invLen) * 0.5 + 0.5) * 255);
      img.data[outIdx + 3] = 255;
    }
  }

  nCtx.putImageData(img, 0, 0);
  return normalCanvas;
}

function buildChannelCanvas(buf, size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const gCtx = c.getContext('2d');
  const img = gCtx.createImageData(size, size);
  for (let i = 0; i < size * size; i += 1) {
    const v = Math.max(0, Math.min(255, Math.round(buf[i] * 255)));
    const p = i * 4;
    img.data[p] = v;
    img.data[p + 1] = v;
    img.data[p + 2] = v;
    img.data[p + 3] = 255;
  }
  gCtx.putImageData(img, 0, 0);
  return c;
}

/**
 * Computes UV bounds [u0, v0, u1, v1] for a given tile [col, row] in the atlas.
 * Inserts half-texel inset to prevent bleeding on nearest-neighbor sampling.
 */
export function getTileUVBounds(tile, gridSize = ATLAS_GRID_SIZE, tilePx = TILE_PX) {
  const [col, row] = tile;
  const totalPx = gridSize * tilePx;
  const inset = 0.25 / totalPx;
  const step = 1 / gridSize;
  const u0 = col * step + inset;
  const u1 = (col + 1) * step - inset;
  const v1 = 1 - row * step - inset;
  const v0 = 1 - (row + 1) * step + inset;
  return { u0, v0, u1, v1 };
}

/**
 * Remaps BoxGeometry UVs so every face (or specific faces) samples cleanly from the atlas.
 * Face order in BoxGeometry: 0:+X, 1:-X, 2:+Y, 3:-Y, 4:+Z, 5:-Z
 */
export function applyAtlasUVs(geometry, faceTiles) {
  const uv = geometry.attributes.uv;
  if (!uv) return geometry;

  const getFaceTile = (faceIdx) => {
    if (Array.isArray(faceTiles[0])) {
      return faceTiles[faceIdx] || faceTiles[0];
    }
    return faceTiles;
  };

  for (let faceIdx = 0; faceIdx < 6; faceIdx += 1) {
    const tile = getFaceTile(faceIdx);
    const { u0, v0, u1, v1 } = getTileUVBounds(tile);
    const startVertex = faceIdx * 4;
    for (let i = 0; i < 4; i += 1) {
      const idx = startVertex + i;
      const origU = uv.getX(idx);
      const origV = uv.getY(idx);
      const mappedU = u0 + (u1 - u0) * (origU % 1 === 0 && origU > 0 ? 1 : origU % 1);
      const mappedV = v0 + (v1 - v0) * (origV % 1 === 0 && origV > 0 ? 1 : origV % 1);
      uv.setXY(idx, mappedU, mappedV);
    }
  }

  uv.needsUpdate = true;
  return geometry;
}
