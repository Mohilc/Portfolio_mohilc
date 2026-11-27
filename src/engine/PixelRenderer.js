import * as THREE from 'three';

/**
 * Custom WebGLRenderer configured for realistic HD-2D / PBR pixel-art 3D:
 * - No MSAA blur (antialias: false) + crisp NearestFilter pixel textures
 * - PCFSoftShadowMap (2048x2048) + ACESFilmicToneMapping for realistic lighting & depth
 * - Dynamic pixelScale (1 = Crisp HD PBR pixels, 2 = Retro 2x, 3 = Chunky 3x)
 */
export class PixelRenderer {
  constructor(canvas, initialPixelScale = 1) {
    this.canvas = canvas;
    this.pixelScale = initialPixelScale;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.canvas.style.imageRendering = 'pixelated';
    this.resize(window.innerWidth, window.innerHeight);
  }

  setPixelScale(scale) {
    this.pixelScale = Math.max(1, Math.min(4, Math.round(scale)));
    this.resize(window.innerWidth, window.innerHeight);
  }

  resize(viewportWidth, viewportHeight) {
    const internalWidth = Math.max(240, Math.floor(viewportWidth / this.pixelScale));
    const internalHeight = Math.max(180, Math.floor(viewportHeight / this.pixelScale));
    this.renderer.setPixelRatio(this.pixelScale === 1 ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    this.renderer.setSize(internalWidth, internalHeight, false);
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  getInfo() {
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      textures: this.renderer.info.memory.textures,
      geometries: this.renderer.info.memory.geometries,
    };
  }

  dispose() {
    this.renderer.dispose();
  }
}
