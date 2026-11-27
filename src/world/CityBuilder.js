import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { applyAtlasUVs, TILES } from '../engine/TextureAtlas.js';

/**
 * Builds the entire real-world setting surrounding the portfolio homestead:
 * - Neighborhood roads, sidewalks, zebra crosswalks, streetlamps & picket fences
 * - West Neighbor Cottage & Sports Park mini-pitch
 * - East Byte Cafe (outdoor patio tables & striped awning) + Drone Observation Tower
 * - South Central Fountain Plaza + Downtown City Skyscrapers & GitHub Tower
 * - North Scenic Forest & Low-Poly Hills
 * - Live Animated City Traffic (cars/taxis/buses with glowing night headlights!)
 *
 * Uses BufferGeometry merging + shared TextureAtlas material to render the entire city
 * in minimal draw calls at crisp 60 FPS.
 */
export class CityBuilder {
  constructor(scene, atlas) {
    this.scene = scene;
    this.atlas = atlas;
    this.sharedMat = atlas.sharedMaterial;

    this.root = new THREE.Group();
    this.root.name = 'RealWorldCity';
    this.scene.add(this.root);

    this.shadowGeos = [];
    this.groundGeos = [];
    this.cars = [];
    this.fountainJets = [];
    this.cityDrone = null;

    this.buildWorldTerrainAndRoads();
    this.buildHomesteadFence();
    this.buildWestNeighborhoodAndPark();
    this.buildEastTechCampusAndCafe();
    this.buildDowntownCity();
    this.buildNorthForestAndHills();
    this.buildStreetLamps();
    this.flushMergedCityGeometry();

    this.buildAnimatedFountainJets();
    this.buildAnimatedCityDrone();
    this.buildAnimatedTraffic();
  }

  pushBox(targetList, w, h, d, faceTiles, x, y, z) {
    const geo = new THREE.BoxGeometry(w, h, d);
    applyAtlasUVs(geo, faceTiles);
    geo.translate(x, y, z);
    targetList.push(geo);
  }

  buildWorldTerrainAndRoads() {
    // Broad lush world grass terrain (140 x 130) below house yard
    this.pushBox(this.groundGeos, 144, 0.5, 134, TILES.GRASS, 0, -0.32, 5);

    // Main East-West Avenue (Z = 20..28, X = -70..70)
    // North & South Concrete Sidewalks
    for (let x = -66; x <= 66; x += 6) {
      this.pushBox(this.groundGeos, 6, 0.24, 2.2, TILES.SIDEWALK_CURB, x, -0.02, 19.0);
      this.pushBox(this.groundGeos, 6, 0.24, 2.2, TILES.SIDEWALK_CURB, x, -0.02, 29.0);
      // 2-lane asphalt + center dashed divider
      this.pushBox(this.groundGeos, 6, 0.16, 3.6, TILES.ASPHALT_ROAD, x, -0.04, 22.0);
      this.pushBox(this.groundGeos, 6, 0.16, 1.0, TILES.ROAD_STRIPE, x, -0.035, 24.0);
      this.pushBox(this.groundGeos, 6, 0.16, 3.6, TILES.ASPHALT_ROAD, x, -0.04, 26.0);
    }

    // Zebra Crosswalks at X = 0 (House -> Plaza), X = -34 (Park), X = 31 (Cafe -> Tower)
    for (const cx of [-34, 0, 31]) {
      this.pushBox(this.groundGeos, 4.4, 0.17, 7.8, TILES.CROSSWALK, cx, -0.03, 24.0);
    }

    // Connector Stone Walk from Homestead Gate (Z=17.5) to Avenue Sidewalk
    this.pushBox(this.groundGeos, 3.6, 0.24, 2.4, TILES.STONE_PATH, 0, -0.01, 18.1);

    // South Boulevard Road behind skyscrapers (Z = 56..62)
    for (let x = -66; x <= 66; x += 6) {
      this.pushBox(this.groundGeos, 6, 0.16, 6.0, TILES.ASPHALT_ROAD, x, -0.04, 59.0);
    }
  }

