import { describe, expect, it } from 'vitest';
import { createPortfolioStore } from '../src/state/store.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}

describe('Portfolio Store', () => {
  it('persists avatar customization and environment toggles across reloads', () => {
    const storage = createMemoryStorage();
    const store1 = createPortfolioStore({ storage });

    store1.updateAvatar({ hairStyle: 'mohawk', outfitColor: '#ef4444' });
    expect(store1.cycleTimeOfDay()).toBe('sunset');
    expect(store1.cycleTimeOfDay()).toBe('night');
    expect(store1.toggleCameraMode()).toBe('firstPerson');
    expect(store1.recordHighScore('snakeHighScore', 80)).toBe(true);
    expect(store1.recordHighScore('snakeHighScore', 50)).toBe(false);

    const store2 = createPortfolioStore({ storage });
    expect(store2.getState().avatar.hairStyle).toBe('mohawk');
    expect(store2.getState().avatar.outfitColor).toBe('#ef4444');
    expect(store2.getState().environment.timeOfDay).toBe('night');
    expect(store2.getState().environment.cameraMode).toBe('firstPerson');
    expect(store2.getState().games.snakeHighScore).toBe(80);
  });

  it('notifies subscribers only when world state actually changes', () => {
    const store = createPortfolioStore({ storage: null });
    let calls = 0;
    store.subscribe(() => {
      calls += 1;
    });

    store.setWorldState({ activeRoomId: 'study' });
    store.setWorldState({ activeRoomId: 'study' });
    expect(calls).toBe(1);
  });
});
