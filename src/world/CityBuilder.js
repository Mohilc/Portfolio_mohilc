import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { applyAtlasUVs, TILES } from '../engine/TextureAtlas.js';

/**
 * Builds the entire real-world setting themed around Mohilc's GitHub repositories:
 * - VisionSafe AI Avenue with smart traffic lights & animated vehicles
 * - West AgriVision AI Crop Farm, Greenhouse & Sports Park
 * - North Munnar Tea Hills & Scenic Overlook Gazebo
 * - East Hoshiko / Byte Cafe & Animated Rescue Rover Test Arena
 * - South Central City Fountain, NASA Space Observatory Dome & GitHub Innovation Tower
 * - Crisp 3D Canvas Billboards labeling every repo district
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
    this.agriDrone = null;
    this.rescueRover = null;
    this.nasaDish = null;
    this.orbitPlanet = null;
    this.trafficLights = [];

    this.buildWorldTerrainAndRoads();
    this.buildHomesteadFence();
    this.buildWestNeighborhoodAndAgriFarm();
    this.buildEastTechCampusAndCafe();
    this.buildDowntownCityAndNasaDome();
    this.buildNorthMunnarTeaHills();
    this.buildStreetLamps();
    this.flushMergedCityGeometry();

    this.buildAnimatedFountainJets();
    this.buildAnimatedCityDrones();
    this.buildAnimatedRescueRover();
    this.buildAnimatedTrafficAndSignals();
    this.buildRepoDistrictBillboards();
  }

  pushBox(targetList, w, h, d, faceTiles, x, y, z) {
    const geo = new THREE.BoxGeometry(w, h, d);
    applyAtlasUVs(geo, faceTiles);
    geo.translate(x, y, z);
    targetList.push(geo);
  }

  buildWorldTerrainAndRoads() {
    this.pushBox(this.groundGeos, 144, 0.5, 134, TILES.GRASS, 0, -0.32, 5);

    // Main East-West VisionSafe Avenue (Z = 20..28)
    for (let x = -66; x <= 66; x += 6) {
      this.pushBox(this.groundGeos, 6, 0.24, 2.2, TILES.SIDEWALK_CURB, x, -0.02, 19.0);
      this.pushBox(this.groundGeos, 6, 0.24, 2.2, TILES.SIDEWALK_CURB, x, -0.02, 29.0);
      this.pushBox(this.groundGeos, 6, 0.16, 3.6, TILES.ASPHALT_ROAD, x, -0.04, 22.0);
      this.pushBox(this.groundGeos, 6, 0.16, 1.0, TILES.ROAD_STRIPE, x, -0.035, 24.0);
      this.pushBox(this.groundGeos, 6, 0.16, 3.6, TILES.ASPHALT_ROAD, x, -0.04, 26.0);
    }

    // Zebra Crosswalks
    for (const cx of [-34, 0, 31]) {
      this.pushBox(this.groundGeos, 4.4, 0.17, 7.8, TILES.CROSSWALK, cx, -0.03, 24.0);
    }

    // Front Stone Walk & North Munnar Trail
    this.pushBox(this.groundGeos, 3.6, 0.24, 2.4, TILES.STONE_PATH, 0, -0.01, 18.1);
    this.pushBox(this.groundGeos, 3.2, 0.2, 14.0, TILES.STONE_PATH, 0, -0.04, -18.5);

    // South Boulevard Road (Z = 56..62)
    for (let x = -66; x <= 66; x += 6) {
      this.pushBox(this.groundGeos, 6, 0.16, 6.0, TILES.ASPHALT_ROAD, x, -0.04, 59.0);
    }
  }

  buildHomesteadFence() {
    this.pushBox(this.shadowGeos, 14.5, 0.85, 0.35, TILES.FENCE_WHITE, -10.75, 0.42, 18.0);
    this.pushBox(this.shadowGeos, 14.5, 0.85, 0.35, TILES.FENCE_WHITE, 10.75, 0.42, 18.0);
    this.pushBox(this.shadowGeos, 0.35, 0.85, 16.0, TILES.FENCE_WHITE, -18.0, 0.42, -6.0);
    this.pushBox(this.shadowGeos, 0.35, 0.85, 10.0, TILES.FENCE_WHITE, -18.0, 0.42, 13.0);
    this.pushBox(this.shadowGeos, 0.35, 0.85, 16.0, TILES.FENCE_WHITE, 18.0, 0.42, -6.0);
    this.pushBox(this.shadowGeos, 0.35, 0.85, 10.0, TILES.FENCE_WHITE, 18.0, 0.42, 13.0);
  }

  buildWestNeighborhoodAndAgriFarm() {
    // Mini Sports Turf Pitch (-34, 4)
    this.pushBox(this.groundGeos, 16.0, 0.14, 14.0, TILES.COURT_TURF, -34, 0.0, 4.0);
    this.pushBox(this.shadowGeos, 4.8, 1.8, 0.3, TILES.FENCE_WHITE, -34, 0.9, -3.1);
    this.pushBox(this.shadowGeos, 4.8, 1.8, 0.3, TILES.FENCE_WHITE, -34, 0.9, 11.1);
    this.pushBox(this.groundGeos, 3.6, 0.18, 8.0, TILES.STONE_PATH, -34, -0.02, 15.0);
    this.pushBox(this.shadowGeos, 3.0, 0.55, 0.8, TILES.WOOD_OAK, -34, 0.35, 14.5);

    // AgriVision AI Crop Farm & Greenhouse (-34, -9.5)
    for (let row = 0; row < 3; row += 1) {
      this.pushBox(this.shadowGeos, 12.0, 0.32, 1.3, TILES.TEA_CROP, -34, 0.16, -4.6 - row * 2.0);
    }
    this.pushBox(this.shadowGeos, 6.2, 3.0, 4.2, TILES.BUILDING_GLASS, -34, 1.5, -9.5);
    this.pushBox(this.shadowGeos, 6.8, 0.5, 4.8, TILES.WOOD_OAK, -34, 3.25, -9.5);

    // Cozy Neighbor Cottage (-54, 2)
    this.pushBox(this.shadowGeos, 11.0, 4.2, 10.0, TILES.WALL_CREAM, -54, 2.1, 2.0);
    this.pushBox(this.shadowGeos, 12.2, 0.9, 11.2, TILES.ROOF_SHINGLE, -54, 4.65, 2.0);
    this.pushBox(this.shadowGeos, 9.2, 0.9, 8.2, TILES.ROOF_SHINGLE, -54, 5.55, 2.0);
    this.pushBox(this.shadowGeos, 1.4, 2.6, 0.25, TILES.DOOR_WOOD, -54, 1.3, 7.05);
    this.pushBox(this.shadowGeos, 2.0, 1.5, 0.25, TILES.WINDOW_NIGHT, -57.2, 2.3, 7.05);
    this.pushBox(this.shadowGeos, 2.0, 1.5, 0.25, TILES.WINDOW_NIGHT, -50.8, 2.3, 7.05);
  }

  buildEastTechCampusAndCafe() {
    // Hoshiko & Byte Cafe Building (31, 6)
    this.pushBox(this.groundGeos, 18.0, 0.18, 16.0, TILES.SIDEWALK_CURB, 31, -0.01, 10.0);
    this.pushBox(this.shadowGeos, 12.0, 4.8, 9.0, TILES.WALL_BRICK, 31, 2.4, 6.0);
    this.pushBox(this.shadowGeos, 12.8, 0.6, 9.8, TILES.METAL_DARK, 31, 5.1, 6.0);
    this.pushBox(this.shadowGeos, 10.5, 0.35, 2.4, TILES.AWNING_STRIPE, 31, 3.2, 11.4);
    this.pushBox(this.shadowGeos, 3.2, 1.8, 0.22, TILES.WINDOW_NIGHT, 28, 2.0, 10.55);
    this.pushBox(this.shadowGeos, 3.2, 1.8, 0.22, TILES.WINDOW_NIGHT, 34, 2.0, 10.55);
    this.pushBox(this.shadowGeos, 4.2, 1.1, 0.3, TILES.SIGN_TECH_HUB, 31, 4.3, 10.6);

    for (const tx of [27.5, 34.5]) {
      this.pushBox(this.shadowGeos, 1.4, 0.8, 1.4, TILES.WOOD_OAK, tx, 0.45, 14.0);
      this.pushBox(this.shadowGeos, 2.2, 0.25, 2.2, TILES.AWNING_STRIPE, tx, 2.4, 14.0);
      this.pushBox(this.shadowGeos, 0.18, 2.0, 0.18, TILES.METAL_ACCENT, tx, 1.4, 14.0);
    }

    // Rescue Rover Test Arena & Observation Tower (East Campus)
    this.pushBox(this.groundGeos, 14.0, 0.2, 14.0, TILES.LAB_TILE, 52, 0.0, 8.5);
    this.pushBox(this.shadowGeos, 6.2, 8.5, 6.2, TILES.BUILDING_CONCRETE, 53, 4.25, -2.0);
    this.pushBox(this.shadowGeos, 7.0, 1.8, 7.0, TILES.BUILDING_GLASS, 53, 9.4, -2.0);
  }

  buildDowntownCityAndNasaDome() {
    // Central City Cobblestone Fountain Plaza (0, 40)
    this.pushBox(this.groundGeos, 34.0, 0.2, 24.0, TILES.SIDEWALK_CURB, 0, -0.01, 42.0);
    this.pushBox(this.groundGeos, 16.0, 0.24, 16.0, TILES.STONE_PATH, 0, 0.02, 40.0);
    this.pushBox(this.shadowGeos, 6.2, 0.8, 6.2, TILES.SUNDIAL_STONE, 0, 0.45, 40.0);
    this.pushBox(this.groundGeos, 5.2, 0.85, 5.2, TILES.FOUNTAIN_WATER, 0, 0.5, 40.0);
    this.pushBox(this.shadowGeos, 2.2, 1.8, 2.2, TILES.SUNDIAL_STONE, 0, 1.35, 40.0);
    this.pushBox(this.shadowGeos, 1.0, 1.2, 1.0, TILES.SUNDIAL_STONE, 0, 2.6, 40.0);
    this.pushBox(this.shadowGeos, 3.2, 0.55, 0.8, TILES.WOOD_OAK, -7.5, 0.35, 40.0);
    this.pushBox(this.shadowGeos, 3.2, 0.55, 0.8, TILES.WOOD_OAK, 7.5, 0.35, 40.0);

    // West Downtown: NASA Space Observatory Dome (-32, 45) + Studio Tower (-52, 44)
    this.pushBox(this.groundGeos, 28.0, 0.2, 26.0, TILES.SIDEWALK_CURB, -36, -0.01, 43.0);
    this.pushBox(this.shadowGeos, 12.0, 8.0, 12.0, TILES.SPACE_DOME, -32, 4.0, 45.0);
    this.pushBox(this.shadowGeos, 9.0, 3.0, 9.0, TILES.SPACE_DOME, -32, 9.5, 45.0);
    this.pushBox(this.shadowGeos, 5.5, 2.0, 5.5, TILES.BUILDING_GLASS, -32, 12.0, 45.0);
    this.pushBox(this.shadowGeos, 11.0, 12.5, 11.0, TILES.BUILDING_CONCRETE, -52, 6.25, 44.0);
    this.pushBox(this.shadowGeos, 11.6, 0.8, 11.6, TILES.ROOF_SHINGLE, -52, 12.9, 44.0);

    // East Downtown: GitHub Innovation Tower (32, 45) + Co-Working Office (52, 46)
    this.pushBox(this.groundGeos, 28.0, 0.2, 26.0, TILES.SIDEWALK_CURB, 42, -0.01, 44.0);
    this.pushBox(this.shadowGeos, 12.0, 22.0, 12.0, TILES.BUILDING_GLASS, 32, 11.0, 45.0);
    this.pushBox(this.shadowGeos, 8.0, 3.2, 8.0, TILES.BUILDING_GLASS, 32, 23.6, 45.0);
    this.pushBox(this.shadowGeos, 0.6, 5.5, 0.6, TILES.LANTERN_GLOW, 32, 27.5, 45.0);
    this.pushBox(this.shadowGeos, 6.4, 1.6, 0.35, TILES.SIGN_TECH_HUB, 32, 4.2, 38.9);

    this.pushBox(this.shadowGeos, 11.0, 14.0, 11.0, TILES.BUILDING_CONCRETE, 52, 7.0, 46.0);
    this.pushBox(this.shadowGeos, 8.5, 1.5, 8.5, TILES.METAL_DARK, 52, 14.75, 46.0);
  }

  buildNorthMunnarTeaHills() {
    // Munnar Scenic Viewpoint Gazebo (0, -28)
    this.pushBox(this.shadowGeos, 5.2, 0.4, 5.2, TILES.SUNDIAL_STONE, 0, 0.2, -28.0);
    for (const [gx, gz] of [[-2.0, -30.0], [2.0, -30.0], [-2.0, -26.0], [2.0, -26.0]]) {
      this.pushBox(this.shadowGeos, 0.35, 3.2, 0.35, TILES.WOOD_WALNUT, gx, 1.8, gz);
    }
    this.pushBox(this.shadowGeos, 5.8, 0.55, 5.8, TILES.ROOF_SHINGLE, 0, 3.6, -28.0);
    this.pushBox(this.shadowGeos, 3.6, 0.55, 3.6, TILES.ROOF_SHINGLE, 0, 4.15, -28.0);

    // Terraced Tea Bushes flanking the Gazebo
    for (const tx of [-14, -8, 8, 14, -22, 22]) {
      this.pushBox(this.shadowGeos, 4.4, 0.7, 3.2, TILES.TEA_CROP, tx, 0.35, -26.0);
      this.pushBox(this.shadowGeos, 4.4, 1.2, 3.2, TILES.TEA_CROP, tx, 0.6, -32.0);
    }

    const groveCoords = [
      [-46, -24], [-34, -30], [-22, -22], [24, -22], [38, -28], [52, -24],
      [-58, -14], [60, 22], [-60, 24], [-22, 34], [20, 34],
    ];
    for (const [tx, tz] of groveCoords) {
      this.pushBox(this.shadowGeos, 1.0, 2.4, 1.0, TILES.TRUNK_BARK, tx, 1.2, tz);
      this.pushBox(this.shadowGeos, 3.2, 2.2, 3.2, TILES.LEAF_OAK, tx, 3.3, tz);
      this.pushBox(this.shadowGeos, 2.1, 1.4, 2.1, TILES.LEAF_OAK, tx, 4.8, tz);
    }

    // Scenic Munnar Mountain Backdrop
    const hills = [
      [-42, -48, 28, 7, 16],
      [-10, -50, 34, 9, 14],
      [26, -48, 30, 8, 16],
      [54, -46, 22, 6, 16],
    ];
    for (const [hx, hz, w, h, d] of hills) {
      this.pushBox(this.shadowGeos, w, h, d, TILES.TEA_CROP, hx, h / 2 - 0.2, hz);
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

  buildAnimatedCityDrones() {
    // 1. East Campus Patrol Drone
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

    // 2. AgriVision Crop-Scanner Drone hovering over West Crops
    this.agriDrone = new THREE.Group();
    const aBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.28, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.35, flatShading: true })
    );
    const aScan = new THREE.Mesh(
      new THREE.ConeGeometry(0.85, 2.2, 4),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22 })
    );
    aScan.position.y = -1.2;
    this.agriDrone.add(aBody, aScan);
    this.root.add(this.agriDrone);

    // 3. NASA Observatory Rotating Satellite Dish + Orbiting Planet
    this.nasaDish = new THREE.Group();
    this.nasaDish.position.set(-32, 13.8, 45);
    const dish = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.5, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.25 })
    );
    dish.rotation.x = 0.45;
    this.nasaDish.add(dish);
    this.root.add(this.nasaDish);

    this.orbitPlanet = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.45, flatShading: true })
    );
    this.root.add(this.orbitPlanet);
  }

  buildAnimatedRescueRover() {
    this.rescueRover = new THREE.Group();
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.6, 1.3),
      new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.4, flatShading: true })
    );
    chassis.position.y = 0.55;
    chassis.castShadow = true;

    const camMast = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.75, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    camMast.position.set(0.5, 1.1, 0);

    const camHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.28, 0.42),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    camHead.position.set(0.55, 1.5, 0);

    const wheelGeo = new THREE.BoxGeometry(0.45, 0.45, 1.5);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const w1 = new THREE.Mesh(wheelGeo, wheelMat);
    w1.position.set(-0.55, 0.26, 0);
    const w2 = new THREE.Mesh(wheelGeo, wheelMat);
    w2.position.set(0.55, 0.26, 0);

    this.rescueRover.add(chassis, camMast, camHead, w1, w2);
    this.rescueRover.position.set(52, 0, 8.5);
    this.root.add(this.rescueRover);
  }

  buildAnimatedTrafficAndSignals() {
    const vehicleSpecs = [
      { color: 0xef4444, x: -48, z: 22.0, dir: -1, speed: 7.5, w: 2.6, h: 1.1 },
      { color: 0xfacc15, x: 18, z: 22.0, dir: -1, speed: 8.8, w: 2.5, h: 1.1 },
      { color: 0x3b82f6, x: -24, z: 26.0, dir: 1, speed: 8.2, w: 2.6, h: 1.1 },
      { color: 0x22c55e, x: 38, z: 26.0, dir: 1, speed: 6.4, w: 4.2, h: 1.6 },
      { color: 0xf97316, x: 10, z: 59.0, dir: -1, speed: 7.2, w: 3.1, h: 1.4 },
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

      const hl = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.22, 1.2),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      hl.position.set(spec.dir * (spec.w * 0.5), 0.62, 0);
      const tl = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.22, 1.2),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e })
      );
      tl.position.set(-spec.dir * (spec.w * 0.5), 0.62, 0);

      car.add(body, cabin, w1, w2, hl, tl);
      car.position.set(spec.x, 0, spec.z);
      this.root.add(car);
      this.cars.push({ group: car, dir: spec.dir, speed: spec.speed, z: spec.z });
    }

    // VisionSafe AI Smart Crosswalk Traffic Signals
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    for (const [sx, sz] of [[-3.4, 19.3], [3.4, 28.7]]) {
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.8, 0.28), poleMat);
      pole.position.set(sx, 1.9, sz);
      pole.castShadow = true;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), poleMat);
      head.position.set(sx, 3.6, sz);
      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.38, 0.56),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      lamp.position.set(sx, 3.6, sz);
      this.root.add(pole, head, lamp);
      this.trafficLights.push(lamp);
    }
  }

  buildRepoDistrictBillboards() {
    const signs = [
      { title: 'AGRIVISION AI', sub: 'CROP & FARM LAB', x: -34, y: 2.3, z: -3.2, color: '#22c55e' },
      { title: 'MUNNAR HILLS', sub: 'EARTH BLOOM TOUR', x: 0, y: 3.6, z: -25.1, color: '#4ade80' },
      { title: 'HOSHIKO CAFE', sub: 'FOOD & STORIES', x: 31, y: 5.5, z: 10.6, color: '#f472b6' },
      { title: 'RESCUE ROVER', sub: 'ESP32 & UAV LAB', x: 49, y: 2.5, z: 2.5, color: '#facc15' },
      { title: 'NASA SPACE HUB', sub: 'LOOPTROOP 2025', x: -32, y: 2.8, z: 38.6, color: '#38bdf8' },
      { title: 'HOUSE PRICE ML', sub: 'FLASK PREDICTOR', x: 6.4, y: 1.5, z: 14.5, color: '#fb923c' },
    ];

    for (const s of signs) {
      const cvs = document.createElement('canvas');
      cvs.width = 256;
      cvs.height = 64;
      const ctx = cvs.getContext('2d');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 256, 64);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 252, 60);
      ctx.fillStyle = s.color;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.title, 128, 28);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(s.sub, 128, 50);

      const tex = new THREE.CanvasTexture(cvs);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;

      const board = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.9, 0.16),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      board.position.set(s.x, s.y, s.z);
      board.castShadow = true;

      if (s.y < 3.5) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, s.y - 0.4, 0.22),
          new THREE.MeshLambertMaterial({ color: 0x5e3a24 })
        );
        post.position.set(s.x, (s.y - 0.4) / 2, s.z);
        this.root.add(post);
      }

      this.root.add(board);
    }
  }

  update(dt, elapsed) {
    for (const c of this.cars) {
      c.group.position.x += c.dir * c.speed * dt;
      if (c.dir > 0 && c.group.position.x > 70) c.group.position.x = -70;
      if (c.dir < 0 && c.group.position.x < -70) c.group.position.x = 70;
    }

    for (const drop of this.fountainJets) {
      const t = (elapsed * 1.4 + drop.userData.phase) % 1;
      const r = 0.4 + t * 1.9;
      drop.position.set(
        Math.cos(drop.userData.angle) * r,
        3.2 + Math.sin(t * Math.PI) * 1.4 - t * 1.9,
        40.0 + Math.sin(drop.userData.angle) * r
      );
    }

    if (this.cityDrone) {
      this.cityDrone.position.set(
        42 + Math.cos(elapsed * 0.55) * 12,
        12.5 + Math.sin(elapsed * 2.2) * 0.6,
        18 + Math.sin(elapsed * 0.55) * 20
      );
      this.cityDrone.rotation.y = -elapsed * 0.55;
    }

    if (this.agriDrone) {
      this.agriDrone.position.set(
        -34 + Math.sin(elapsed * 0.9) * 4.8,
        2.9 + Math.sin(elapsed * 3.1) * 0.18,
        -6.6 + Math.cos(elapsed * 0.45) * 2.2
      );
    }

    if (this.rescueRover) {
      const t = elapsed * 0.7;
      const rx = 52 + Math.cos(t) * 4.5;
      const rz = 8.5 + Math.sin(t) * 4.5;
      const dx = -Math.sin(t);
      const dz = Math.cos(t);
      this.rescueRover.position.set(rx, 0, rz);
      this.rescueRover.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    }

    if (this.nasaDish) {
      this.nasaDish.rotation.y = elapsed * 0.5;
    }
    if (this.orbitPlanet) {
      this.orbitPlanet.position.set(
        -32 + Math.cos(elapsed * 0.9) * 6.5,
        15.2 + Math.sin(elapsed * 1.3) * 0.6,
        45 + Math.sin(elapsed * 0.9) * 6.5
      );
      this.orbitPlanet.rotation.y = elapsed * 1.2;
    }

    // Smart VisionSafe traffic signal cycle
    const signalPhase = Math.floor(elapsed * 0.45) % 3;
    const signalColor = signalPhase === 0 ? 0x22c55e : signalPhase === 1 ? 0xfacc15 : 0xef4444;
    for (const lamp of this.trafficLights) {
      lamp.material.color.setHex(signalColor);
    }
  }
}