  buildHomesteadFence() {
    // Low white picket fence framing the portfolio yard
    this.pushBox(this.shadowGeos, 14.5, 0.85, 0.35, TILES.FENCE_WHITE, -10.75, 0.42, 18.0);
    this.pushBox(this.shadowGeos, 14.5, 0.85, 0.35, TILES.FENCE_WHITE, 10.75, 0.42, 18.0);
    this.pushBox(this.shadowGeos, 0.35, 0.85, 16.0, TILES.FENCE_WHITE, -18.0, 0.42, -6.0);
    this.pushBox(this.shadowGeos, 0.35, 0.85, 10.0, TILES.FENCE_WHITE, -18.0, 0.42, 13.0);
    this.pushBox(this.shadowGeos, 0.35, 0.85, 16.0, TILES.FENCE_WHITE, 18.0, 0.42, -6.0);
    this.pushBox(this.shadowGeos, 0.35, 0.85, 10.0, TILES.FENCE_WHITE, 18.0, 0.42, 13.0);
  }

  buildWestNeighborhoodAndPark() {
    // Mini Sports Turf Pitch (-34, 4)
    this.pushBox(this.groundGeos, 16.0, 0.14, 14.0, TILES.COURT_TURF, -34, 0.0, 4.0);
    // Goal frames (North & South ends of pitch)
    this.pushBox(this.shadowGeos, 4.8, 1.8, 0.3, TILES.FENCE_WHITE, -34, 0.9, -3.1);
    this.pushBox(this.shadowGeos, 4.8, 1.8, 0.3, TILES.FENCE_WHITE, -34, 0.9, 11.1);
    // Park Bench + Sidewalk path
    this.pushBox(this.groundGeos, 3.6, 0.18, 8.0, TILES.STONE_PATH, -34, -0.02, 15.0);
    this.pushBox(this.shadowGeos, 3.0, 0.55, 0.8, TILES.WOOD_OAK, -34, 0.35, 14.5);

    // Cozy Neighbor Cottage (-54, 2)
    this.pushBox(this.shadowGeos, 11.0, 4.2, 10.0, TILES.WALL_CREAM, -54, 2.1, 2.0);
    this.pushBox(this.shadowGeos, 12.2, 0.9, 11.2, TILES.ROOF_SHINGLE, -54, 4.65, 2.0);
    this.pushBox(this.shadowGeos, 9.2, 0.9, 8.2, TILES.ROOF_SHINGLE, -54, 5.55, 2.0);
    this.pushBox(this.shadowGeos, 1.4, 2.6, 0.25, TILES.DOOR_WOOD, -54, 1.3, 7.05);
    this.pushBox(this.shadowGeos, 2.0, 1.5, 0.25, TILES.WINDOW_NIGHT, -57.2, 2.3, 7.05);
    this.pushBox(this.shadowGeos, 2.0, 1.5, 0.25, TILES.WINDOW_NIGHT, -50.8, 2.3, 7.05);
  }

