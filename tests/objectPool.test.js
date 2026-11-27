import { describe, expect, it } from 'vitest';
import { ObjectPool } from '../src/engine/ObjectPool.js';

describe('ObjectPool', () => {
  it('pre-allocates initial instances and recycles them with zero extra allocations', () => {
    let created = 0;
    const pool = new ObjectPool(
      () => ({ id: ++created, active: false }),
      (item) => {
        item.active = false;
      },
      4,
      8
    );

    expect(pool.getStats()).toEqual({
      active: 0,
      available: 4,
      totalCreated: 4,
      reuseCount: 0,
    });

    const a = pool.acquire();
    const b = pool.acquire();
    a.active = true;
    b.active = true;

    expect(pool.getStats().active).toBe(2);
    expect(pool.getStats().available).toBe(2);
    expect(pool.getStats().totalCreated).toBe(4);
    expect(pool.getStats().reuseCount).toBe(2);

    pool.release(a);
    expect(a.active).toBe(false);
    expect(pool.getStats().active).toBe(1);
    expect(pool.getStats().available).toBe(3);

    const c = pool.acquire();
    expect(c).toBe(a);
    expect(pool.getStats().totalCreated).toBe(4);
  });

  it('caps maximum allocations and evicts oldest active item when saturated', () => {
    let created = 0;
    const pool = new ObjectPool(() => ({ id: ++created }), null, 1, 2);
    const first = pool.acquire();
    const second = pool.acquire();
    const third = pool.acquire();

    expect(pool.getStats().totalCreated).toBe(2);
    expect(third).toBe(first);
    expect(pool.getStats().active).toBe(2);
    expect(second).not.toBe(first);
  });
});
