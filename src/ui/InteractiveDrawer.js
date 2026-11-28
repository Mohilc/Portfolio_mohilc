import {
  categorizeRepos,
  computeLanguageStats,
  fetchRepoReadme,
  LANGUAGE_COLORS,
} from '../services/githubService.js';
import { soundService } from '../services/soundService.js';
import { INTERACTIVE_TRIGGERS, ROOMS } from '../world/HouseData.js';
import { mountContributionSnake } from './miniGames/ContributionSnake.js';
import { mountDroneCrackScanner } from './miniGames/DroneCrackScanner.js';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdownLite(md) {
  const safe = escapeHtml(md || 'No README content available.');
  return safe
    .replace(/^### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^## (.*)$/gm, '<h3>$1</h3>')
    .replace(/^# (.*)$/gm, '<h2>$1</h2>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

/**
 * Contextual interactive drawer opened when approaching objects like the
 * Bookshelf, Sofa, Retro TV, Drone Workbench, Arcade Cabinet, or Sundial.
 */
export class InteractiveDrawer {
  constructor({
    drawerEl,
    roomTagEl,
    titleEl,
    bodyEl,
    closeBtn,
    store,
    onEmitBurst,
    onTeleportRoom,
    avatarModal,
    githubModal,
  }) {
    this.drawerEl = drawerEl;
    this.roomTagEl = roomTagEl;
    this.titleEl = titleEl;
    this.bodyEl = bodyEl;
    this.store = store;
    this.onEmitBurst = onEmitBurst;
    this.onTeleportRoom = onTeleportRoom;
    this.avatarModal = avatarModal;
    this.githubModal = githubModal;

    this.activeTrigger = null;
    this.cleanupGame = null;
    this.repoFilter = '';
    this.langFilter = 'ALL';

    closeBtn.addEventListener('click', () => this.close());
  }

  isOpen() {
    return !this.drawerEl.classList.contains('hidden');
  }

  open(trigger) {
    if (!trigger) return;

    if (trigger.kind === 'avatar_customizer') {
      this.avatarModal.open();
      return;
    }
    if (trigger.kind === 'github_connect') {
      this.githubModal.open();
      return;
    }

    this.cleanupActiveGame();
    this.activeTrigger = trigger;
    this.roomTagEl.textContent = trigger.roomId.toUpperCase();
    this.titleEl.textContent = trigger.title;
    this.store.setWorldState({ activePanelId: trigger.id });

    if (this.onEmitBurst) {
      this.onEmitBurst(trigger.markerPos[0], trigger.markerPos[1], trigger.markerPos[2]);
    }
    soundService.playOpenDrawer();

    this.render();
    this.drawerEl.classList.remove('hidden');
  }

  close() {
    this.cleanupActiveGame();
    this.activeTrigger = null;
    this.drawerEl.classList.add('hidden');
    this.store.setWorldState({ activePanelId: null });
    soundService.playClose();
  }

  cleanupActiveGame() {
    if (typeof this.cleanupGame === 'function') {
      this.cleanupGame();
      this.cleanupGame = null;
    }
  }

  render() {
    if (!this.activeTrigger) return;
    this.cleanupActiveGame();
    const state = this.store.getState();
    const gh = state.github;

    switch (this.activeTrigger.kind) {
      case 'github_repos':
        this.renderBookshelf(gh);
        break;
      case 'stack_activity':
        this.renderWorkstation(gh);
        break;
      case 'profile_bio':
        this.renderSofaBio(gh);
        break;
      case 'embedded_media':
        this.renderRetroTV(gh);
        break;
      case 'drone_lab':
        this.renderDroneLab(gh);
        break;
      case 'cli_terminal':
        this.renderCliTerminal(state);
        break;
      case 'snake_game':
        this.cleanupGame = mountContributionSnake(this.bodyEl, gh.repos, this.store);
        break;
      case 'hackathons':
        this.renderHackathons(gh);
        break;
      case 'agri_eco':
        this.renderRepoBucket(
          gh,
          'agriEco',
          'AgriVision AI Crop Intelligence, Munnar Tourism, Earth Bloom & Onam Pookalam Builds'
        );
        break;
      case 'cafe_food':
        this.renderRepoBucket(
          gh,
          'cafeFood',
          'Hoshiko Web, Food-Order UI, EmojiStories & House-Price ML Predictor'
        );
        break;
      case 'space_vision':
        this.renderRepoBucket(
          gh,
          'spaceVision',
          'LoopTroop NASA Space Apps 2025, VisionSafe AI Road Safety & VisionAid Safety Agent'
        );
        break;
      case 'environment_panel':
        this.renderEnvironmentPanel(state.environment);
        break;
      case 'world_guide':
        this.renderWorldGuide(gh);
        break;
      default:
        this.bodyEl.innerHTML = `<p>Interactive trigger: ${escapeHtml(this.activeTrigger.title)}</p>`;
    }
  }

  renderBookshelf(gh) {
    const langs = ['ALL', ...new Set(gh.repos.map((r) => r.language).filter(Boolean))];
    const filtered = gh.repos.filter((repo) => {
      const matchLang = this.langFilter === 'ALL' || repo.language === this.langFilter;
      const q = this.repoFilter.toLowerCase();
      const matchQuery =
        !q ||
        repo.name.toLowerCase().includes(q) ||
        (repo.description || '').toLowerCase().includes(q);
      return matchLang && matchQuery;
    });

    const selectedName = this.store.getState().world.selectedRepoName || filtered[0]?.name;
    const selectedRepo = gh.repos.find((r) => r.name === selectedName) || filtered[0];

    this.bodyEl.innerHTML = `
      <div class="bookshelf-layout">
        <div class="filter-bar">
          <input id="repo-search" class="pixel-input" type="search" placeholder="Search ${gh.repos.length} repositories..." value="${escapeHtml(this.repoFilter)}" />
          <div class="chip-row">
            ${langs
              .slice(0, 7)
              .map(
                (lang) => `
              <button class="pixel-btn small ${this.langFilter === lang ? 'accent' : ''}" data-lang="${escapeHtml(lang)}">
                ${escapeHtml(lang)}
              </button>
            `
              )
              .join('')}
          </div>
        </div>
        <div class="bookshelf-grid">
          <div class="repo-list">
            ${
              filtered.length === 0
                ? '<p class="hint-text">No matching repositories.</p>'
                : filtered
                    .slice(0, 24)
                    .map((r) => {
                      const dotColor = LANGUAGE_COLORS[r.language] || LANGUAGE_COLORS.Default;
                      const isSel = selectedRepo && selectedRepo.name === r.name;
                      return `
                        <button class="repo-card ${isSel ? 'selected' : ''}" data-repo="${escapeHtml(r.name)}">
                          <div class="repo-card-top">
                            <strong>${escapeHtml(r.name)}</strong>
                            <span class="lang-tag"><i style="background:${dotColor}"></i>${escapeHtml(r.language || 'Misc')}</span>
                          </div>
                          <p>${escapeHtml(r.description || 'Repository in @' + gh.username)}</p>
                        </button>
                      `;
                    })
                    .join('')
            }
          </div>
          <div class="repo-detail" id="repo-detail-pane">
            ${selectedRepo ? this.buildRepoDetailMarkup(selectedRepo, gh) : '<p>Select a book from the shelf.</p>'}
          </div>
        </div>
      </div>
    `;

    this.bodyEl.querySelector('#repo-search').addEventListener('input', (e) => {
      this.repoFilter = e.target.value;
      this.renderBookshelf(this.store.getState().github);
      const input = this.bodyEl.querySelector('#repo-search');
      if (input) {
        input.focus();
        input.setSelectionRange(this.repoFilter.length, this.repoFilter.length);
      }
    });

    this.bodyEl.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.langFilter = btn.dataset.lang;
        soundService.playCollect();
        this.renderBookshelf(this.store.getState().github);
      });
    });

    this.bodyEl.querySelectorAll('[data-repo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        soundService.playCollect();
        this.store.setWorldState({ selectedRepoName: btn.dataset.repo });
        this.renderBookshelf(this.store.getState().github);
      });
    });

    const loadReadmeBtn = this.bodyEl.querySelector('#btn-load-readme');
    if (loadReadmeBtn && selectedRepo) {
      loadReadmeBtn.addEventListener('click', async () => {
        loadReadmeBtn.disabled = true;
        loadReadmeBtn.textContent = 'LOADING...';
        try {
          const text = await fetchRepoReadme(gh.username, selectedRepo.name);
          this.store.cacheRepoReadme(selectedRepo.full_name, text);
          this.renderBookshelf(this.store.getState().github);
        } catch {
          this.store.cacheRepoReadme(selectedRepo.full_name, 'README.md not found in this repository.');
          this.renderBookshelf(this.store.getState().github);
        }
      });
    }
  }

  buildRepoDetailMarkup(repo, gh) {
    const cachedReadme = gh.readmes[repo.full_name];
    return `
      <h3>${escapeHtml(repo.name)}</h3>
      <div class="meta-pills">
        <span class="pixel-badge small">${escapeHtml(repo.language || 'Code')}</span>
        <span class="pixel-badge small">★ ${repo.stargazers_count || 0}</span>
        <span class="pixel-badge small">⑂ ${repo.forks_count || 0}</span>
      </div>
      <p class="detail-desc">${escapeHtml(repo.description || 'No description provided on GitHub.')}</p>
      <div class="detail-actions">
        <a class="pixel-btn accent small" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener noreferrer">OPEN ON GITHUB ↗</a>
        ${
          repo.homepage
            ? `<a class="pixel-btn small" href="${escapeHtml(repo.homepage)}" target="_blank" rel="noopener noreferrer">LIVE DEMO ↗</a>`
            : ''
        }
        ${!cachedReadme ? `<button class="pixel-btn small" id="btn-load-readme">FETCH README.MD</button>` : ''}
      </div>
      <div class="readme-box">
        ${
          cachedReadme
            ? `<div class="readme-content"><p>${renderMarkdownLite(cachedReadme.slice(0, 2200))}</p></div>`
            : `<p class="hint-text">Click "FETCH README.MD" to pull live documentation directly from GitHub API.</p>`
        }
      </div>
    `;
  }

  renderWorkstation(gh) {
    const langStats = computeLanguageStats(gh.repos);
    const events = gh.events || [];

    this.bodyEl.innerHTML = `
      <div class="stack-panel">
        <div class="section-block">
          <h3>LANGUAGE BREAKDOWN (${gh.repos.length} REPOS)</h3>
          <div class="lang-bars">
            ${langStats
              .slice(0, 7)
              .map(
                (s) => `
              <div class="lang-bar-row">
                <span class="lang-name">${escapeHtml(s.language)}</span>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.max(6, s.percent)}%;background:${s.color}"></div></div>
                <span class="lang-pct">${s.count} (${s.percent}%)</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
        <div class="section-block">
          <h3>RECENT GITHUB ACTIVITY</h3>
          <ul class="event-list">
            ${
              events.length === 0
                ? '<li>No recent public events returned.</li>'
                : events
                    .slice(0, 8)
                    .map(
                      (ev) => `
                  <li>
                    <span class="pixel-badge small">${escapeHtml((ev.type || '').replace('Event', ''))}</span>
                    <strong>${escapeHtml(ev.repo?.name || '')}</strong>
                    <small>${escapeHtml((ev.created_at || '').slice(0, 10))}</small>
                  </li>
                `
                    )
                    .join('')
            }
          </ul>
        </div>
      </div>
    `;
  }

  renderSofaBio(gh) {
    const p = gh.profile || {};
    const customPhoto = this.store.getState().avatar?.customPhotoUrl;
    const photoSrc = customPhoto || p.avatar_url || 'https://avatars.githubusercontent.com/u/176016365?v=4';
    this.bodyEl.innerHTML = `
      <div class="bio-panel">
        <div class="bio-header">
          <img class="pixel-avatar-img" src="${escapeHtml(photoSrc)}" referrerpolicy="no-referrer" alt="${escapeHtml(p.login || gh.username)}" />
          <div>
            <h3>${escapeHtml(p.name || p.login || gh.username)}</h3>
            <p class="bio-handle">@${escapeHtml(p.login || gh.username)}</p>
            <p>${escapeHtml(p.bio || 'CSE-AI Undergraduate · AI/ML, Computer Vision, Full-Stack & UAV Robotics')}</p>
            <div class="meta-pills">
              <span class="pixel-badge small">REPOS: ${p.public_repos ?? gh.repos.length}</span>
              <span class="pixel-badge small">FOLLOWERS: ${p.followers ?? 0}</span>
              <span class="pixel-badge small">FOLLOWING: ${p.following ?? 0}</span>
            </div>
          </div>
        </div>
        <div class="readme-box">
          <div class="readme-content"><p>${renderMarkdownLite((gh.profileReadme || '').slice(0, 2200))}</p></div>
        </div>
        <div class="detail-actions">
          <a class="pixel-btn accent small" href="${escapeHtml(p.html_url || `https://github.com/${gh.username}`)}" target="_blank" rel="noopener noreferrer">VIEW GITHUB PROFILE ↗</a>
        </div>
      </div>
    `;
  }

  renderRetroTV(gh) {
    const mediaRepos = categorizeRepos(gh.repos).webMedia.filter((r) => r.homepage);
    const showcase = mediaRepos.length ? mediaRepos : gh.repos.slice(0, 4);
    let activeIdx = 0;

    const renderChannel = () => {
      const repo = showcase[activeIdx] || showcase[0];
      const hasLive = Boolean(repo?.homepage);
      this.bodyEl.innerHTML = `
        <div class="tv-panel">
          <div class="tv-channels">
            ${showcase
              .slice(0, 6)
              .map(
                (r, idx) => `
              <button class="pixel-btn small ${idx === activeIdx ? 'accent' : ''}" data-ch="${idx}">
                CH${idx + 1}: ${escapeHtml(r.name.slice(0, 14))}
              </button>
            `
              )
              .join('')}
          </div>
          <div class="tv-screen-frame">
            <div class="tv-preview-card" id="tv-preview-stage">
              <div class="tv-scanlines"></div>
              <span class="pixel-badge small">LIVE DEPLOYMENT PREVIEW</span>
              <h3>${escapeHtml(repo?.name || 'Portfolio Channel')}</h3>
              <p>${escapeHtml(repo?.description || 'Interactive web application deployed from GitHub.')}</p>
              <div class="tv-url">${escapeHtml(repo?.homepage || repo?.html_url || '')}</div>
              <div class="detail-actions">
                ${
                  hasLive
                    ? `<button class="pixel-btn accent small" id="btn-embed-iframe">LOAD LIVE IFRAME</button>
                       <a class="pixel-btn small" href="${escapeHtml(repo.homepage)}" target="_blank" rel="noopener noreferrer">LAUNCH FULLSITE ↗</a>`
                    : `<a class="pixel-btn accent small" href="${escapeHtml(repo?.html_url || '#')}" target="_blank" rel="noopener noreferrer">VIEW SOURCE ↗</a>`
                }
              </div>
            </div>
          </div>
        </div>
      `;

      this.bodyEl.querySelectorAll('[data-ch]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeIdx = Number(btn.dataset.ch);
          soundService.playCollect();
          renderChannel();
        });
      });

      const embedBtn = this.bodyEl.querySelector('#btn-embed-iframe');
      if (embedBtn && hasLive) {
        embedBtn.addEventListener('click', () => {
          const stage = this.bodyEl.querySelector('#tv-preview-stage');
          stage.innerHTML = `
            <iframe class="tv-iframe" src="${escapeHtml(repo.homepage)}" title="${escapeHtml(repo.name)}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
          `;
        });
      }
    };

    renderChannel();
  }

  renderDroneLab(gh) {
    const aiRepos = categorizeRepos(gh.repos).aiHardware.slice(0, 4);
    this.bodyEl.innerHTML = `
      <div class="lab-split">
        <div class="lab-repos">
          <h3>AI, COMPUTER VISION & UAV REPOS</h3>
          <div class="chip-grid">
            ${aiRepos
              .map(
                (r) => `
              <a class="repo-card" href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener noreferrer">
                <div class="repo-card-top">
                  <strong>${escapeHtml(r.name)}</strong>
                  <span class="pixel-badge small">${escapeHtml(r.language || 'AI')}</span>
                </div>
                <p>${escapeHtml(r.description || 'AI / Hardware system')}</p>
              </a>
            `
              )
              .join('')}
          </div>
        </div>
        <div id="drone-game-host"></div>
      </div>
    `;

    const gameHost = this.bodyEl.querySelector('#drone-game-host');
    this.cleanupGame = mountDroneCrackScanner(gameHost, this.store);
  }

  renderCliTerminal(state) {
    const gh = state.github;
    this.bodyEl.innerHTML = `
      <div class="cli-wrap">
        <div class="cli-output" id="cli-output">
          <div>MOHILC-OS v2.6 [CONNECTED TO GITHUB: @${escapeHtml(gh.username)}]</div>
          <div>Type <code>help</code> for commands: <code>whoami</code>, <code>ls</code>, <code>stats</code>, <code>time day|night|sunset</code>, <code>clear</code></div>
        </div>
        <form id="cli-form" class="cli-input-row">
          <span>$</span>
          <input id="cli-input" class="pixel-input" type="text" placeholder="Enter command (e.g. ls, stats, whoami)..." autocomplete="off" />
          <button class="pixel-btn accent small" type="submit">RUN</button>
        </form>
      </div>
    `;

    const out = this.bodyEl.querySelector('#cli-output');
    const form = this.bodyEl.querySelector('#cli-form');
    const input = this.bodyEl.querySelector('#cli-input');
    input.focus();

    const appendLine = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      out.appendChild(div);
      out.scrollTop = out.scrollHeight;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      if (!raw) return;
      appendLine(`$ ${raw}`);
      input.value = '';
      soundService.playTone(520, 0.04, 'square', 0.02);

      const [cmd, arg] = raw.toLowerCase().split(/\s+/);
      if (cmd === 'help') {
        appendLine('Commands: whoami | ls | stats | time <day|sunset|night> | clear');
      } else if (cmd === 'whoami') {
        appendLine(`${gh.profile?.name || gh.username} (@${gh.username}) — ${gh.profile?.bio || 'AI & Robotics Developer'}`);
      } else if (cmd === 'ls') {
        appendLine(gh.repos.slice(0, 12).map((r) => `${r.name} [${r.language || 'Misc'}]`).join('  |  '));
      } else if (cmd === 'stats') {
        const top = computeLanguageStats(gh.repos).slice(0, 4).map((l) => `${l.language}:${l.count}`).join(', ');
        appendLine(`Repos: ${gh.repos.length} · Top Stack: ${top}`);
      } else if (cmd === 'time' && ['day', 'sunset', 'night'].includes(arg)) {
        this.store.updateEnvironment({ timeOfDay: arg });
        appendLine(`Environment lighting switched to ${arg.toUpperCase()}.`);
      } else if (cmd === 'clear') {
        out.innerHTML = '';
      } else {
        appendLine(`Unknown command: ${cmd}. Try 'help'.`);
      }
    });
  }

  renderHackathons(gh) {
    const hacks = categorizeRepos(gh.repos).hackathons;
    this.bodyEl.innerHTML = `
      <div class="hack-panel">
        <p class="hint-text">Hackathon prototypes, NASA Space Apps builds, and community automation bots.</p>
        <div class="chip-grid">
          ${hacks
            .map(
              (r) => `
            <a class="repo-card" href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener noreferrer">
              <div class="repo-card-top">
                <strong>🏆 ${escapeHtml(r.name)}</strong>
                <span class="pixel-badge small">${escapeHtml(r.language || 'Project')}</span>
              </div>
              <p>${escapeHtml(r.description || 'Featured hackathon & technical build.')}</p>
            </a>
          `
            )
            .join('')}
        </div>
        <div class="synth-bar">
          <span>8-BIT TROPHY SYNTH:</span>
          ${[261.6, 329.6, 392.0, 523.2, 659.2]
            .map(
              (freq, i) => `<button class="pixel-btn small" data-note="${freq}">NOTE ${i + 1}</button>`
            )
            .join('')}
        </div>
      </div>
    `;

    this.bodyEl.querySelectorAll('[data-note]').forEach((btn) => {
      btn.addEventListener('click', () => {
        soundService.playTone(Number(btn.dataset.note), 0.16, 'square', 0.05);
      });
    });
  }

  renderRepoBucket(gh, bucketKey, subtitle) {
    const items = categorizeRepos(gh.repos)[bucketKey] || [];
    this.bodyEl.innerHTML = `
      <div class="hack-panel">
        <p class="hint-text">${escapeHtml(subtitle)}</p>
        <div class="chip-grid">
          ${items
            .map(
              (r) => `
            <div class="repo-card">
              <div class="repo-card-top">
                <strong>${escapeHtml(r.name)}</strong>
                <span class="pixel-badge small">${escapeHtml(r.language || 'Web')}</span>
              </div>
              <p>${escapeHtml(r.description || 'Repository in @' + gh.username)}</p>
              <div class="detail-actions" style="margin-top:8px">
                <a class="pixel-btn accent small" href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener noreferrer">GITHUB ↗</a>
                ${
                  r.homepage
                    ? `<a class="pixel-btn small" href="${escapeHtml(r.homepage)}" target="_blank" rel="noopener noreferrer">LIVE DEMO ↗</a>`
                    : ''
                }
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  renderEnvironmentPanel(env) {
    this.bodyEl.innerHTML = `
      <div class="env-panel">
        <div class="custom-group">
          <label>LIGHTING & SKY PRESET</label>
          <div class="chip-row">
            ${['day', 'sunset', 'night']
              .map(
                (t) => `
              <button class="pixel-btn ${env.timeOfDay === t ? 'accent' : ''}" data-tod="${t}">
                ${t.toUpperCase()}
              </button>
            `
              )
              .join('')}
          </div>
        </div>
        <div class="custom-group">
          <label>RETRO PIXEL RESOLUTION</label>
          <div class="chip-row">
            ${[1, 2, 3]
              .map(
                (s) => `
              <button class="pixel-btn ${env.pixelScale === s ? 'accent' : ''}" data-px="${s}">
                ${s}X ${s === 1 ? '(HD)' : s === 2 ? '(RETRO)' : '(CHUNKY)'}
              </button>
            `
              )
              .join('')}
          </div>
        </div>
        <div class="custom-group">
          <label>CAMERA PROJECTION MODE</label>
          <div class="chip-row">
            <button class="pixel-btn ${env.cameraMode === 'isometric' ? 'accent' : ''}" data-cam="isometric">ISOMETRIC ORTHO</button>
            <button class="pixel-btn ${env.cameraMode === 'firstPerson' ? 'accent' : ''}" data-cam="firstPerson">1ST-PERSON ORTHO</button>
          </div>
        </div>
      </div>
    `;

    this.bodyEl.querySelectorAll('[data-tod]').forEach((btn) => {
      btn.addEventListener('click', () => {
        soundService.playCollect();
        this.store.updateEnvironment({ timeOfDay: btn.dataset.tod });
        this.renderEnvironmentPanel(this.store.getState().environment);
      });
    });
    this.bodyEl.querySelectorAll('[data-px]').forEach((btn) => {
      btn.addEventListener('click', () => {
        soundService.playCollect();
        this.store.updateEnvironment({ pixelScale: Number(btn.dataset.px) });
        this.renderEnvironmentPanel(this.store.getState().environment);
      });
    });
    this.bodyEl.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        soundService.playCollect();
        this.store.updateEnvironment({ cameraMode: btn.dataset.cam });
        this.renderEnvironmentPanel(this.store.getState().environment);
      });
    });
  }

  renderWorldGuide(gh) {
    const p = gh.profile || {};
    const customPhoto = this.store.getState().avatar?.customPhotoUrl;
    const photoSrc = customPhoto || p.avatar_url || 'https://avatars.githubusercontent.com/u/176016365?v=4';
    const featuredRooms = ROOMS.filter((r) => !['avenue', 'downtown-skyline'].includes(r.id));

    this.bodyEl.innerHTML = `
      <div class="bio-panel">
        <div class="bio-header">
          <img class="pixel-avatar-img" src="${escapeHtml(photoSrc)}" referrerpolicy="no-referrer" alt="${escapeHtml(p.login || gh.username)}" />
          <div>
            <h3>${escapeHtml(p.name || 'Mohil C')} — INTERACTIVE 3D PORTFOLIO</h3>
            <p class="bio-handle">@${escapeHtml(p.login || gh.username)} · ${gh.repos.length} GitHub Repositories</p>
            <p>${escapeHtml(p.bio || 'CSE-AI Undergraduate · AI/ML, Computer Vision, UAV Robotics & Full-Stack Web')}</p>
            <div class="detail-actions" style="margin-top:6px">
              <button class="pixel-btn accent small" id="guide-open-repos">BROWSE ALL ${gh.repos.length} REPOS</button>
              <a class="pixel-btn small" href="${escapeHtml(p.html_url || `https://github.com/${gh.username}`)}" target="_blank" rel="noopener noreferrer">GITHUB PROFILE ↗</a>
            </div>
          </div>
        </div>
        <p class="hint-text">
          Walk with <strong>WASD</strong>, jump with <strong>SPACE</strong>, click the viewport for <strong>Pointer Lock</strong>, or jump straight to any themed zone below:
        </p>
        <div class="chip-grid">
          ${featuredRooms
            .map((r) => {
              const roomTriggers = INTERACTIVE_TRIGGERS.filter((t) => t.roomId === r.id);
              return `
                <div class="repo-card">
                  <div class="repo-card-top">
                    <strong>${escapeHtml(r.name)}</strong>
                    <button class="pixel-btn accent small" data-go-room="${escapeHtml(r.id)}">GO THERE ➔</button>
                  </div>
                  <p>${escapeHtml(r.subtitle)}</p>
                  <p style="color:var(--accent);margin-top:4px">${escapeHtml(roomTriggers.map((t) => t.title).join(' · '))}</p>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    this.bodyEl.querySelector('#guide-open-repos').addEventListener('click', () => {
      this.open({
        id: 'quick-repos',
        roomId: 'study',
        title: 'ALL GITHUB REPOSITORIES',
        kind: 'github_repos',
        markerPos: [0, 1.5, 0],
      });
    });

    this.bodyEl.querySelectorAll('[data-go-room]').forEach((btn) => {
      btn.addEventListener('click', () => {
        soundService.playRoomEnter();
        if (this.onTeleportRoom) this.onTeleportRoom(btn.dataset.goRoom);
      });
    });
  }
}
