import * as THREE from 'three';
import {
  detectRoomAt,
  FURNITURE_COLLIDERS,
  INTERACTIVE_TRIGGERS,
  WALL_SEGMENTS,
  WORLD_BOUNDS,
} from './HouseData.js';
import { ObjectPool } from '../engine/ObjectPool.js';

/**
 * Resolves 2D circle-vs-AABB sliding collision in the XZ plane.
 */
export function resolvePlayerCollisions(nextX, nextZ, radius = 0.42, colliders = null) {
  let x = Math.max(WORLD_BOUNDS.minX + radius, Math.min(WORLD_BOUNDS.maxX - radius, nextX));
  let z = Math.max(WORLD_BOUNDS.minZ + radius, Math.min(WORLD_BOUNDS.maxZ - radius, nextZ));

  const boxes = colliders || [...WALL_SEGMENTS, ...FURNITURE_COLLIDERS];

  for (let pass = 0; pass < 2; pass += 1) {
    for (const box of boxes) {
      const halfW = box.w / 2;
      const halfD = box.d / 2;
      const minX = box.x - halfW;
      const maxX = box.x + halfW;
      const minZ = box.z - halfD;
      const maxZ = box.z + halfD;

      const closestX = Math.max(minX, Math.min(x, maxX));
      const closestZ = Math.max(minZ, Math.min(z, maxZ));

      const dx = x - closestX;
      const dz = z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        if (distSq > 1e-6) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          x += (dx / dist) * overlap;
          z += (dz / dist) * overlap;
        } else {
          // Center inside AABB: push out along shallowest axis
          const penLeft = Math.abs(x - minX);
          const penRight = Math.abs(maxX - x);
          const penTop = Math.abs(z - minZ);
          const penBottom = Math.abs(maxZ - z);
          const minPen = Math.min(penLeft, penRight, penTop, penBottom);
          if (minPen === penLeft) x = minX - radius;
          else if (minPen === penRight) x = maxX + radius;
          else if (minPen === penTop) z = minZ - radius;
          else z = maxZ + radius;
        }
      }
    }
  }

  return { x, z };
}

/**
 * Finds the nearest interactive trigger within activation radius.
 */
export function findNearestTrigger(x, z, triggers = INTERACTIVE_TRIGGERS) {
  let best = null;
  let bestDistSq = Infinity;
  for (const trigger of triggers) {
    const dx = x - trigger.x;
    const dz = z - trigger.z;
    const distSq = dx * dx + dz * dz;
    if (distSq <= trigger.radius * trigger.radius && distSq < bestDistSq) {
      bestDistSq = distSq;
      best = trigger;
    }
  }
  return best;
}

/**
 * Manages room entry detection, proximity triggers, and pooled floating 3D voxel beacons.
 */
export class TriggerSystem {
  constructor(scene) {
    this.scene = scene;
    this.markerGroup = new THREE.Group();
    this.markerGroup.name = 'TriggerMarkers';
    if (scene) this.scene.add(this.markerGroup);

    this.sharedGeo = new THREE.OctahedronGeometry(0.24, 0);
    this.defaultMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.activeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    this.markerPool = new ObjectPool(
      () => {
        const mesh = new THREE.Mesh(this.sharedGeo, this.defaultMat);
        mesh.visible = false;
        this.markerGroup.add(mesh);
        return { mesh, trigger: null, phase: Math.random() * Math.PI * 2 };
      },
      (item) => {
        item.mesh.visible = false;
        item.trigger = null;
      },
      INTERACTIVE_TRIGGERS.length,
      INTERACTIVE_TRIGGERS.length + 8
    );

    this.activeMarkers = [];
    for (const trigger of INTERACTIVE_TRIGGERS) {
      const marker = this.markerPool.acquire();
      if (marker) {
        marker.trigger = trigger;
        marker.mesh.position.set(...trigger.markerPos);
        marker.mesh.visible = true;
        this.activeMarkers.push(marker);
      }
    }
  }

  update(playerPos, elapsed) {
    const room = detectRoomAt(playerPos.x, playerPos.z);
    const nearby = findNearestTrigger(playerPos.x, playerPos.z);

    for (const item of this.activeMarkers) {
      const isActive = nearby && nearby.id === item.trigger.id;
      const baseY = item.trigger.markerPos[1];
      item.mesh.position.y = baseY + Math.sin(elapsed * 3.2 + item.phase) * 0.14;
      item.mesh.rotation.y = elapsed * (isActive ? 3.5 : 1.5);
      item.mesh.scale.setScalar(isActive ? 1.45 : 0.9);
      item.mesh.material = isActive ? this.activeMat : this.defaultMat;
    }

    return { room, nearby };
  }

  getStats() {
    return this.markerPool.getStats();
  }

  dispose() {
    this.markerPool.releaseAll();
    this.sharedGeo.dispose();
    this.defaultMat.dispose();
    this.activeMat.dispose();
  }
}
