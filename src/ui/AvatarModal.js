import { soundService } from '../services/soundService.js';

const SKIN_TONES = ['#f9d9b4', '#f1c27d', '#c68642', '#8d5524'];
const HAIR_STYLES = ['spiky', 'bob', 'cap', 'mohawk'];
const HAIR_COLORS = ['#1f2430', '#4a2c2a', '#d97706', '#38bdf8', '#ec4899'];
const OUTFIT_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#a855f7', '#f59e0b', '#1e293b'];
const PANTS_COLORS = ['#283149', '#1e293b', '#475569', '#3f2e21'];
const ACCESSORIES = ['none', 'visor', 'headphones', 'jetpack'];

/**
 * Interactive Avatar Customization Modal wired directly to the reactive state store.
 */
export class AvatarModal {
  constructor(modalEl, bodyEl, closeBtn, store) {
    this.modalEl = modalEl;
    this.bodyEl = bodyEl;
    this.store = store;

    closeBtn.addEventListener('click', () => this.close());
  }

  open() {
    this.store.setWorldState({ activeModal: 'avatar' });
    this.render();
    this.modalEl.classList.remove('hidden');
    soundService.playOpenDrawer();
  }

  close() {
    if (this.store.getState().world.activeModal === 'avatar') {
      this.store.setWorldState({ activeModal: null });
    }
    this.modalEl.classList.add('hidden');
    soundService.playClose();
  }

  render() {
    const avatar = this.store.getState().avatar;

    const swatchRow = (label, field, colors, current) => `
      <div class="custom-group">
        <label>${label}</label>
        <div class="swatch-row">
          ${colors
            .map(
              (c) => `
            <button class="swatch-btn ${c === current ? 'active' : ''}"
              data-field="${field}" data-value="${c}"
              style="background:${c}" title="${c}"></button>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    const chipRow = (label, field, options, current) => `
      <div class="custom-group">
        <label>${label}</label>
        <div class="chip-row">
          ${options
            .map(
              (opt) => `
            <button class="pixel-btn small ${opt === current ? 'accent' : ''}"
              data-field="${field}" data-value="${opt}">
              ${opt.toUpperCase()}
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    this.bodyEl.innerHTML = `
      <div class="avatar-customizer">
        <p class="hint-text">Changes apply live to your 3D pixel avatar inside the house and persist in local storage.</p>
        ${swatchRow('SKIN TONE', 'skinTone', SKIN_TONES, avatar.skinTone)}
        ${chipRow('HEAD / HAIR STYLE', 'hairStyle', HAIR_STYLES, avatar.hairStyle)}
        ${swatchRow('HAIR COLOR', 'hairColor', HAIR_COLORS, avatar.hairColor)}
        ${swatchRow('JACKET / SHIRT', 'outfitColor', OUTFIT_COLORS, avatar.outfitColor)}
        ${swatchRow('PANTS COLOR', 'pantsColor', PANTS_COLORS, avatar.pantsColor)}
        ${chipRow('GEAR / ACCESSORY', 'accessory', ACCESSORIES, avatar.accessory)}
        <div class="custom-group">
          <label for="avatar-photo-upload">YOUR PORTRAIT PHOTO (WALL FRAMES & HUD)</label>
          <div class="chip-row">
            <input id="avatar-photo-upload" type="file" accept="image/*" style="display:none" />
            <button class="pixel-btn small accent" id="btn-upload-photo" type="button">UPLOAD PHOTO</button>
            ${
              avatar.customPhotoUrl
                ? '<button class="pixel-btn small" id="btn-clear-photo" type="button">USE GITHUB AVATAR</button>'
                : ''
            }
          </div>
        </div>
        <div class="modal-footer">
          <button class="pixel-btn" id="avatar-reset-btn">RESET DEFAULT</button>
          <button class="pixel-btn accent" id="avatar-done-btn">DONE</button>
        </div>
      </div>
    `;

    this.bodyEl.querySelectorAll('[data-field]').forEach((btn) => {
      btn.addEventListener('click', () => {
        soundService.playCollect();
        this.store.updateAvatar({ [btn.dataset.field]: btn.dataset.value });
        this.render();
      });
    });

    const uploadInput = this.bodyEl.querySelector('#avatar-photo-upload');
    this.bodyEl.querySelector('#btn-upload-photo').addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const cvs = document.createElement('canvas');
          cvs.width = 160;
          cvs.height = 160;
          const ctx = cvs.getContext('2d');
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 160, 160);
          soundService.playCollect();
          this.store.updateAvatar({ customPhotoUrl: cvs.toDataURL('image/jpeg', 0.85) });
          this.render();
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });

    const clearPhotoBtn = this.bodyEl.querySelector('#btn-clear-photo');
    if (clearPhotoBtn) {
      clearPhotoBtn.addEventListener('click', () => {
        soundService.playClose();
        this.store.updateAvatar({ customPhotoUrl: '' });
        this.render();
      });
    }

    this.bodyEl.querySelector('#avatar-reset-btn').addEventListener('click', () => {
      soundService.playClose();
      this.store.resetAvatar();
      this.render();
    });

    this.bodyEl.querySelector('#avatar-done-btn').addEventListener('click', () => this.close());
  }
}
