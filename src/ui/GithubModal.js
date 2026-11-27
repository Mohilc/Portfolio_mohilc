import { soundService } from '../services/soundService.js';

/**
 * Modal allowing visitors to view current GitHub sync info or switch to any GitHub
 * username / featured repository to dynamically re-populate the 3D house.
 */
export class GithubModal {
  constructor(modalEl, bodyEl, closeBtn, store, onSyncUser) {
    this.modalEl = modalEl;
    this.bodyEl = bodyEl;
    this.store = store;
    this.onSyncUser = onSyncUser;

    closeBtn.addEventListener('click', () => this.close());
  }

  open() {
    this.store.setWorldState({ activeModal: 'github' });
    this.render();
    this.modalEl.classList.remove('hidden');
    soundService.playOpenDrawer();
  }

  close() {
    if (this.store.getState().world.activeModal === 'github') {
      this.store.setWorldState({ activeModal: null });
    }
    this.modalEl.classList.add('hidden');
    soundService.playClose();
  }

  render() {
    const gh = this.store.getState().github;

    this.bodyEl.innerHTML = `
      <div class="github-connector">
        <div class="info-banner">
          <strong>CONNECTED ACCOUNT:</strong> @${gh.username}
          <span class="pixel-badge small">${(gh.source || 'loading').toUpperCase()}</span>
          <span>(${gh.repos.length} repositories loaded)</span>
        </div>
        <form id="github-connect-form" class="connect-form">
          <div class="custom-group">
            <label for="gh-user-input">GITHUB USERNAME</label>
            <input id="gh-user-input" class="pixel-input" type="text" value="${gh.username}" placeholder="e.g. Mohilc" required />
          </div>
          <div class="custom-group">
            <label for="gh-repo-input">FEATURED README REPO (OPTIONAL)</label>
            <input id="gh-repo-input" class="pixel-input" type="text" value="${gh.featuredRepo || ''}" placeholder="Defaults to username profile repo" />
          </div>
          <div class="modal-footer">
            <button type="button" class="pixel-btn" id="gh-restore-mohilc">USE MOHILC</button>
            <button type="submit" class="pixel-btn accent">SYNC & POPULATE 3D HOUSE</button>
          </div>
        </form>
        ${gh.error ? `<p class="warn-text">Note: ${gh.error} (Using fallback/cached data gracefully)</p>` : ''}
      </div>
    `;

    const form = this.bodyEl.querySelector('#github-connect-form');
    const userInput = this.bodyEl.querySelector('#gh-user-input');
    const repoInput = this.bodyEl.querySelector('#gh-repo-input');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nextUser = userInput.value.trim() || 'Mohilc';
      const nextRepo = repoInput.value.trim() || nextUser;
      await this.onSyncUser(nextUser, nextRepo, true);
      this.close();
    });

    this.bodyEl.querySelector('#gh-restore-mohilc').addEventListener('click', async () => {
      await this.onSyncUser('Mohilc', 'mohilc', true);
      this.close();
    });
  }
}
