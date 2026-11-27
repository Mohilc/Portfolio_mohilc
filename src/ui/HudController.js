import { ROOMS } from '../world/HouseData.js';
import { soundService } from '../services/soundService.js';

/**
 * Syncs top HUD, room quick-navigation buttons, pointer-lock status banner,
 * proximity interaction prompt, and performance telemetry.
 */
export class HudController {
  constructor(store, { onTeleportRoom, onToggleLock, onOpenTrigger, avatarModal, githubModal }) {
    this.store = store;
    this.onTeleportRoom = onTeleportRoom;
    this.onToggleLock = onToggleLock;
    this.onOpenTrigger = onOpenTrigger;
    this.avatarModal = avatarModal;
    this.githubModal = githubModal;

    this.els = {
      avatarPhoto: document.getElementById('hud-avatar-photo'),
      roomBadge: document.getElementById('hud-room-badge'),
      title: document.getElementById('hud-portfolio-title'),
      githubStatus: document.getElementById('hud-github-status'),
      envBtn: document.getElementById('btn-env-toggle'),
      envIcon: document.getElementById('env-icon'),
      envLabel: document.getElementById('env-label'),
      camBtn: document.getElementById('btn-camera-toggle'),
      camLabel: document.getElementById('cam-label'),
      pixelBtn: document.getElementById('btn-pixel-toggle'),
      pixelLabel: document.getElementById('pixel-label'),
      avatarBtn: document.getElementById('btn-avatar-modal'),
      githubBtn: document.getElementById('btn-github-modal'),
      soundBtn: document.getElementById('btn-sound-toggle'),
      lockBanner: document.getElementById('pointer-lock-banner'),
      lockDot: document.getElementById('pointer-status-dot'),
      lockText: document.getElementById('pointer-status-text'),
      lockBtn: document.getElementById('btn-lock-pointer'),
      prompt: document.getElementById('proximity-prompt'),
      promptTitle: document.getElementById('prompt-title'),
      promptDesc: document.getElementById('prompt-desc'),
      openTriggerBtn: document.getElementById('btn-open-trigger'),
      perfFps: document.getElementById('perf-fps'),
      perfCalls: document.getElementById('perf-calls'),
      perfTex: document.getElementById('perf-tex'),
      perfPool: document.getElementById('perf-pool'),
    };

    this.bindEvents();
  }

  bindEvents() {
    document.querySelectorAll('.room-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        soundService.playRoomEnter();
        this.onTeleportRoom(btn.dataset.room);
      });
    });

    this.els.envBtn.addEventListener('click', () => {
      soundService.playCollect();
      this.store.cycleTimeOfDay();
    });

    this.els.camBtn.addEventListener('click', () => {
      soundService.playCollect();
      this.store.toggleCameraMode();
    });

    this.els.pixelBtn.addEventListener('click', () => {
      soundService.playCollect();
      this.store.cyclePixelScale();
    });

    this.els.avatarBtn.addEventListener('click', () => this.avatarModal.open());
    this.els.githubBtn.addEventListener('click', () => this.githubModal.open());

    this.els.soundBtn.addEventListener('click', () => {
      const next = !this.store.getState().environment.soundEnabled;
      this.store.updateEnvironment({ soundEnabled: next });
      soundService.setEnabled(next);
      if (next) soundService.playCollect();
    });

    this.els.lockBtn.addEventListener('click', () => this.onToggleLock());
    this.els.openTriggerBtn.addEventListener('click', () => this.onOpenTrigger());
  }

  sync(state, nearbyTrigger) {
    const room = ROOMS.find((r) => r.id === state.world.activeRoomId) || ROOMS[0];
    this.els.roomBadge.textContent = room.name;

    document.querySelectorAll('.room-btn').forEach((btn) => {
      btn.classList.toggle('accent', btn.dataset.room === room.id);
    });

    const gh = state.github;
    const customPhoto = state.avatar?.customPhotoUrl;
    const targetSrc =
      customPhoto ||
      (gh.profile?.avatar_url
        ? `${gh.profile.avatar_url}${gh.profile.avatar_url.includes('?') ? '&' : '?'}s=128`
        : '');
    if (this.els.avatarPhoto && targetSrc && this.els.avatarPhoto.src !== targetSrc) {
      this.els.avatarPhoto.src = targetSrc;
    }
    this.els.title.textContent = `${(gh.username || 'MOHILC').toUpperCase()}.3D`;
    this.els.githubStatus.textContent =
      gh.source === 'loading'
        ? 'SYNCING GITHUB...'
        : `@${gh.username} · ${gh.repos.length} REPOS (${gh.source.toUpperCase()})`;

    // Environment buttons
    const tod = state.environment.timeOfDay;
    this.els.envIcon.textContent = tod === 'day' ? '☀' : tod === 'sunset' ? '🌇' : '🌙';
    this.els.envLabel.textContent = tod.toUpperCase();
    this.els.camLabel.textContent = state.environment.cameraMode === 'isometric' ? 'ISO' : '1ST-P';
    this.els.pixelLabel.textContent = `${state.environment.pixelScale}X PX`;
    this.els.soundBtn.textContent = state.environment.soundEnabled ? 'SFX ON' : 'SFX OFF';

    // Pointer lock status
    const locked = state.world.pointerLocked;
    this.els.lockDot.classList.toggle('locked', locked);
    this.els.lockText.textContent = locked
      ? 'POINTER LOCKED · MOVE MOUSE TO ORBIT · WASD MOVE · SPACE JUMP · E INTERACT · ESC UNLOCK'
      : 'CLICK VIEWPORT FOR POINTER LOCK · WASD MOVE · SPACE JUMP · SHIFT+DRAG ORBIT · E INTERACT';
    this.els.lockBtn.textContent = locked ? 'UNLOCK (ESC)' : 'LOCK MOUSE';

    // Proximity prompt
    if (nearbyTrigger && !state.world.activePanelId && !state.world.activeModal) {
      this.els.promptTitle.textContent = nearbyTrigger.title;
      this.els.promptDesc.textContent = nearbyTrigger.prompt;
      this.els.prompt.classList.remove('hidden');
    } else {
      this.els.prompt.classList.add('hidden');
    }
  }

  updatePerf(fps, rendererInfo, poolStats) {
    this.els.perfFps.textContent = String(fps);
    this.els.perfCalls.textContent = String(rendererInfo.calls);
    this.els.perfTex.textContent = String(rendererInfo.textures);
    this.els.perfPool.textContent = `${poolStats.active}/${poolStats.totalCreated}`;
  }
}
