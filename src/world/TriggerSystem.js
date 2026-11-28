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
    this.labelSprites = [];
    for (const trigger of INTERACTIVE_TRIGGERS) {
      const marker = this.markerPool.acquire();
      if (marker) {
        marker.trigger = trigger;
        marker.mesh.position.set(...trigger.markerPos);
        marker.mesh.visible = true;
        this.activeMarkers.push(marker);

        if (typeof document !== 'undefined' && this.scene) {
          const sprite = this.createTriggerLabel(trigger.title);
          sprite.position.set(trigger.markerPos[0], trigger.markerPos[1] + 0.72, trigger.markerPos[2]);
          this.markerGroup.add(sprite);
          this.labelSprites.push({ sprite, trigger, baseY: trigger.markerPos[1] + 0.72 });
        }
      }
    }
  }

  createTriggerLabel(text) {
    const cvs = document.createElement('canvas');
    cvs.width = 320;
    cvs.height = 56;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(2, 2, 316, 52);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 316, 52);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.slice(0, 22), 160, 28);

    const tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.9, 0.52, 1);
    sprite.renderOrder = 999;
    return sprite;
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

    for (const lbl of this.labelSprites) {
      const isActive = nearby && nearby.id === lbl.trigger.id;
      lbl.sprite.position.y = lbl.baseY + Math.sin(elapsed * 3.2) * 0.08;
      const s = isActive ? 1.18 : 1.0;
      lbl.sprite.scale.set(2.9 * s, 0.52 * s, 1);
      lbl.sprite.material.opacity = isActive ? 1.0 : 0.85;
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
