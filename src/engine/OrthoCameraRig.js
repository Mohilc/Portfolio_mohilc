import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/**
 * Orthographic Camera + Three.js PointerLockControls rig supporting:
 * 1. Isometric 3rd-person orbit (cursor-locked mouse look or drag-to-orbit)
 * 2. First-person orthographic walkthrough (true eye-level pointer lock)
 * 3. Scroll-wheel orthographic zoom + camera-relative XZ movement vectors
 */
export class OrthoCameraRig {
  constructor(domElement, aspect = 16 / 9) {
    this.domElement = domElement;
    this.aspect = aspect;
    this.mode = 'isometric'; // 'isometric' | 'firstPerson'
    this.frustumHeight = 14.5;
    this.orbitDistance = 28;
    this.zoom = 1.15;
    this.target = new THREE.Vector3(0, 1.0, 14.5);

    const halfH = this.frustumHeight / 2;
    const halfW = halfH * this.aspect;

    this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 220);
    this.camera.rotation.order = 'YXZ';

    // Default classic isometric angle (looking from South-East toward North-West)
    this.setAngles(Math.PI * 0.22, -0.58);

    this.controls = new PointerLockControls(this.camera, domElement);
    this.controls.pointerSpeed = 0.85;
    this.applyModeConstraints();

    // Non-locked drag fallback so users can also orbit without pointer lock
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };

    this._onPointerDown = (e) => {
      if (this.controls.isLocked) return;
      if (e.button === 2 || e.button === 1 || e.shiftKey) {
        this.isDragging = true;
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;
      }
    };

    this._onPointerMove = (e) => {
      if (this.controls.isLocked || !this.isDragging) return;
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      this.lastMouse.x = e.clientX;
      this.lastMouse.y = e.clientY;

      _euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      _euler.y -= dx * 0.005;
      _euler.x -= dy * 0.005;
      const minPitch = Math.PI / 2 - this.controls.maxPolarAngle;
      const maxPitch = Math.PI / 2 - this.controls.minPolarAngle;
      _euler.x = Math.max(minPitch, Math.min(maxPitch, _euler.x));
      this.camera.quaternion.setFromEuler(_euler);
    };

    this._onPointerUp = () => {
      this.isDragging = false;
    };

    this._onWheel = (e) => {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.setZoom(this.zoom + delta);
    };

    domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    domElement.addEventListener('wheel', this._onWheel, { passive: true });
    domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    this.syncCameraTransform();
  }

  setAngles(yaw, pitch) {
    _euler.set(pitch, yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(_euler);
  }

  getYaw() {
    _euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    return _euler.y;
  }

  applyModeConstraints() {
    if (this.mode === 'isometric') {
      // Looking downward from 18deg to 68deg below horizon
      this.controls.minPolarAngle = Math.PI / 2 + 0.28;
      this.controls.maxPolarAngle = Math.PI / 2 + 1.18;
      this.frustumHeight = 14.5;
      this.zoom = Math.max(0.65, Math.min(2.4, this.zoom));
      _euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      if (_euler.x > -0.28) {
        _euler.x = -0.58;
        this.camera.quaternion.setFromEuler(_euler);
      }
    } else {
      // First-person orthographic eye look
      this.controls.minPolarAngle = Math.PI * 0.2;
      this.controls.maxPolarAngle = Math.PI * 0.8;
      this.frustumHeight = 6.4;
      this.zoom = 1.0;
      _euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      _euler.x = Math.max(-0.4, Math.min(0.35, _euler.x * 0.35));
      this.camera.quaternion.setFromEuler(_euler);
    }
    this.resize(this.aspect);
  }

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.applyModeConstraints();
    this.syncCameraTransform();
  }

  setZoom(nextZoom) {
    const minZ = this.mode === 'isometric' ? 0.65 : 0.75;
    const maxZ = this.mode === 'isometric' ? 2.4 : 1.75;
    this.zoom = Math.max(minZ, Math.min(maxZ, nextZoom));
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
  }

  resize(aspect) {
    this.aspect = aspect;
    const halfH = this.frustumHeight / 2;
    const halfW = halfH * aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
  }

  lock() {
    this.controls.lock();
  }

  unlock() {
    if (this.controls.isLocked) {
      this.controls.unlock();
    }
  }

  onLockChange(onLock, onUnlock) {
    this.controls.addEventListener('lock', onLock);
    this.controls.addEventListener('unlock', onUnlock);
  }

  /**
   * Computes camera-relative XZ forward & right unit vectors for smooth WASD navigation.
   */
  getHorizontalBasis() {
    _forward.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    _forward.y = 0;
    if (_forward.lengthSq() < 1e-5) {
      _forward.set(0, 0, -1);
    } else {
      _forward.normalize();
    }
    _right.crossVectors(_forward, _up).normalize();
    return { forward: _forward, right: _right };
  }

  updateTarget(avatarPosition, dt) {
    const desiredY = this.mode === 'isometric' ? avatarPosition.y + 1.05 : avatarPosition.y + 1.55;
    const lerpFactor = Math.min(1, dt * 14);
    this.target.x += (avatarPosition.x - this.target.x) * lerpFactor;
    this.target.y += (desiredY - this.target.y) * lerpFactor;
    this.target.z += (avatarPosition.z - this.target.z) * lerpFactor;
    this.syncCameraTransform();
  }

  syncCameraTransform() {
    if (this.mode === 'isometric') {
      const viewDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion);
      this.camera.position.copy(this.target).addScaledVector(viewDir, this.orbitDistance);
    } else {
      this.camera.position.copy(this.target);
    }
  }

  dispose() {
    this.controls.dispose();
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    this.domElement.removeEventListener('wheel', this._onWheel);
  }
}