  buildEastTechCampusAndCafe() {
    // Byte Cafe Building (31, 6)
    this.pushBox(this.groundGeos, 18.0, 0.18, 16.0, TILES.SIDEWALK_CURB, 31, -0.01, 10.0);
    this.pushBox(this.shadowGeos, 12.0, 4.8, 9.0, TILES.WALL_BRICK, 31, 2.4, 6.0);
    this.pushBox(this.shadowGeos, 12.8, 0.6, 9.8, TILES.METAL_DARK, 31, 5.1, 6.0);
    // Striped Cafe Awning & Glowing Windows
    this.pushBox(this.shadowGeos, 10.5, 0.35, 2.4, TILES.AWNING_STRIPE, 31, 3.2, 11.4);
    this.pushBox(this.shadowGeos, 3.2, 1.8, 0.22, TILES.WINDOW_NIGHT, 28, 2.0, 10.55);
    this.pushBox(this.shadowGeos, 3.2, 1.8, 0.22, TILES.WINDOW_NIGHT, 34, 2.0, 10.55);
    this.pushBox(this.shadowGeos, 4.2, 1.1, 0.3, TILES.SIGN_TECH_HUB, 31, 4.3, 10.6);

    // Outdoor Cafe Patio Tables
    for (const tx of [27.5, 34.5]) {
      this.pushBox(this.shadowGeos, 1.4, 0.8, 1.4, TILES.WOOD_OAK, tx, 0.45, 14.0);
      this.pushBox(this.shadowGeos, 2.2, 0.25, 2.2, TILES.AWNING_STRIPE, tx, 2.4, 14.0);
      this.pushBox(this.shadowGeos, 0.18, 2.0, 0.18, TILES.METAL_ACCENT, tx, 1.4, 14.0);
    }

    // UAV Helipad & Observation Tower (East Campus)
    this.pushBox(this.groundGeos, 11.0, 0.2, 11.0, TILES.LAB_TILE, 53, 0.0, 9.0);
    this.pushBox(this.shadowGeos, 6.2, 8.5, 6.2, TILES.BUILDING_CONCRETE, 53, 4.25, -2.0);
    this.pushBox(this.shadowGeos, 7.0, 1.8, 7.0, TILES.BUILDING_GLASS, 53, 9.4, -2.0);
  }

  buildDowntownCity() {
    // Central City Cobblestone Fountain Plaza (X:[-16,16], Z:[30,54])
    this.pushBox(this.groundGeos, 34.0, 0.2, 24.0, TILES.SIDEWALK_CURB, 0, -0.01, 42.0);
    this.pushBox(this.groundGeos, 16.0, 0.24, 16.0, TILES.STONE_PATH, 0, 0.02, 40.0);

    // Multi-tier Pixel Water Fountain (0, 40)
    this.pushBox(this.shadowGeos, 6.2, 0.8, 6.2, TILES.SUNDIAL_STONE, 0, 0.45, 40.0);
    this.pushBox(this.groundGeos, 5.2, 0.85, 5.2, TILES.FOUNTAIN_WATER, 0, 0.5, 40.0);
    this.pushBox(this.shadowGeos, 2.2, 1.8, 2.2, TILES.SUNDIAL_STONE, 0, 1.35, 40.0);
    this.pushBox(this.shadowGeos, 1.0, 1.2, 1.0, TILES.SUNDIAL_STONE, 0, 2.6, 40.0);

    // Park Benches around Fountain
    this.pushBox(this.shadowGeos, 3.2, 0.55, 0.8, TILES.WOOD_OAK, -7.5, 0.35, 40.0);
    this.pushBox(this.shadowGeos, 3.2, 0.55, 0.8, TILES.WOOD_OAK, 7.5, 0.35, 40.0);

    // West Downtown Skyscrapers
    // Glass Tower (-32, 45)
    this.pushBox(this.groundGeos, 24.0, 0.2, 26.0, TILES.SIDEWALK_CURB, -34, -0.01, 43.0);
    this.pushBox(this.shadowGeos, 12.0, 18.0, 12.0, TILES.BUILDING_GLASS, -32, 9.0, 45.0);
    this.pushBox(this.shadowGeos, 10.0, 2.5, 10.0, TILES.METAL_DARK, -32, 19.25, 45.0);
    this.pushBox(this.shadowGeos, 0.4, 4.0, 0.4, TILES.METAL_ACCENT, -32, 22.0, 45.0);
    // West Brick Studio Tower (-52, 44)
    this.pushBox(this.shadowGeos, 11.0, 12.5, 11.0, TILES.BUILDING_CONCRETE, -52, 6.25, 44.0);
    this.pushBox(this.shadowGeos, 11.6, 0.8, 11.6, TILES.ROOF_SHINGLE, -52, 12.9, 44.0);

    // East Downtown Skyscrapers
    // GitHub Innovation Tower (32, 45) — Tallest skyline anchor!
    this.pushBox(this.groundGeos, 26.0, 0.2, 26.0, TILES.SIDEWALK_CURB, 42, -0.01, 44.0);
    this.pushBox(this.shadowGeos, 12.0, 22.0, 12.0, TILES.BUILDING_GLASS, 32, 11.0, 45.0);
    this.pushBox(this.shadowGeos, 8.0, 3.2, 8.0, TILES.BUILDING_GLASS, 32, 23.6, 45.0);
    this.pushBox(this.shadowGeos, 0.6, 5.5, 0.6, TILES.LANTERN_GLOW, 32, 27.5, 45.0);
    this.pushBox(this.shadowGeos, 6.4, 1.6, 0.35, TILES.SIGN_TECH_HUB, 32, 4.2, 38.9);

    // Co-Working Concrete Complex (52, 46)
    this.pushBox(this.shadowGeos, 11.0, 14.0, 11.0, TILES.BUILDING_CONCRETE, 52, 7.0, 46.0);
    this.pushBox(this.shadowGeos, 8.5, 1.5, 8.5, TILES.METAL_DARK, 52, 14.75, 46.0);
  }

