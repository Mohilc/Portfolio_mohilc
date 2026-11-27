import * as THREE from 'three';

/**
 * Generic zero-GC Object Pool. Pre-allocates objects and recycles them
 * without runtime heap churn.
 */
export class ObjectPool {
  constructor(factory, resetFn, initialSize = 32, maxSize = 256) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    this.freeList = [];
    this.activeSet = new Set();
    this.totalCreated = 0;
    this.reuseCount = 0;

    for (let i = 0; i < initialSize; i += 1) {
      const item = this.factory();
      this.totalCreated += 1;
      if (this.resetFn) this.resetFn(item);
      this.freeList.push(item);
    }
  }

  acquire() {
    let item;
    if (this.freeList.length > 0) {
      item = this.freeList.pop();
      this.reuseCount += 1;
    } else if (this.totalCreated < this.maxSize) {
      item = this.factory();
      this.totalCreated += 1;
    } else {
      // Evict oldest active item when pool is saturated
      const oldest = this.activeSet.values().next().value;
      if (!oldest) return null;
      this.release(oldest);
      item = this.freeList.pop();
      this.reuseCount += 1;
    }

    this.activeSet.add(item);
    return item;
  }

  release(item) {
    if (!this.activeSet.has(item)) return false;
    this.activeSet.delete(item);
    if (this.resetFn) this.resetFn(item);
    this.freeList.push(item);
    return true;
  }

  releaseAll() {
    for (const item of Array.from(this.activeSet)) {
      this.release(item);
    }
  }

  getStats() {
    return {
      active: this.activeSet.size,
      available: this.freeList.length,
      totalCreated: this.totalCreated,
      reuseCount: this.reuseCount,
    };
  }
}

/**
 * Pooled 3D voxel particle manager for footsteps, fireflies, trigger sparkles,
 * and celebratory pixel bursts. Uses a single shared geometry and material pool.
 */
export class ParticlePoolManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'PooledParticles';
    this.scene.add(this.group);

    this.sharedGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    this.materials = {
      dust: new THREE.MeshBasicMaterial({ color: 0xd8cfc2 }),
      smoke: new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.55 }),
      firefly: new THREE.MeshBasicMaterial({ color: 0xfde047 }),
      sparkle: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      confettiA: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
      confettiB: new THREE.MeshBasicMaterial({ color: 0x22c55e }),
    };

    this.particles = [];
    this.pool = new ObjectPool(
      () => {
        const mesh = new THREE.Mesh(this.sharedGeo, this.materials.dust);
        mesh.visible = false;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        this.group.add(mesh);
        return {
          mesh,
          vx: 0,
          vy: 0,
          vz: 0,
          age: 0,
          life: 1,
          gravity: 0,
          baseScale: 1,
          bobPhase: 0,
          kind: 'dust',
        };
      },
      (p) => {
        p.mesh.visible = false;
        p.age = 0;
        p.vx = 0;
        p.vy = 0;
        p.vz = 0;
        p.gravity = 0;
      },
      48,
      180
    );
  }

  spawn(kind, position, velocity, options = {}) {
    const p = this.pool.acquire();
    if (!p) return null;

    p.kind = kind;
    p.mesh.material = this.materials[kind] || this.materials.dust;
    p.mesh.position.set(position.x, position.y, position.z);
    p.vx = velocity.x;
    p.vy = velocity.y;
    p.vz = velocity.z;
    p.age = 0;
    p.life = options.life ?? 0.8;
    p.gravity = options.gravity ?? 0;
    p.baseScale = options.scale ?? 1;
    p.bobPhase = Math.random() * Math.PI * 2;
    p.mesh.scale.setScalar(p.baseScale);
    p.mesh.visible = true;
    this.particles.push(p);
    return p;
  }

  emitFootstep(x, z) {
    for (let i = 0; i < 2; i += 1) {
      this.spawn(
        'dust',
        { x: x + (Math.random() - 0.5) * 0.35, y: 0.12, z: z + (Math.random() - 0.5) * 0.35 },
        { x: (Math.random() - 0.5) * 0.5, y: 0.55 + Math.random() * 0.4, z: (Math.random() - 0.5) * 0.5 },
        { life: 0.48, scale: 0.8, gravity: -2.4 }
      );
    }
  }

  emitLanding(x, z) {
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      this.spawn(
        'dust',
        { x: x + Math.cos(a) * 0.2, y: 0.12, z: z + Math.sin(a) * 0.2 },
        { x: Math.cos(a) * 1.4, y: 1.1 + Math.random() * 0.5, z: Math.sin(a) * 1.4 },
        { life: 0.55, scale: 1.0, gravity: -4.5 }
      );
    }
  }

  emitSmoke(x, y, z) {
    this.spawn(
      'smoke',
      { x: x + (Math.random() - 0.5) * 0.3, y, z: z + (Math.random() - 0.5) * 0.3 },
      { x: 0.25 + Math.random() * 0.2, y: 1.05 + Math.random() * 0.35, z: (Math.random() - 0.5) * 0.2 },
      { life: 2.1, scale: 1.8, gravity: 0.12 }
    );
  }

  emitBurst(x, y, z, count = 12) {
    const kinds = ['sparkle', 'confettiA', 'confettiB', 'firefly'];
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 1.2 + Math.random() * 1.8;
      this.spawn(
        kinds[i % kinds.length],
        { x, y, z },
        { x: Math.cos(angle) * speed, y: 2.2 + Math.random() * 1.8, z: Math.sin(angle) * speed },
        { life: 0.95, scale: 0.9, gravity: -8.2 }
      );
    }
  }

  emitFirefly() {
    this.spawn(
      'firefly',
      {
        x: (Math.random() - 0.5) * 28,
        y: 0.6 + Math.random() * 2.2,
        z: 10.5 + Math.random() * 6.5,
      },
      {
        x: (Math.random() - 0.5) * 0.35,
        y: 0.12 + (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.35,
      },
      { life: 2.6 + Math.random() * 1.6, scale: 0.75, gravity: 0 }
    );
  }

  update(dt, timeOfDay) {
    if (timeOfDay === 'night' && this.particles.length < 28 && Math.random() < dt * 7) {
      this.emitFirefly();
    }

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.pool.release(p);
        this.particles.splice(i, 1);
        continue;
      }

      p.vy += p.gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      // Realistic floor bounce for gravity particles
      if (p.gravity < 0 && p.mesh.position.y < 0.08) {
        p.mesh.position.y = 0.08;
        p.vy = Math.abs(p.vy) * 0.45;
        p.vx *= 0.75;
        p.vz *= 0.75;
      }

      if (p.kind === 'firefly') {
        p.mesh.position.y += Math.sin(p.age * 4 + p.bobPhase) * 0.25 * dt;
      }

      const t = p.age / p.life;
      const scale =
        p.kind === 'firefly'
          ? p.baseScale * Math.sin(t * Math.PI)
          : p.kind === 'smoke'
            ? p.baseScale * (0.7 + t * 0.8) * (1 - t * 0.45)
            : p.baseScale * (1 - t);
      p.mesh.scale.setScalar(Math.max(0.01, scale));
    }
  }

  getStats() {
    return this.pool.getStats();
  }

  dispose() {
    this.pool.releaseAll();
    this.sharedGeo.dispose();
    Object.values(this.materials).forEach((m) => m.dispose());
  }
}
