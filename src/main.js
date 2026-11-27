import * as THREE from 'three';
import './styles/main.css';

import { createPortfolioStore } from './state/store.js';
import { loadGithubPortfolio } from './services/githubService.js';
import { soundService } from './services/soundService.js';
import { PixelRenderer } from './engine/PixelRenderer.js';
import { OrthoCameraRig } from './engine/OrthoCameraRig.js';
import { createPixelTextureAtlas } from './engine/TextureAtlas.js';
import { ParticlePoolManager } from './engine/ObjectPool.js';
import { LightingSystem } from './engine/LightingSystem.js';
import { PhysicsSystem } from './engine/PhysicsSystem.js';
import { ROOMS } from './world/HouseData.js';
import { HouseBuilder } from './world/HouseBuilder.js';
import { CityBuilder } from './world/CityBuilder.js';
import { AvatarBuilder } from './world/AvatarBuilder.js';
import { TriggerSystem } from './world/TriggerSystem.js';
import { WorldPopulator } from './world/WorldPopulator.js';
import { AvatarModal } from './ui/AvatarModal.js';
import { GithubModal } from './ui/GithubModal.js';
import { InteractiveDrawer } from './ui/InteractiveDrawer.js';
import { HudController } from './ui/HudController.js';

// Read optional URL overrides (?user=...&repo=...)
const params = new URLSearchParams(window.location.search);
const initialUser = params.get('user') || undefined;
const initialRepo = params.get('repo') || undefined;

const store = createPortfolioStore({
  githubUsername: initialUser,
  featuredRepo: initialRepo,
});

// Initialize Three.js Scene + Custom Retro Pixel WebGLRenderer + Orthographic Camera
const canvas = document.getElementById('webgl-canvas');
const pixelRenderer = new PixelRenderer(canvas, store.getState().environment.pixelScale);

const scene = new THREE.Scene();
const cameraRig = new OrthoCameraRig(canvas, window.innerWidth / window.innerHeight);
cameraRig.setMode(store.getState().environment.cameraMode);

// Procedural Texture Atlas + Shared Material
const atlas = createPixelTextureAtlas();
const lightingSystem = new LightingSystem(scene, atlas.sharedMaterial);
lightingSystem.apply(store.getState().environment.timeOfDay, true);

// Build Low-Poly Flat-Shaded House, Surrounding Real-World City, Customizable Avatar, Particle Pool & Triggers
const houseBuilder = new HouseBuilder(scene, atlas);
const cityBuilder = new CityBuilder(scene, atlas);
const avatarBuilder = new AvatarBuilder(scene);
avatarBuilder.rebuild(store.getState().avatar);
avatarBuilder.setVisibleForCameraMode(store.getState().environment.cameraMode);

const particlePool = new ParticlePoolManager(scene);
const triggerSystem = new TriggerSystem(scene);
const worldPopulator = new WorldPopulator(houseBuilder, atlas);
const physicsSystem = new PhysicsSystem();
Object.entries(houseBuilder.physicsPropMeshes).forEach(([id, mesh]) => {
  physicsSystem.attachPropMesh(id, mesh);
});

// UI Controllers
async function syncGithub(username, featuredRepo, forceRefresh = false) {
  store.setGithubState({
    username,
    featuredRepo,
    source: 'loading',
    error: null,
  });
  try {
    const payload = await loadGithubPortfolio(username, featuredRepo, { forceRefresh });
    store.setGithubState(payload);
    worldPopulator.populate(store.getState().github, store.getState().avatar.customPhotoUrl);
  } catch (err) {
    store.setGithubState({
      source: 'error',
      error: err.message || 'Failed to reach GitHub API',
    });
  }
}

const avatarModal = new AvatarModal(
  document.getElementById('avatar-modal'),
  document.getElementById('avatar-modal-body'),
  document.getElementById('btn-close-avatar'),
  store
);

const githubModal = new GithubModal(
  document.getElementById('github-modal'),
  document.getElementById('github-modal-body'),
  document.getElementById('btn-close-github'),
  store,
  syncGithub
);

const drawer = new InteractiveDrawer({
  drawerEl: document.getElementById('interactive-drawer'),
  roomTagEl: document.getElementById('drawer-room-tag'),
  titleEl: document.getElementById('drawer-title'),
  bodyEl: document.getElementById('drawer-body'),
  closeBtn: document.getElementById('btn-close-drawer'),
  store,
  onEmitBurst: (x, y, z) => particlePool.emitBurst(x, y, z, 14),
  avatarModal,
  githubModal,
});

let currentNearbyTrigger = null;

