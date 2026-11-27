import { describe, expect, it } from 'vitest';
import { detectRoomAt, INTERACTIVE_TRIGGERS, ROOMS } from '../src/world/HouseData.js';
import { findNearestTrigger, resolvePlayerCollisions } from '../src/world/TriggerSystem.js';

describe('Room detection, collision clamping, and proximity triggers', () => {
  it('identifies all house rooms, patio, neighborhood, and city zones accurately', () => {
    expect(detectRoomAt(0, 14.5).id).toBe('patio');
    expect(detectRoomAt(-6, 5).id).toBe('living');
    expect(detectRoomAt(-6, -5).id).toBe('study');
    expect(detectRoomAt(6, -5).id).toBe('lab');
    expect(detectRoomAt(6, 5).id).toBe('arcade');
    expect(detectRoomAt(0, 24).id).toBe('avenue');
    expect(detectRoomAt(0, 34).id).toBe('city-plaza');
    expect(detectRoomAt(31, 15).id).toBe('byte-cafe');
    expect(detectRoomAt(-34, 14).id).toBe('city-park');
    expect(detectRoomAt(32, 35.5).id).toBe('downtown-skyline');
  });

  it('keeps every room spawn point inside its room bounds and collision-free', () => {
    for (const room of ROOMS) {
      expect(detectRoomAt(room.spawn.x, room.spawn.z).id).toBe(room.id);
      const resolved = resolvePlayerCollisions(room.spawn.x, room.spawn.z);
      expect(resolved.x).toBeCloseTo(room.spawn.x, 4);
      expect(resolved.z).toBeCloseTo(room.spawn.z, 4);
    }
  });

  it('keeps every interactive trigger reachable and unobstructed', () => {
    for (const trigger of INTERACTIVE_TRIGGERS) {
      const resolved = resolvePlayerCollisions(trigger.x, trigger.z);
      expect(resolved.x).toBeCloseTo(trigger.x, 4);
      expect(resolved.z).toBeCloseTo(trigger.z, 4);
      expect(findNearestTrigger(trigger.x, trigger.z)?.id).toBe(trigger.id);
    }
  });

  it('allows walking cleanly through all doorways and blocks solid walls', () => {
    const doorwayPoints = [
      [0, 10.0], // Patio <-> Foyer (South entrance)
      [0, 8.2], // Foyer clear behind entrance
      [0, 18.0], // Homestead front gate -> City Avenue
      [0, 24.0], // Avenue crosswalk -> City Plaza
      [-18.0, 5.0], // Homestead West garden gate -> Sports Park
      [18.0, 5.0], // Homestead East garden gate -> Byte Cafe
      [-6.1, 0.0], // Living <-> Study
      [0.0, -4.5], // Study <-> AI Lab
      [6.1, 0.0], // AI Lab <-> Arcade
      [0.0, 4.0], // Living <-> Arcade
    ];

    for (const [dx, dz] of doorwayPoints) {
      const res = resolvePlayerCollisions(dx, dz);
      expect(res.x).toBeCloseTo(dx, 3);
      expect(res.z).toBeCloseTo(dz, 3);
    }

    // Walking into solid North back wall at Z=-10 (open wall at X=-2.0) must push back inside room
    const pushed = resolvePlayerCollisions(-2.0, -9.5);
    expect(pushed.z).toBeGreaterThan(-9.35);
  });

  it('activates proximity triggers when approaching objects like bookshelf or sofa', () => {
    const bookshelf = INTERACTIVE_TRIGGERS.find((t) => t.id === 'bookshelf');
    const sofa = INTERACTIVE_TRIGGERS.find((t) => t.id === 'sofa');

    expect(findNearestTrigger(bookshelf.x, bookshelf.z)?.id).toBe('bookshelf');
    expect(findNearestTrigger(sofa.x, sofa.z)?.id).toBe('sofa');
    expect(findNearestTrigger(0, 16.5)).toBeNull();
  });
});
