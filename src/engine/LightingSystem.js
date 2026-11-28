import * as THREE from 'three';

const PRESETS = {
  day: {
    sky: 0x7dd3fc,
    fog: 0xbae6fd,
    hemiSky: 0xf0f9ff,
    hemiGround: 0x5c7d48,
    hemiIntensity: 1.38,
    dirColor: 0xfff8e6,
    dirIntensity: 2.55,
    dirPos: [18, 28, 15],
    interiorIntensity: 1.15,
    emissiveBoost: 0.55,
    cloudOpacity: 0.92,
    starOpacity: 0.0,
  },
  sunset: {
    sky: 0xe76f51,
    fog: 0xf4a261,
    hemiSky: 0xffcdb2,
    hemiGround: 0x4a3b58,
    hemiIntensity: 1.05,
    dirColor: 0xffa86b,
    dirIntensity: 2.2,
    dirPos: [-24, 11, 12],
    interiorIntensity: 1.9,
    emissiveBoost: 1.05,
    cloudOpacity: 0.78,
    starOpacity: 0.25,
  },
  night: {
    sky: 0x0f172a,
    fog: 0x1e293b,
    hemiSky: 0x475569,
    hemiGround: 0x111827,
    hemiIntensity: 0.75,
    dirColor: 0x93c5fd,
    dirIntensity: 1.15,
    dirPos: [-14, 24, -14],
    interiorIntensity: 3.3,
    emissiveBoost: 1.65,
    cloudOpacity: 0.22,
    starOpacity: 1.0,
  },
};

/**
 * Manages atmospheric Day / Sunset / Night lighting, high-res soft shadows,
 * drifting pixel clouds, night starfield, and warm interior room point lights.
 */