function openActiveTrigger() {
  if (!currentNearbyTrigger) return;
  cameraRig.unlock();
  drawer.open(currentNearbyTrigger);
}

function teleportToRoom(roomId) {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return;
  physicsSystem.teleportPlayer(room.spawn.x, room.spawn.z);
  avatarBuilder.root.position.set(room.spawn.x, 0, room.spawn.z);
  particlePool.emitBurst(room.spawn.x, 1.0, room.spawn.z, 8);
  store.setWorldState({ activeRoomId: room.id });
  if (drawer.isOpen()) drawer.close();
}

const hud = new HudController(store, {
  onTeleportRoom: teleportToRoom,
  onToggleLock: () => {
    if (cameraRig.controls.isLocked) cameraRig.unlock();
    else cameraRig.lock();
  },
  onOpenTrigger: openActiveTrigger,
  avatarModal,
  githubModal,
});

// Pointer Lock wiring
canvas.addEventListener('click', (e) => {
  if (
    e.button === 0 &&
    !e.shiftKey &&
    !drawer.isOpen() &&
    !store.getState().world.activeModal &&
    !cameraRig.controls.isLocked
  ) {
    cameraRig.lock();
  }
});

cameraRig.onLockChange(
  () => store.setWorldState({ pointerLocked: true }),
  () => store.setWorldState({ pointerLocked: false })
);

// Reactive Store Subscriptions
soundService.setEnabled(store.getState().environment.soundEnabled);

store.subscribe((state, changed) => {
  if (changed.includes('avatar')) {
    avatarBuilder.rebuild(state.avatar);
    avatarBuilder.setVisibleForCameraMode(state.environment.cameraMode);
    worldPopulator.populate(state.github, state.avatar.customPhotoUrl);
  }
  if (changed.includes('environment')) {
    lightingSystem.apply(state.environment.timeOfDay);
    pixelRenderer.setPixelScale(state.environment.pixelScale);
    cameraRig.setMode(state.environment.cameraMode);
    avatarBuilder.setVisibleForCameraMode(state.environment.cameraMode);
    soundService.setEnabled(state.environment.soundEnabled);
  }
  if (changed.includes('github') && drawer.isOpen()) {
    drawer.render();
  }
  hud.sync(state, currentNearbyTrigger);
});

// Keyboard Movement & Hotkeys
const keys = new Set();

window.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    if (e.key === 'Escape') {
      avatarModal.close();
      githubModal.close();
      drawer.close();
    }
    return;
  }

  keys.add(e.code);

  if (e.code === 'Space') {
    if (!drawer.isOpen() && !store.getState().world.activeModal) {
      e.preventDefault();
      physicsSystem.requestJump();
    }
  } else if (e.code === 'KeyE') {
    if (store.getState().world.activeModal) return;
    if (drawer.isOpen()) drawer.close();
    else openActiveTrigger();
  } else if (e.code === 'Escape') {
    if (drawer.isOpen()) drawer.close();
    if (store.getState().world.activeModal === 'avatar') avatarModal.close();
    if (store.getState().world.activeModal === 'github') githubModal.close();
  } else if (e.code === 'KeyL') {
    soundService.playCollect();
    store.cycleTimeOfDay();
  } else if (e.code === 'KeyV') {
    soundService.playCollect();
    store.toggleCameraMode();
  } else if (e.code === 'KeyP') {
    soundService.playCollect();
    store.cyclePixelScale();
  } else if (e.code === 'KeyC') {
    if (store.getState().world.activeModal === 'avatar') avatarModal.close();
    else {
      cameraRig.unlock();
      avatarModal.open();
    }
  } else if (e.code === 'KeyG') {
    if (store.getState().world.activeModal === 'github') githubModal.close();
    else {
      cameraRig.unlock();
      githubModal.open();
    }
  } else if (e.code === 'KeyM') {
    const next = !store.getState().environment.soundEnabled;
    store.updateEnvironment({ soundEnabled: next });
  } else if (e.code.startsWith('Digit')) {
    const idx = Number(e.code.replace('Digit', '')) - 1;
    if (ROOMS[idx]) {
      soundService.playRoomEnter();
      teleportToRoom(ROOMS[idx].id);
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
});

window.addEventListener('resize', () => {
  pixelRenderer.resize(window.innerWidth, window.innerHeight);
  cameraRig.resize(window.innerWidth / window.innerHeight);
});

// Kick off live GitHub fetch
syncGithub(store.getState().github.username, store.getState().github.featuredRepo);
hud.sync(store.getState(), null);

