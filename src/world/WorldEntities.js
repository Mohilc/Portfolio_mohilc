import * as THREE from 'three';

function mat(color, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 0.45 : 0,
    roughness: 0.7,
    flatShading: true,
  });
}

function box(w, h, d, color, x = 0, y = 0, z = 0, emissive = 0x000000) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, emissive));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Populates the open world with living 3D pixel creatures and citizens:
 * - Loyal wagging-tail Dog trotting in the homestead yard & park
 * - Flock of flapping pixel Birds flying over Munnar hills, house & city plaza
 * - Walking City Citizens strolling sidewalks, cafe & plaza
 * - Floating Meiyon/FOSS Helper Bot hovering near the Study & Tech Plaza
 */
export class WorldEntities {
  constructor(scene) {
    this.root = new THREE.Group();
    this.root.name = 'LivingWorldEntities';
    scene.add(this.root);

    this.dogs = [];
    this.birds = [];
    this.npcs = [];
    this.helperBot = null;

    this.buildDogs();
    this.buildBirds();
    this.buildCitizens();
    this.buildHelperBot();
  }

  buildDogs() {
    const dogConfigs = [
      { cx: -6.5, cz: 15.2, rx: 3.2, rz: 1.6, speed: 0.75, bodyColor: 0xd97706, earColor: 0x78350f },
      { cx: -34.0, cz: 10.5, rx: 4.5, rz: 2.5, speed: 0.9, bodyColor: 0xfef3c7, earColor: 0x92400e },
    ];

    for (const cfg of dogConfigs) {
      const dog = new THREE.Group();
      const torso = box(0.42, 0.36, 0.72, cfg.bodyColor, 0, 0.36, 0);
      const head = box(0.38, 0.34, 0.36, cfg.bodyColor, 0, 0.56, 0.38);
      const snout = box(0.22, 0.16, 0.18, 0x1e293b, 0, 0.48, 0.58);
      const earL = box(0.1, 0.18, 0.12, cfg.earColor, -0.18, 0.66, 0.36);
      const earR = box(0.1, 0.18, 0.12, cfg.earColor, 0.18, 0.66, 0.36);
      const collar = box(0.4, 0.08, 0.12, 0xef4444, 0, 0.46, 0.25);

      const tailPivot = new THREE.Group();
      tailPivot.position.set(0, 0.48, -0.36);
      const tail = box(0.1, 0.28, 0.1, cfg.earColor, 0, 0.12, -0.06);
      tailPivot.add(tail);

      const legs = [];
      for (const [lx, lz] of [[-0.14, 0.24], [0.14, 0.24], [-0.14, -0.24], [0.14, -0.24]]) {
        const leg = box(0.12, 0.24, 0.12, cfg.bodyColor, lx, 0.12, lz);
        dog.add(leg);
        legs.push(leg);
      }

      dog.add(torso, head, snout, earL, earR, collar, tailPivot);
      this.root.add(dog);
      this.dogs.push({ group: dog, tailPivot, legs, cfg, phase: Math.random() * Math.PI * 2 });
    }
  }

  buildBirds() {
    const birdSpecs = [
      { cx: 0, cy: 8.5, cz: -12, radius: 14, speed: 0.65, color: 0xf8fafc },
      { cx: -6, cy: 9.2, cz: -10, radius: 11, speed: 0.78, color: 0x38bdf8 },
      { cx: 8, cy: 10.0, cz: 8, radius: 16, speed: 0.58, color: 0xfacc15 },
      { cx: -30, cy: 11.5, cz: 6, radius: 13, speed: 0.72, color: 0xf8fafc },
      { cx: 28, cy: 13.0, cz: 26, radius: 15, speed: 0.62, color: 0xfb923c },
    ];

    for (let i = 0; i < birdSpecs.length; i += 1) {
      const s = birdSpecs[i];
      const bird = new THREE.Group();
      const body = box(0.24, 0.18, 0.48, s.color, 0, 0, 0);
      const beak = box(0.1, 0.08, 0.14, 0xf97316, 0, 0, 0.28);

      const wingL = new THREE.Group();
      wingL.position.set(-0.12, 0.04, 0);
      wingL.add(box(0.42, 0.05, 0.22, s.color, -0.21, 0, 0));

      const wingR = new THREE.Group();
      wingR.position.set(0.12, 0.04, 0);
      wingR.add(box(0.42, 0.05, 0.22, s.color, 0.21, 0, 0));

      bird.add(body, beak, wingL, wingR);
      this.root.add(bird);
      this.birds.push({ group: bird, wingL, wingR, spec: s, phase: i * 1.3 });
    }
  }

