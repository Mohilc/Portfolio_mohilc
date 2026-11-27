import * as THREE from 'three';
import { applyAtlasUVs, TILES } from '../engine/TextureAtlas.js';
import { categorizeRepos, computeLanguageStats } from '../services/githubService.js';
import { ObjectPool } from '../engine/ObjectPool.js';

function languageToBookTile(language) {
  switch (language) {
    case 'Python':
    case 'Jupyter Notebook':
      return TILES.BOOK_BLUE;
    case 'TypeScript':
    case 'JavaScript':
      return TILES.BOOK_GOLD;
    case 'HTML':
    case 'CSS':
      return TILES.BOOK_RED;
    default:
      return TILES.BOOK_GREEN;
  }
}

/**
 * Dynamically populates 3D rooms (Bookshelf spines, Porch Signboard, and
 * Framed 3D Profile Photo Portraits) using live GitHub data and an ObjectPool.
 */
export class WorldPopulator {
  constructor(houseBuilder, atlas) {
    this.house = houseBuilder;
    this.atlas = atlas;

    this.bookGeo = new THREE.BoxGeometry(0.26, 0.62, 0.56);
    this.bookPool = new ObjectPool(
      () => {
        const geo = this.bookGeo.clone();
        const mesh = new THREE.Mesh(geo, atlas.sharedMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.visible = false;
        this.house.dynamicBookGroup.add(mesh);
        return mesh;
      },
      (mesh) => {
        mesh.visible = false;
      },
      24,
      48
    );

    this.activeBooks = [];

    // Grounded Porch Welcome Signboard on post (right of front door)
    this.signCanvas = document.createElement('canvas');
    this.signCanvas.width = 256;
    this.signCanvas.height = 64;
    this.signTex = new THREE.CanvasTexture(this.signCanvas);
    this.signTex.magFilter = THREE.NearestFilter;
    this.signTex.minFilter = THREE.NearestFilter;
    this.signTex.generateMipmaps = false;
    this.signTex.colorSpace = THREE.SRGBColorSpace;

    const signMat = new THREE.MeshBasicMaterial({ map: this.signTex });
    this.signMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 0.16), signMat);
    this.signMesh.position.set(2.9, 1.75, 10.65);
    this.signMesh.castShadow = true;
    const signPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 1.5, 0.24),
      new THREE.MeshLambertMaterial({ color: 0x5e3a24 })
    );
    signPost.position.set(2.9, 0.75, 10.65);
    signPost.castShadow = true;
    this.house.root.add(this.signMesh, signPost);

    // 3D Framed Profile Photo Texture (Porch Welcome Portrait + Lounge Interior Wall + City Plaza)
    this.photoCanvas = document.createElement('canvas');
    this.photoCanvas.width = 160;
    this.photoCanvas.height = 192;
    this.photoTex = new THREE.CanvasTexture(this.photoCanvas);
    this.photoTex.magFilter = THREE.NearestFilter;
    this.photoTex.minFilter = THREE.NearestFilter;
    this.photoTex.generateMipmaps = false;
    this.photoTex.colorSpace = THREE.SRGBColorSpace;
    this.lastAvatarUrl = '';

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x5e3a24, roughness: 0.55, flatShading: true });
    const photoMat = new THREE.MeshBasicMaterial({ map: this.photoTex });

    const buildFramedPortrait = (x, y, z, width, height, withStand = false) => {
      const group = new THREE.Group();
      const backing = new THREE.Mesh(new THREE.BoxGeometry(width + 0.24, height + 0.24, 0.14), frameMat);
      backing.castShadow = true;
      const picture = new THREE.Mesh(new THREE.PlaneGeometry(width, height), photoMat);
      picture.position.z = 0.08;
      group.add(backing, picture);
      group.position.set(x, y, z);
      this.house.root.add(group);

      if (withStand) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, y - height / 2 + 0.15, 0.24), frameMat);
        post.position.set(x, (y - height / 2) / 2, z - 0.04);
        post.castShadow = true;
        this.house.root.add(post);
      }
      return group;
    };

    // 1. Front Porch Photo Frame (immediately visible on spawn!)
    buildFramedPortrait(-2.9, 1.9, 10.65, 1.45, 1.75, true);
    // 2. Living Lounge Interior Wall Portrait (always visible above lounge!)
    buildFramedPortrait(-2.3, 2.35, 0.3, 1.5, 1.8, false);
    // 3. City Plaza Welcome Portrait Monument
    buildFramedPortrait(-4.6, 2.0, 34.0, 1.5, 1.8, true);

    this.renderProfilePhoto('https://avatars.githubusercontent.com/u/176016365?v=4', 'Mohilc');
  }

  populate(githubState, customPhotoUrl = '') {
    const repos = githubState.repos || [];
    const profile = githubState.profile;
    const username = githubState.username || 'Mohilc';

    for (const book of this.activeBooks) {
      this.bookPool.release(book);
    }
    this.activeBooks = [];

    const nonPooled = this.house.dynamicBookGroup.children.filter(
      (child) => !this.bookPool.freeList.includes(child) && !this.bookPool.activeSet.has(child)
    );
    for (const child of nonPooled) {
      if (child.geometry) child.geometry.dispose();
      this.house.dynamicBookGroup.remove(child);
    }

    const displayRepos = repos.slice(0, 36);
    const shelfYs = [1.18, 2.08, 2.98];

    displayRepos.forEach((repo, index) => {
      const mesh = this.bookPool.acquire();
      if (!mesh) return;
      const shelfIdx = Math.floor(index / 12);
      const slotIdx = index % 12;
      const tile = languageToBookTile(repo.language);
      applyAtlasUVs(mesh.geometry, tile);
      mesh.position.set(-7.65 + slotIdx * 0.3, shelfYs[shelfIdx], -8.85);
      mesh.rotation.z = ((index % 3) - 1) * 0.04;
      mesh.visible = true;
      mesh.userData.repoName = repo.name;
      this.activeBooks.push(mesh);
    });

    this.renderSignboard(username, profile, repos);
    const avatarUrl =
      customPhotoUrl || profile?.avatar_url || 'https://avatars.githubusercontent.com/u/176016365?v=4';
    this.renderProfilePhoto(avatarUrl, profile?.name || username);
  }

  drawPhotoFrameBackdrop(displayName) {
    const ctx = this.photoCanvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 160, 192);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, 152, 184);

    // Fallback pixel avatar portrait until image finishes loading
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(14, 14, 132, 132);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(46, 98, 68, 48);
    ctx.fillStyle = '#f1c27d';
    ctx.fillRect(54, 46, 52, 52);
    ctx.fillStyle = '#1f2430';
    ctx.fillRect(50, 36, 60, 18);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(66, 66, 8, 10);
    ctx.fillRect(86, 66, 8, 10);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`@${String(displayName || 'MOHILC').slice(0, 12).toUpperCase()}`, 80, 173);
    ctx.textAlign = 'left';
    this.photoTex.needsUpdate = true;
  }

  renderProfilePhoto(avatarUrl, displayName) {
    this.drawPhotoFrameBackdrop(displayName);
    if (!avatarUrl || avatarUrl === this.lastAvatarUrl) {
      if (this.cachedImg) {
        const ctx = this.photoCanvas.getContext('2d');
        ctx.drawImage(this.cachedImg, 14, 14, 132, 132);
        this.photoTex.needsUpdate = true;
      }
      return;
    }

    this.lastAvatarUrl = avatarUrl;
    const img = new Image();
    if (!avatarUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
    }
    img.onload = () => {
      this.cachedImg = img;
      const ctx = this.photoCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 14, 14, 132, 132);
      this.photoTex.needsUpdate = true;
    };
    img.onerror = () => {
      // Fallback pixel portrait stays visible cleanly
    };
    if (avatarUrl.startsWith('data:')) {
      img.src = avatarUrl;
    } else {
      const sep = avatarUrl.includes('?') ? '&' : '?';
      img.src = `${avatarUrl}${sep}s=256`;
    }
  }

  renderSignboard(username, profile, repos) {
    const ctx = this.signCanvas.getContext('2d');
    const langStats = computeLanguageStats(repos);
    const topLang = langStats[0]?.language || 'AI / WEB';
    const categories = categorizeRepos(repos);

    ctx.fillStyle = '#181c2b';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 60);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`@${(profile?.login || username).toUpperCase()}`, 14, 25);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      `${profile?.public_repos ?? repos.length} REPOS · ${topLang.toUpperCase()} · ${categories.hackathons.length} HACK`,
      14,
      48
    );

    this.signTex.needsUpdate = true;
  }

  dispose() {
    this.bookPool.releaseAll();
    this.bookGeo.dispose();
    this.signTex.dispose();
    this.photoTex.dispose();
    this.signMesh.geometry.dispose();
    this.signMesh.material.dispose();
  }
}