// Main Animation Loop
const clock = new THREE.Clock();
let frameCount = 0;
let fpsAccum = 0;
let currentFps = 60;
let stepParticleTimer = 0;
let smokeTimer = 0;
let lastHitSfxAt = 0;
let lastRoomId = store.getState().world.activeRoomId;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(0.05, clock.getDelta());
  const elapsed = clock.elapsedTime;

  // Avatar Movement & Realistic 3D Physics
  const uiBlocking = drawer.isOpen() || Boolean(store.getState().world.activeModal);
  let wishX = 0;
  let wishZ = 0;

  if (!uiBlocking) {
    const forwardInput = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const strafeInput = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);

    // Optional keyboard orbit (Q / R) when not using mouse
    const orbitSpin = (keys.has('KeyQ') ? 1 : 0) - (keys.has('KeyR') ? 1 : 0);
    if (orbitSpin !== 0) {
      const euler = new THREE.Euler().setFromQuaternion(cameraRig.camera.quaternion, 'YXZ');
      cameraRig.setAngles(euler.y + orbitSpin * dt * 1.9, euler.x);
    }

    if (forwardInput !== 0 || strafeInput !== 0) {
      const { forward, right } = cameraRig.getHorizontalBasis();
      const vx = forward.x * forwardInput + right.x * strafeInput;
      const vz = forward.z * forwardInput + right.z * strafeInput;
      const len = Math.hypot(vx, vz) || 1;
      wishX = vx / len;
      wishZ = vz / len;
    }
  }

  const physState = physicsSystem.step(dt, wishX, wishZ, {
    onJump: (p) => {
      soundService.playTone(340, 0.08, 'triangle', 0.04);
      particlePool.emitFootstep(p.x, p.z);
    },
    onLand: (p) => {
      soundService.playTone(120, 0.07, 'triangle', 0.04);
      particlePool.emitLanding(p.x, p.z);
    },
    onPropHit: () => {
      const now = performance.now();
      if (now - lastHitSfxAt > 180) {
        lastHitSfxAt = now;
        soundService.playTone(210, 0.06, 'square', 0.03);
      }
    },
    onPropBounce: (prop) => {
      soundService.playTone(170, 0.04, 'triangle', 0.02);
      particlePool.emitFootstep(prop.x, prop.z);
    },
  });

  avatarBuilder.root.position.set(physState.x, physState.y, physState.z);
  const isMoving = physState.speed > 0.35;
  const targetAngle = wishX !== 0 || wishZ !== 0 ? Math.atan2(wishX, wishZ) : null;

  if (isMoving && physState.grounded) {
    stepParticleTimer += dt;
    if (stepParticleTimer > 0.16) {
      stepParticleTimer = 0;
      particlePool.emitFootstep(physState.x, physState.z);
      soundService.playStep();
    }
  }

  // Chimney pixel smoke puffs when roof is visible or subtle outdoor ambiance
  smokeTimer += dt;
  if (smokeTimer > 0.55) {
    smokeTimer = 0;
    if (store.getState().environment.cameraMode === 'firstPerson') {
      particlePool.emitSmoke(-8.5, 8.2, -7.0);
    }
  }

  avatarBuilder.updateAnimation(dt, isMoving, targetAngle, physState);
  cameraRig.updateTarget(avatarBuilder.root.position, dt);

  // Room & Proximity Triggers
  const { room, nearby } = triggerSystem.update(avatarBuilder.root.position, elapsed);
  if (room.id !== lastRoomId) {
    lastRoomId = room.id;
    soundService.playRoomEnter();
    store.setWorldState({ activeRoomId: room.id });
  }

  const prevNearbyId = currentNearbyTrigger?.id || null;
  const nextNearbyId = nearby?.id || null;
  currentNearbyTrigger = nearby;
  if (prevNearbyId !== nextNearbyId) {
    store.setWorldState({ nearbyTriggerId: nextNearbyId });
  }

  // Dynamic Cutaway, City Traffic, Follow Shadow, Lighting & Pooled Particles
  houseBuilder.updateCutaway(store.getState().environment.cameraMode, cameraRig.getYaw());
  houseBuilder.updateAnimations(elapsed);
  cityBuilder.update(dt, elapsed);
  lightingSystem.setShadowCenter(physState.x, physState.z);
  lightingSystem.update(dt);
  particlePool.update(dt, store.getState().environment.timeOfDay);

  pixelRenderer.render(scene, cameraRig.camera);

  // Perf Telemetry (updated 2x/sec)
  frameCount += 1;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    currentFps = Math.round(frameCount / fpsAccum);
    frameCount = 0;
    fpsAccum = 0;
    hud.updatePerf(currentFps, pixelRenderer.getInfo(), particlePool.getStats());
  }
}

animate();