  buildNorthForestAndHills() {
    // Low-poly forest trees & scenic pixel hills behind the house
    const groveCoords = [
      [-46, -24], [-34, -30], [-22, -22], [-8, -28], [10, -26], [24, -22], [38, -28], [52, -24],
      [-58, -14], [60, 22], [-60, 24], [-22, 34], [20, 34],
    ];
    for (const [tx, tz] of groveCoords) {
      this.pushBox(this.shadowGeos, 1.0, 2.4, 1.0, TILES.TRUNK_BARK, tx, 1.2, tz);
      this.pushBox(this.shadowGeos, 3.2, 2.2, 3.2, TILES.LEAF_OAK, tx, 3.3, tz);
      this.pushBox(this.shadowGeos, 2.1, 1.4, 2.1, TILES.LEAF_OAK, tx, 4.8, tz);
    }

    // Perimeter rolling hills so the world horizon looks continuous
    const hills = [
      [-42, -48, 28, 7, 16],
      [-10, -50, 34, 9, 14],
      [26, -48, 30, 8, 16],
      [54, -46, 22, 6, 16],
    ];
    for (const [hx, hz, w, h, d] of hills) {
      this.pushBox(this.shadowGeos, w, h, d, TILES.GRASS, hx, h / 2 - 0.2, hz);
      this.pushBox(this.shadowGeos, w * 0.65, h * 0.55, d * 0.65, TILES.LEAF_OAK, hx, h + h * 0.2, hz);
    }
  }

  buildStreetLamps() {
    const lampSpots = [
      [-24, 18.8], [-8, 18.8], [8, 18.8], [24, 18.8], [44, 18.8],
      [-24, 29.2], [-8, 29.2], [8, 29.2], [24, 29.2], [44, 29.2],
      [-10, 34.0], [10, 34.0], [-10, 48.0], [10, 48.0],
    ];
    for (const [lx, lz] of lampSpots) {
      this.pushBox(this.shadowGeos, 0.32, 4.4, 0.32, TILES.METAL_DARK, lx, 2.2, lz);
      this.pushBox(this.shadowGeos, 0.72, 0.55, 0.72, TILES.LANTERN_GLOW, lx, 4.5, lz);
    }
  }

  flushMergedCityGeometry() {
    if (this.groundGeos.length > 0) {
      const mergedGround = mergeGeometries(this.groundGeos, false);
      const groundMesh = new THREE.Mesh(mergedGround, this.sharedMat);
      groundMesh.receiveShadow = true;
      groundMesh.castShadow = false;
      this.root.add(groundMesh);
      this.groundGeos.forEach((g) => g.dispose());
      this.groundGeos = [];
    }

    if (this.shadowGeos.length > 0) {
      const mergedCity = mergeGeometries(this.shadowGeos, false);
      const cityMesh = new THREE.Mesh(mergedCity, this.sharedMat);
      cityMesh.castShadow = true;
      cityMesh.receiveShadow = true;
      this.root.add(cityMesh);
      this.shadowGeos.forEach((g) => g.dispose());
      this.shadowGeos = [];
    }
  }