  buildCitizens() {
    const npcPaths = [
      // Sidewalk stroller along VisionSafe Ave North
      { x0: -26, z0: 19.0, x1: 26, z1: 19.0, speed: 2.2, shirt: 0xec4899, hair: 0x1e293b, skin: 0xf1c27d },
      // Sidewalk stroller along Avenue South
      { x0: 28, z0: 29.0, x1: -24, z1: 29.0, speed: 2.5, shirt: 0x22c55e, hair: 0x78350f, skin: 0xc68642 },
      // City Fountain Plaza visitor circling the fountain
      { cx: 0, cz: 40, radius: 5.8, speed: 0.48, shirt: 0x6366f1, hair: 0x0f172a, skin: 0xf9d9b4 },
      // Hoshiko Cafe patron walking near outdoor tables
      { x0: 23, z0: 16.0, x1: 38, z1: 16.0, speed: 1.8, shirt: 0xf59e0b, hair: 0x4a2c2a, skin: 0xf1c27d },
      // Sports Park jogger
      { cx: -34, cz: 4.0, radius: 6.2, speed: 0.72, shirt: 0xef4444, hair: 0x0f172a, skin: 0x8d5524 },
    ];

    for (let i = 0; i < npcPaths.length; i += 1) {
      const p = npcPaths[i];
      const npc = new THREE.Group();
      const legL = box(0.2, 0.56, 0.2, 0x1e293b, -0.13, 0.28, 0);
      const legR = box(0.2, 0.56, 0.2, 0x1e293b, 0.13, 0.28, 0);
      const torso = box(0.5, 0.62, 0.28, p.shirt, 0, 0.88, 0);
      const armL = box(0.16, 0.5, 0.18, p.shirt, -0.34, 0.88, 0);
      const armR = box(0.16, 0.5, 0.18, p.shirt, 0.34, 0.88, 0);
      const head = box(0.46, 0.46, 0.46, p.skin, 0, 1.44, 0);
      const hair = box(0.5, 0.18, 0.5, p.hair, 0, 1.66, 0);
      npc.add(legL, legR, torso, armL, armR, head, hair);
      this.root.add(npc);
      this.npcs.push({ group: npc, legL, legR, armL, armR, path: p, phase: i * 1.7 });
    }
  }

  buildHelperBot() {
    this.helperBot = new THREE.Group();
    const body = box(0.55, 0.55, 0.55, 0x0ea5e9, 0, 0, 0);
    const face = box(0.44, 0.24, 0.08, 0x0f172a, 0, 0.04, 0.28);
    const eyeL = box(0.09, 0.09, 0.05, 0x4ade80, -0.1, 0.05, 0.32, 0x22c55e);
    const eyeR = box(0.09, 0.09, 0.05, 0x4ade80, 0.1, 0.05, 0.32, 0x22c55e);
    const antenna = box(0.06, 0.25, 0.06, 0x94a3b8, 0, 0.38, 0);
    const bulb = box(0.12, 0.12, 0.12, 0xfacc15, 0, 0.52, 0, 0xfacc15);
    this.helperBot.add(body, face, eyeL, eyeR, antenna, bulb);
    this.root.add(this.helperBot);
  }

  update(elapsed) {
    // Dogs trotting & tail wagging
    for (const d of this.dogs) {
      const t = elapsed * d.cfg.speed + d.phase;
      const x = d.cfg.cx + Math.cos(t) * d.cfg.rx;
      const z = d.cfg.cz + Math.sin(t) * d.cfg.rz;
      const dx = -Math.sin(t) * d.cfg.rx;
      const dz = Math.cos(t) * d.cfg.rz;
      d.group.position.set(x, 0, z);
      d.group.rotation.y = Math.atan2(dx, dz);
      d.tailPivot.rotation.z = Math.sin(elapsed * 14 + d.phase) * 0.45;
      const legSwing = Math.sin(elapsed * 10 + d.phase) * 0.35;
      d.legs[0].rotation.x = legSwing;
      d.legs[1].rotation.x = -legSwing;
      d.legs[2].rotation.x = -legSwing;
      d.legs[3].rotation.x = legSwing;
    }

    // Birds circling with flapping wings
    for (const b of this.birds) {
      const t = elapsed * b.spec.speed + b.phase;
      const x = b.spec.cx + Math.cos(t) * b.spec.radius;
      const z = b.spec.cz + Math.sin(t) * b.spec.radius;
      const y = b.spec.cy + Math.sin(elapsed * 2 + b.phase) * 0.65;
      const dx = -Math.sin(t);
      const dz = Math.cos(t);
      b.group.position.set(x, y, z);
      b.group.rotation.y = Math.atan2(dx, dz);
      const flap = Math.sin(elapsed * 13 + b.phase) * 0.65;
      b.wingL.rotation.z = flap;
      b.wingR.rotation.z = -flap;
    }

    // Walking citizens
    for (const n of this.npcs) {
      const p = n.path;
      let x;
      let z;
      let dx;
      let dz;
      if (p.radius) {
        const t = elapsed * p.speed + n.phase;
        x = p.cx + Math.cos(t) * p.radius;
        z = p.cz + Math.sin(t) * p.radius;
        dx = -Math.sin(t);
        dz = Math.cos(t);
      } else {
        const dist = Math.hypot(p.x1 - p.x0, p.z1 - p.z0) || 1;
        const cycle = (elapsed * p.speed) / dist;
        const pingPong = Math.abs(((cycle + n.phase) % 2) - 1);
        const dirSign = ((cycle + n.phase) % 2) < 1 ? 1 : -1;
        x = p.x0 + (p.x1 - p.x0) * pingPong;
        z = p.z0 + (p.z1 - p.z0) * pingPong;
        dx = (p.x1 - p.x0) * dirSign;
        dz = (p.z1 - p.z0) * dirSign;
      }
      n.group.position.set(x, 0, z);
      n.group.rotation.y = Math.atan2(dx, dz);
      const swing = Math.sin(elapsed * 9 + n.phase) * 0.55;
      n.legL.rotation.x = swing;
      n.legR.rotation.x = -swing;
      n.armL.rotation.x = -swing * 0.7;
      n.armR.rotation.x = swing * 0.7;
    }

    // Meiyon Helper Bot bobbing near front porch / tech campus
    if (this.helperBot) {
      const t = elapsed * 0.75;
      this.helperBot.position.set(
        6.5 + Math.cos(t) * 2.2,
        1.55 + Math.sin(elapsed * 3.5) * 0.16,
        16.2 + Math.sin(t) * 1.4
      );
      this.helperBot.rotation.y = Math.sin(elapsed * 0.9) * 0.8;
    }
  }
}