export class LightingSystem {
  constructor(scene, sharedAtlasMaterial) {
    this.scene = scene;
    this.sharedAtlasMaterial = sharedAtlasMaterial;

    this.scene.background = new THREE.Color(PRESETS.day.sky);
    this.scene.fog = new THREE.Fog(PRESETS.day.fog, 58, 150);

    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x4d6b3c, 1.05);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff3d1, 2.35);
    this.dirLight.position.set(18, 28, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(2048, 2048);
    this.dirLight.shadow.camera.near = 2;
    this.dirLight.shadow.camera.far = 110;
    const d = 36;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);
    this.shadowCenter = new THREE.Vector3(0, 0, 0);
    this.dirOffset = new THREE.Vector3(...PRESETS.day.dirPos);

    // Subtle cool sky bounce fill light for realistic PBR shadow tinting
    this.fillLight = new THREE.DirectionalLight(0x93c5fd, 0.35);
    this.fillLight.position.set(-16, 10, -12);
    this.scene.add(this.fillLight);

    // Interior, patio & neighborhood/city street point lights
    this.roomLights = [];
    const lightSpecs = [
      { pos: [-5.4, 3.2, 4.5], color: 0xffd180, distance: 13 }, // Living lounge warm lamp
      { pos: [-6.5, 3.4, -5], color: 0xbae6fd, distance: 13 }, // Study desk light
      { pos: [6.0, 3.4, -5], color: 0x67e8f9, distance: 13 }, // AI Lab cyan glow
      { pos: [6.5, 3.3, 4.8], color: 0xf472b6, distance: 13 }, // Arcade neon glow
      { pos: [-4.5, 2.5, 13.0], color: 0xfbbf24, distance: 11 }, // Patio sundial lantern
      { pos: [0, 5.2, 20.0], color: 0xfef08a, distance: 18 }, // Avenue North streetlamp
      { pos: [0, 5.2, 40.0], color: 0x7dd3fc, distance: 20 }, // City Fountain Plaza glow
      { pos: [28, 4.5, 13.5], color: 0xfdba74, distance: 16 }, // Byte Cafe warm lights
      { pos: [32, 6.0, 36.0], color: 0x38bdf8, distance: 18 }, // Innovation Tower lobby
    ];

    for (const spec of lightSpecs) {
      const pt = new THREE.PointLight(spec.color, 0.65, spec.distance, 1.5);
      pt.position.set(...spec.pos);
      this.scene.add(pt);
      this.roomLights.push(pt);
    }

    this.cloudsGroup = new THREE.Group();
    this.cloudsGroup.name = 'PixelClouds';
    this.cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, flatShading: true });
    this.buildClouds();
    this.scene.add(this.cloudsGroup);

    this.starMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3, transparent: true, opacity: 0.0 });
    this.starsGroup = new THREE.Group();
    this.buildStars();
    this.scene.add(this.starsGroup);

    this.currentPreset = 'day';
    this.apply('day', true);
  }

  buildClouds() {
    const cloudPositions = [
      [-18, 16, -16],
      [-4, 17, -19],
      [14, 15.5, -15],
      [22, 16.5, -6],
    ];
    for (const [cx, cy, cz] of cloudPositions) {
      const cluster = new THREE.Group();
      cluster.position.set(cx, cy, cz);
      const blocks = [
        [0, 0, 0, 4.4, 1.0, 2.4],
        [-1.3, 0.65, 0, 2.2, 0.9, 1.8],
        [1.1, 0.5, 0.2, 2.0, 0.8, 1.6],
      ];
      for (const [bx, by, bz, w, h, d] of blocks) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.cloudMat);
        m.position.set(bx, by, bz);
        cluster.add(m);
      }
      cluster.userData.speed = 0.35 + Math.random() * 0.35;
      this.cloudsGroup.add(cluster);
    }
  }

  buildStars() {
    const starGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    for (let i = 0; i < 42; i += 1) {
      const m = new THREE.Mesh(starGeo, this.starMat);
      m.position.set((Math.random() - 0.5) * 58, 14 + Math.random() * 10, -24 - Math.random() * 14);
      this.starsGroup.add(m);
    }
  }

  apply(timeOfDay, immediate = false) {
    const target = PRESETS[timeOfDay] || PRESETS.day;
    this.currentPreset = timeOfDay;

    if (immediate) {
      this.scene.background.setHex(target.sky);
      this.scene.fog.color.setHex(target.fog);
      this.hemiLight.color.setHex(target.hemiSky);
      this.hemiLight.groundColor.setHex(target.hemiGround);
      this.hemiLight.intensity = target.hemiIntensity;
      this.dirLight.color.setHex(target.dirColor);
      this.dirLight.intensity = target.dirIntensity;
      this.dirLight.position.set(...target.dirPos);
      this.cloudMat.opacity = target.cloudOpacity;
      this.starMat.opacity = target.starOpacity;
      for (const light of this.roomLights) {
        light.intensity = target.interiorIntensity;
      }
      if (this.sharedAtlasMaterial) {
        this.sharedAtlasMaterial.emissiveIntensity = target.emissiveBoost;
      }
    }
  }

  setShadowCenter(x, z) {
    // Snap to 0.5-unit grid to prevent shadow edge shimmer while exploring the city
    this.shadowCenter.set(Math.round(x * 2) * 0.5, 0, Math.round(z * 2) * 0.5);
  }

  update(dt) {
    const target = PRESETS[this.currentPreset] || PRESETS.day;
    const lerpSpeed = Math.min(1, dt * 4.5);

    this.scene.background.lerp(new THREE.Color(target.sky), lerpSpeed);
    this.scene.fog.color.lerp(new THREE.Color(target.fog), lerpSpeed);
    this.hemiLight.color.lerp(new THREE.Color(target.hemiSky), lerpSpeed);
    this.hemiLight.groundColor.lerp(new THREE.Color(target.hemiGround), lerpSpeed);
    this.hemiLight.intensity += (target.hemiIntensity - this.hemiLight.intensity) * lerpSpeed;

    this.dirLight.color.lerp(new THREE.Color(target.dirColor), lerpSpeed);
    this.dirLight.intensity += (target.dirIntensity - this.dirLight.intensity) * lerpSpeed;
    this.dirOffset.lerp(new THREE.Vector3(...target.dirPos), lerpSpeed);
    this.dirLight.target.position.copy(this.shadowCenter);
    this.dirLight.position.copy(this.shadowCenter).add(this.dirOffset);

    this.cloudMat.opacity += (target.cloudOpacity - this.cloudMat.opacity) * lerpSpeed;
    this.starMat.opacity += (target.starOpacity - this.starMat.opacity) * lerpSpeed;

    for (const cloud of this.cloudsGroup.children) {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 28) cloud.position.x = -28;
    }

    for (const light of this.roomLights) {
      light.intensity += (target.interiorIntensity - light.intensity) * lerpSpeed;
    }

    if (this.sharedAtlasMaterial) {
      this.sharedAtlasMaterial.emissiveIntensity +=
        (target.emissiveBoost - this.sharedAtlasMaterial.emissiveIntensity) * lerpSpeed;
    }
  }
}