  buildAnimatedFountainJets() {
    const jetGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const jetMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      flatShading: true,
    });
    for (let i = 0; i < 8; i += 1) {
      const drop = new THREE.Mesh(jetGeo, jetMat);
      drop.userData.phase = (i / 8) * Math.PI * 2;
      drop.userData.angle = (i / 8) * Math.PI * 2;
      this.root.add(drop);
      this.fountainJets.push(drop);
    }
  }

  buildAnimatedCityDrone() {
    this.cityDrone = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.35, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, flatShading: true })
    );
    const beacon = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, 0.35),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    beacon.position.y = 0.25;
    this.cityDrone.add(body, beacon);
    this.root.add(this.cityDrone);
  }

  buildAnimatedTraffic() {
    const vehicleSpecs = [
      { color: 0xef4444, x: -48, z: 22.0, dir: -1, speed: 7.5, w: 2.6, h: 1.1 }, // Red sedan
      { color: 0xfacc15, x: 18, z: 22.0, dir: -1, speed: 8.8, w: 2.5, h: 1.1 }, // Yellow taxi
      { color: 0x3b82f6, x: -24, z: 26.0, dir: 1, speed: 8.2, w: 2.6, h: 1.1 }, // Blue EV
      { color: 0x22c55e, x: 38, z: 26.0, dir: 1, speed: 6.4, w: 4.2, h: 1.6 }, // City Bus
      { color: 0xf97316, x: 10, z: 59.0, dir: -1, speed: 7.2, w: 3.1, h: 1.4 }, // Boulevard Van
    ];

    for (const spec of vehicleSpecs) {
      const car = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(spec.w, spec.h * 0.65, 1.55),
        new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.3, metalness: 0.35, flatShading: true })
      );
      body.position.y = 0.65;
      body.castShadow = true;

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(spec.w * 0.58, spec.h * 0.48, 1.32),
        new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.12, metalness: 0.2, flatShading: true })
      );
      cabin.position.y = 0.65 + spec.h * 0.5;
      cabin.castShadow = true;

      const wheelGeo = new THREE.BoxGeometry(0.45, 0.45, 1.68);
      const wheelMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
      const w1 = new THREE.Mesh(wheelGeo, wheelMat);
      w1.position.set(-spec.w * 0.3, 0.28, 0);
      const w2 = new THREE.Mesh(wheelGeo, wheelMat);
      w2.position.set(spec.w * 0.3, 0.28, 0);

      // Headlights & Taillights
      const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 1.2), headMat);
      hl.position.set(spec.dir * (spec.w * 0.5), 0.62, 0);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 1.2), tailMat);
      tl.position.set(-spec.dir * (spec.w * 0.5), 0.62, 0);

      car.add(body, cabin, w1, w2, hl, tl);
      car.position.set(spec.x, 0, spec.z);
      this.root.add(car);
      this.cars.push({ group: car, dir: spec.dir, speed: spec.speed, z: spec.z });
    }
  }

  update(dt, elapsed) {
    // Animate city traffic loops
    for (const c of this.cars) {
      c.group.position.x += c.dir * c.speed * dt;
      if (c.dir > 0 && c.group.position.x > 70) c.group.position.x = -70;
      if (c.dir < 0 && c.group.position.x < -70) c.group.position.x = 70;
    }

    // Animate fountain spray arcs
    for (const drop of this.fountainJets) {
      const t = (elapsed * 1.4 + drop.userData.phase) % 1;
      const r = 0.4 + t * 1.9;
      drop.position.set(
        Math.cos(drop.userData.angle) * r,
        3.2 + Math.sin(t * Math.PI) * 1.4 - t * 1.9,
        40.0 + Math.sin(drop.userData.angle) * r
      );
    }

    // Patrol drone circling between East Tech Campus & Innovation Tower
    if (this.cityDrone) {
      this.cityDrone.position.set(
        42 + Math.cos(elapsed * 0.55) * 12,
        12.5 + Math.sin(elapsed * 2.2) * 0.6,
        18 + Math.sin(elapsed * 0.55) * 20
      );
      this.cityDrone.rotation.y = -elapsed * 0.55;
    }
  }
}
