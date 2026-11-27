import { FURNITURE_COLLIDERS, WALL_SEGMENTS, WORLD_BOUNDS } from '../world/HouseData.js';
import { resolvePlayerCollisions } from '../world/TriggerSystem.js';

export const PHYSICS_CONSTANTS = {
  gravity: -24.0,
  jumpSpeed: 8.6,
  moveAccel: 42.0,
  groundFriction: 11.5,
  airDrag: 2.2,
  maxSpeed: 6.4,
  propGravity: -22.0,
  propAirDrag: 0.6,
};

/**
 * Manages realistic 3D kinematic player physics (gravity, jump, acceleration, friction,
 * landing impact) and interactive rigid-body props (soccer ball, wooden crates)
 * with momentum impulse transfer, restitution bouncing, and AABB collisions.
 */
export class PhysicsSystem {
  constructor() {
    this.player = {
      x: 0,
      y: 0,
      z: 14.5,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: 0.42,
      grounded: true,
      coyoteTimer: 0,
      jumpBuffer: 0,
      landingSquash: 0,
    };

    this.props = [
      {
        id: 'patio-soccer-ball',
        kind: 'ball',
        x: 2.4,
        y: 0.42,
        z: 15.2,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 0.36,
        restitution: 0.78,
        friction: 1.8,
        mass: 0.65,
        rotX: 0,
        rotZ: 0,
        mesh: null,
      },
      {
        id: 'patio-crate-1',
        kind: 'crate',
        x: -7.2,
        y: 0.4,
        z: 13.8,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 0.46,
        restitution: 0.25,
        friction: 6.5,
        mass: 1.8,
        rotX: 0,
        rotZ: 0,
        mesh: null,
      },
      {
        id: 'lab-rover-cube',
        kind: 'crate',
        x: 7.5,
        y: 0.45,
        z: -2.4,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 0.36,
        restitution: 0.45,
        friction: 4.5,
        mass: 1.1,
        rotX: 0,
        rotZ: 0,
        mesh: null,
      },
      {
        id: 'park-soccer-ball',
        kind: 'ball',
        x: -34.0,
        y: 0.42,
        z: 4.0,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 0.36,
        restitution: 0.78,
        friction: 1.8,
        mass: 0.65,
        rotX: 0,
        rotZ: 0,
        mesh: null,
      },
    ];
  }

  attachPropMesh(propId, mesh) {
    const prop = this.props.find((p) => p.id === propId);
    if (prop) prop.mesh = mesh;
  }

  teleportPlayer(x, z) {
    this.player.x = x;
    this.player.y = 0;
    this.player.z = z;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.vz = 0;
    this.player.grounded = true;
  }

  requestJump() {
    this.player.jumpBuffer = 0.14;
  }

  step(dt, wishDirX, wishDirZ, callbacks = {}) {
    const p = this.player;
    const clampedDt = Math.min(0.05, dt);

    // Coyote time & jump buffer for responsive platforming physics
    if (p.grounded) {
      p.coyoteTimer = 0.1;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - clampedDt);
    }

    if (p.jumpBuffer > 0) {
      p.jumpBuffer = Math.max(0, p.jumpBuffer - clampedDt);
    }

    if (p.jumpBuffer > 0 && p.coyoteTimer > 0) {
      p.vy = PHYSICS_CONSTANTS.jumpSpeed;
      p.grounded = false;
      p.coyoteTimer = 0;
      p.jumpBuffer = 0;
      if (callbacks.onJump) callbacks.onJump(p);
    }

    // Horizontal acceleration + friction
    const accel = p.grounded ? PHYSICS_CONSTANTS.moveAccel : PHYSICS_CONSTANTS.moveAccel * 0.55;
    const friction = p.grounded ? PHYSICS_CONSTANTS.groundFriction : PHYSICS_CONSTANTS.airDrag;

    p.vx += wishDirX * accel * clampedDt;
    p.vz += wishDirZ * accel * clampedDt;

    const damp = Math.max(0, 1 - friction * clampedDt);
    if (Math.abs(wishDirX) < 0.01) p.vx *= damp;
    if (Math.abs(wishDirZ) < 0.01) p.vz *= damp;

    const speed = Math.hypot(p.vx, p.vz);
    if (speed > PHYSICS_CONSTANTS.maxSpeed) {
      const ratio = PHYSICS_CONSTANTS.maxSpeed / speed;
      p.vx *= ratio;
      p.vz *= ratio;
    }

    // Integrate horizontal & resolve static colliders
    const resolved = resolvePlayerCollisions(
      p.x + p.vx * clampedDt,
      p.z + p.vz * clampedDt,
      p.radius
    );
    if (Math.abs(resolved.x - (p.x + p.vx * clampedDt)) > 1e-4) p.vx *= 0.2;
    if (Math.abs(resolved.z - (p.z + p.vz * clampedDt)) > 1e-4) p.vz *= 0.2;
    p.x = resolved.x;
    p.z = resolved.z;

    // Vertical gravity & landing
    p.vy += PHYSICS_CONSTANTS.gravity * clampedDt;
    p.y += p.vy * clampedDt;
    p.landingSquash = Math.max(0, p.landingSquash - clampedDt * 5.0);

