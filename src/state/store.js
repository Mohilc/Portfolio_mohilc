const STORAGE_KEY = 'mohilc_pixel_portfolio_state_v2';

export const DEFAULT_AVATAR = {
  skinTone: '#f1c27d',
  hairStyle: 'spiky', // 'spiky' | 'bob' | 'cap' | 'mohawk'
  hairColor: '#1f2430',
  outfitColor: '#3b82f6',
  pantsColor: '#283149',
  accessory: 'visor', // 'none' | 'visor' | 'headphones' | 'jetpack'
  customPhotoUrl: '',
};

export const DEFAULT_ENVIRONMENT = {
  timeOfDay: 'day', // 'day' | 'sunset' | 'night'
  autoCycle: false,
  pixelScale: 1, // 1 (Crisp HD PBR Pixels) | 2 (Retro 2x) | 3 (Chunky 3x)
  soundEnabled: true,
  cameraMode: 'isometric', // 'isometric' | 'firstPerson'
};

const DEFAULT_PERSISTED = {
  avatar: DEFAULT_AVATAR,
  environment: DEFAULT_ENVIRONMENT,
  githubUsername: 'Mohilc',
  featuredRepo: 'mohilc',
  games: {
    snakeHighScore: 0,
    droneHighScore: 0,
  },
};

function safeReadStorage(storage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeWriteStorage(storage, value) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore quota or private-mode errors
  }
}

/**
 * Lightweight reactive store for avatar customization, environment toggles,
 * GitHub data, interactive room triggers, and mini-game scores.
 */
export function createPortfolioStore(options = {}) {
  const storage =
    options.storage !== undefined
      ? options.storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null;

  const persisted = safeReadStorage(storage);

  let state = {
    avatar: { ...DEFAULT_AVATAR, ...(persisted?.avatar || {}), ...(options.avatar || {}) },
    environment: {
      ...DEFAULT_ENVIRONMENT,
      ...(persisted?.environment || {}),
      ...(options.environment || {}),
    },
    github: {
      username: options.githubUsername || persisted?.githubUsername || DEFAULT_PERSISTED.githubUsername,
      featuredRepo: options.featuredRepo || persisted?.featuredRepo || DEFAULT_PERSISTED.featuredRepo,
      source: 'loading', // 'live' | 'cache' | 'snapshot' | 'loading' | 'error'
      profile: null,
      repos: [],
      events: [],
      profileReadme: '',
      readmes: {},
      error: null,
      lastFetchedAt: null,
    },
    world: {
      activeRoomId: 'patio',
      nearbyTriggerId: null,
      activePanelId: null,
      selectedRepoName: null,
      pointerLocked: false,
      activeModal: null, // null | 'avatar' | 'github'
    },
    games: {
      ...DEFAULT_PERSISTED.games,
      ...(persisted?.games || {}),
    },
  };

  const listeners = new Set();

  function persist() {
    safeWriteStorage(storage, {
      avatar: state.avatar,
      environment: state.environment,
      githubUsername: state.github.username,
      featuredRepo: state.github.featuredRepo,
      games: state.games,
    });
  }

  function notify(changedKeys) {
    for (const listener of listeners) {
      listener(state, changedKeys);
    }
  }

  return {
    getState() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    updateAvatar(patch) {
      state = {
        ...state,
        avatar: { ...state.avatar, ...patch },
      };
      persist();
      notify(['avatar']);
    },

    resetAvatar() {
      state = {
        ...state,
        avatar: { ...DEFAULT_AVATAR },
      };
      persist();
      notify(['avatar']);
    },

    updateEnvironment(patch) {
      state = {
        ...state,
        environment: { ...state.environment, ...patch },
      };
      persist();
      notify(['environment']);
    },

    cycleTimeOfDay() {
      const order = ['day', 'sunset', 'night'];
      const next = order[(order.indexOf(state.environment.timeOfDay) + 1) % order.length];
      this.updateEnvironment({ timeOfDay: next });
      return next;
    },

    cyclePixelScale() {
      const order = [1, 2, 3];
      const next = order[(order.indexOf(state.environment.pixelScale) + 1) % order.length];
      this.updateEnvironment({ pixelScale: next });
      return next;
    },

    toggleCameraMode() {
      const next = state.environment.cameraMode === 'isometric' ? 'firstPerson' : 'isometric';
      this.updateEnvironment({ cameraMode: next });
      return next;
    },

    setGithubState(patch) {
      const shouldPersist =
        Object.prototype.hasOwnProperty.call(patch, 'username') ||
        Object.prototype.hasOwnProperty.call(patch, 'featuredRepo');
      state = {
        ...state,
        github: { ...state.github, ...patch },
      };
      if (shouldPersist) persist();
      notify(['github']);
    },

    cacheRepoReadme(repoFullName, content) {
      state = {
        ...state,
        github: {
          ...state.github,
          readmes: {
            ...state.github.readmes,
            [repoFullName]: content,
          },
        },
      };
      notify(['github']);
    },

    setWorldState(patch) {
      const prev = state.world;
      const changed = Object.keys(patch).some((key) => prev[key] !== patch[key]);
      if (!changed) return;
      state = {
        ...state,
        world: { ...prev, ...patch },
      };
      notify(['world']);
    },

    recordHighScore(gameKey, score) {
      const prevBest = state.games[gameKey] || 0;
      if (score <= prevBest) return false;
      state = {
        ...state,
        games: {
          ...state.games,
          [gameKey]: score,
        },
      };
      persist();
      notify(['games']);
      return true;
    },
  };
}
