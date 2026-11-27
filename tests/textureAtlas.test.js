import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyAtlasUVs, ATLAS_GRID_SIZE, getTileUVBounds, TILES } from '../src/engine/TextureAtlas.js';

describe('TextureAtlas UV mapping', () => {
  it('computes non-overlapping tile UV bounds inside [0, 1]', () => {
    const grass = getTileUVBounds(TILES.GRASS);
    const brick = getTileUVBounds(TILES.WALL_BRICK);

    expect(grass.u0).toBeGreaterThan(0);
    expect(grass.u1).toBeLessThan(1 / ATLAS_GRID_SIZE);
    expect(grass.v1).toBeLessThanOrEqual(1);
    expect(grass.v0).toBeGreaterThan(1 - 1 / ATLAS_GRID_SIZE);

    expect(brick.v1).toBeLessThan(grass.v0);
  });

  it('remaps BoxGeometry UVs into the requested atlas tile bounds', () => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    applyAtlasUVs(geo, TILES.BOOK_BLUE);
    const bounds = getTileUVBounds(TILES.BOOK_BLUE);
    const uv = geo.attributes.uv;

    for (let i = 0; i < uv.count; i += 1) {
      const u = uv.getX(i);
      const v = uv.getY(i);
      expect(u).toBeGreaterThanOrEqual(bounds.u0 - 1e-6);
      expect(u).toBeLessThanOrEqual(bounds.u1 + 1e-6);
      expect(v).toBeGreaterThanOrEqual(bounds.v0 - 1e-6);
      expect(v).toBeLessThanOrEqual(bounds.v1 + 1e-6);
    }
  });
});