    if (p.y <= 0) {
      if (!p.grounded && p.vy < -3.0) {
        p.landingSquash = Math.min(1, Math.abs(p.vy) / 10);
        if (callbacks.onLand) callbacks.onLand(p);
      }
      p.y = 0;
      p.vy = 0;
      p.grounded = true;
    }

    // Step dynamic rigid-body props + player-prop impulse transfer
    this.stepProps(clampedDt, callbacks);

    return {
      x: p.x,
      y: p.y,
      z: p.z,
      speed: Math.hypot(p.vx, p.vz),
      grounded: p.grounded,
      landingSquash: p.landingSquash,
    };
  }

  stepProps(dt, callbacks = {}) {
    const p = this.player;
    const boxes = [...WALL_SEGMENTS, ...FURNITURE_COLLIDERS];

    for (const prop of this.props) {
      // Player-prop collision & kick impulse
      const dx = prop.x - p.x;
      const dz = prop.z - p.z;
      const minDist = prop.radius + p.radius;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDist * minDist && Math.abs(p.y - (prop.y - prop.radius)) < 1.1) {
        const dist = Math.sqrt(distSq) || 0.001;
        const nx = dx / dist;
        const nz = dz / dist;
        const overlap = minDist - dist;

        prop.x += nx * overlap;
        prop.z += nz * overlap;

        const playerSpeed = Math.hypot(p.vx, p.vz);
        const kickStrength = (playerSpeed * 1.45 + 2.2) / prop.mass;
        prop.vx += nx * kickStrength;
        prop.vz += nz * kickStrength;
        if (prop.kind === 'ball' && prop.y <= prop.radius + 0.05) {
          prop.vy = Math.max(prop.vy, 2.2 + playerSpeed * 0.45);
        }
        if (callbacks.onPropHit) callbacks.onPropHit(prop);
      }

      // Gravity & vertical bounce
      prop.vy += PHYSICS_CONSTANTS.propGravity * dt;
      prop.y += prop.vy * dt;

      if (prop.y <= prop.radius) {
        prop.y = prop.radius;
        if (prop.vy < -1.4) {
          prop.vy = -prop.vy * prop.restitution;
          if (callbacks.onPropBounce) callbacks.onPropBounce(prop);
        } else {
          prop.vy = 0;
        }
      }

      // Horizontal friction & integration
      const onFloor = prop.y <= prop.radius + 0.02;
      const drag = onFloor ? prop.friction : PHYSICS_CONSTANTS.propAirDrag;
      const damp = Math.max(0, 1 - drag * dt);
      prop.vx *= damp;
      prop.vz *= damp;

      prop.x += prop.vx * dt;
      prop.z += prop.vz * dt;

      // World bounds bounce
      if (prop.x < WORLD_BOUNDS.minX + prop.radius) {
        prop.x = WORLD_BOUNDS.minX + prop.radius;
        prop.vx = Math.abs(prop.vx) * prop.restitution;
      } else if (prop.x > WORLD_BOUNDS.maxX - prop.radius) {
        prop.x = WORLD_BOUNDS.maxX - prop.radius;
        prop.vx = -Math.abs(prop.vx) * prop.restitution;
      }
      if (prop.z < WORLD_BOUNDS.minZ + prop.radius) {
        prop.z = WORLD_BOUNDS.minZ + prop.radius;
        prop.vz = Math.abs(prop.vz) * prop.restitution;
      } else if (prop.z > WORLD_BOUNDS.maxZ - prop.radius) {
        prop.z = WORLD_BOUNDS.maxZ - prop.radius;
        prop.vz = -Math.abs(prop.vz) * prop.restitution;
      }

      // Wall/furniture AABB bounce
      for (const box of boxes) {
        const minX = box.x - box.w / 2;
        const maxX = box.x + box.w / 2;
        const minZ = box.z - box.d / 2;
        const maxZ = box.z + box.d / 2;
        const cx = Math.max(minX, Math.min(prop.x, maxX));
        const cz = Math.max(minZ, Math.min(prop.z, maxZ));
        const bdx = prop.x - cx;
        const bdz = prop.z - cz;
        const bDistSq = bdx * bdx + bdz * bdz;
        if (bDistSq < prop.radius * prop.radius && bDistSq > 1e-6) {
          const bDist = Math.sqrt(bDistSq);
          const bnx = bdx / bDist;
          const bnz = bdz / bDist;
          prop.x += bnx * (prop.radius - bDist);
          prop.z += bnz * (prop.radius - bDist);
          const vn = prop.vx * bnx + prop.vz * bnz;
          if (vn < 0) {
            prop.vx -= (1 + prop.restitution) * vn * bnx;
            prop.vz -= (1 + prop.restitution) * vn * bnz;
          }
        }
      }

      // Sync visual mesh + realistic rolling rotation
      if (prop.mesh) {
        prop.mesh.position.set(prop.x, prop.y, prop.z);
        if (prop.kind === 'ball') {
          prop.mesh.rotation.x += (prop.vz * dt) / prop.radius;
          prop.mesh.rotation.z -= (prop.vx * dt) / prop.radius;
        }
      }
    }
  }
}
