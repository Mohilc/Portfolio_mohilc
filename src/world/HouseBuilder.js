import * as THREE from 'three';
import { applyAtlasUVs, TILES } from '../engine/TextureAtlas.js';
import { WALL_SEGMENTS } from './HouseData.js';

/**
 * Builds the low-poly, flat-shaded pixel-art house, yard, interior rooms,
 * and architectural furniture using the unified TextureAtlas shared material.
 */
export class HouseBuilder {
  constructor(scene, atlas) {
    this.scene = scene;
    this.atlas = atlas;
    this.sharedMat = atlas.sharedMaterial;

    this.root = new THREE.Group();
    this.root.name = 'PixelHouseWorld';
    this.scene.add(this.root);

    this.wallMeshes = {
      north: [],
      south: [],
      east: [],
      west: [],
      interior: [],
    };
    this.roofGroup = new THREE.Group();
    this.roofGroup.name = 'RoofCutawayGroup';
    this.root.add(this.roofGroup);

    // Dynamic elements updated by animation or GitHub data
    this.droneRotorGroup = null;
    this.dronePropellers = [];
    this.frontDoorLeft = null;
    this.frontDoorRight = null;
    this.fanHead = null;
    this.fanBlades = null;
    this.clockPendulum = null;
    this.hearthFlames = [];
    this.hearthLight = null;
    this.serverLeds = [];
    this.koiFish = [];
    this.swayCanopies = [];
    this.robotArmBase = null;
    this.robotArmUpper = null;

    this.dynamicBookGroup = new THREE.Group();
    this.dynamicBookGroup.name = 'DynamicGitHubBooks';
    this.root.add(this.dynamicBookGroup);

    this.trophyGroup = new THREE.Group();
    this.trophyGroup.name = 'DynamicTrophies';
    this.root.add(this.trophyGroup);

    this.floatingSignGroup = new THREE.Group();
    this.root.add(this.floatingSignGroup);

    this.buildTerrain();
    this.buildFloors();
    this.buildWalls();
    this.buildRoofTrim();
    this.buildFurniture();
    this.buildGardenProps();
    this.buildHouseAnimations();
  }

  makeAtlasBox(w, h, d, faceTiles, x, y, z, parent = this.root, castShadow = true) {
    const geo = new THREE.BoxGeometry(w, h, d);
    applyAtlasUVs(geo, faceTiles);
    const mesh = new THREE.Mesh(geo, this.sharedMat);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  buildTerrain() {
    // Yard base
    this.makeAtlasBox(38, 0.4, 34, TILES.GRASS, 0, -0.2, 1.5, this.root, false);
    // Flower patches
    this.makeAtlasBox(4.5, 0.42, 3.2, TILES.GRASS_FLOWER, -9, -0.19, 14.5, this.root, false);
    this.makeAtlasBox(4.5, 0.42, 3.2, TILES.GRASS_FLOWER, 9, -0.19, 14.5, this.root, false);
    // Stone entry path from Z=10 to Z=17.5
    this.makeAtlasBox(3.6, 0.44, 7.6, TILES.STONE_PATH, 0, -0.18, 13.8, this.root, false);
    // Porch slab
    this.makeAtlasBox(12, 0.46, 2.2, TILES.STONE_PATH, 0, -0.17, 11.1, this.root, false);
  }

  buildFloors() {
    // Living Lounge (SW) - warm wood planks + centerpiece rug
    this.makeAtlasBox(12, 0.14, 10, TILES.WOOD_FLOOR, -6, 0.04, 5, this.root, false);
    this.makeAtlasBox(4.4, 0.04, 4.6, TILES.RUG_WARM, -7.2, 0.12, 5.0, this.root, false);

    // Study & Library (NW) - walnut/wood planks + blue rug
    this.makeAtlasBox(12, 0.14, 10, TILES.WOOD_FLOOR, -6, 0.04, -5, this.root, false);
    this.makeAtlasBox(4.2, 0.04, 3.6, TILES.RUG_CORNER, -6.0, 0.12, -5.2, this.root, false);

    // AI & Robotics Lab (NE) - clean lab checkerboard tiles
    this.makeAtlasBox(12, 0.14, 10, TILES.LAB_TILE, 6, 0.04, -5, this.root, false);

    // Arcade & Trophy Den (SE) - retro neon carpet
    this.makeAtlasBox(12, 0.14, 10, TILES.ARCADE_CARPET, 6, 0.04, 5, this.root, false);
  }

  buildWalls() {
    for (const seg of WALL_SEGMENTS) {
      const tile =
        seg.group === 'interior'
          ? TILES.WALL_WAINSCOT
          : [
              TILES.WALL_BRICK,
              TILES.WALL_BRICK,
              TILES.ROOF_SHINGLE,
              TILES.WOOD_WALNUT,
              seg.group === 'north' ? TILES.WALL_WAINSCOT : TILES.WALL_BRICK,
              seg.group === 'south' ? TILES.WALL_WAINSCOT : TILES.WALL_BRICK,
            ];

      const mesh = this.makeAtlasBox(seg.w, seg.h, seg.d, tile, seg.x, seg.h / 2, seg.z);
      mesh.userData.fullHeight = seg.h;
      this.wallMeshes[seg.group].push(mesh);
    }

    // Windows on North wall (cutaway-aware alongside north wall)
    const winL = this.makeAtlasBox(2.2, 1.6, 0.72, TILES.WINDOW_NIGHT, -6.0, 2.7, -10.0, this.root);
    const winR = this.makeAtlasBox(2.2, 1.6, 0.72, TILES.WINDOW_NIGHT, 6.0, 2.7, -10.0, this.root);
    winL.userData.isWallAttachment = true;
    winR.userData.isWallAttachment = true;

    // Front Door Archway Frame
    const doorTop = this.makeAtlasBox(4.4, 0.6, 0.75, TILES.WOOD_WALNUT, 0, 4.3, 10, this.root);
    const doorL = this.makeAtlasBox(0.35, 4.0, 0.75, TILES.WOOD_WALNUT, -2.0, 2.0, 10, this.root);
    const doorR = this.makeAtlasBox(0.35, 4.0, 0.75, TILES.WOOD_WALNUT, 2.0, 2.0, 10, this.root);
    doorTop.userData.isWallAttachment = true;
    doorL.userData.isWallAttachment = true;
    doorR.userData.isWallAttachment = true;

    // Wall Posters
    const posterL = this.makeAtlasBox(1.8, 1.4, 0.12, TILES.POSTER_AI, -2.5, 2.7, -9.65, this.root);
    const posterR = this.makeAtlasBox(1.8, 1.4, 0.12, TILES.POSTER_UAV, 2.5, 2.7, -9.65, this.root);
    posterL.userData.isWallAttachment = true;
    posterR.userData.isWallAttachment = true;

    this.northAttachments = [winL, winR, posterL, posterR];
    this.southAttachments = [doorTop, doorL, doorR];
  }

  buildRoofTrim() {
    // Low-poly stepped pixel gable roof (visible when in First-Person mode or toggled)
    for (let layer = 0; layer < 4; layer += 1) {
      const inset = layer * 1.8;
      this.makeAtlasBox(
        25.4 - inset * 2,
        0.55,
        21.4 - inset * 2,
        TILES.ROOF_SHINGLE,
        0,
        4.85 + layer * 0.55,
        0,
        this.roofGroup
      );
    }
    // Chimney
    this.makeAtlasBox(1.6, 3.0, 1.6, TILES.WALL_BRICK, -8.5, 6.5, -7.0, this.roofGroup);
  }

  buildFurniture() {
    // === 1. STUDY & LIBRARY (NW) ===
    // Bookshelf Frame at (-6.0, -9.0)
    this.makeAtlasBox(4.4, 3.2, 0.9, TILES.WOOD_WALNUT, -6.0, 1.6, -9.0);
    // Shelf planks
    this.makeAtlasBox(4.1, 0.14, 0.85, TILES.WOOD_OAK, -6.0, 0.8, -8.92);
    this.makeAtlasBox(4.1, 0.14, 0.85, TILES.WOOD_OAK, -6.0, 1.7, -8.92);
    this.makeAtlasBox(4.1, 0.14, 0.85, TILES.WOOD_OAK, -6.0, 2.6, -8.92);
    // Default colorful book rows (WorldPopulator adds/recolors per GitHub repo!)
    this.makeAtlasBox(3.8, 0.65, 0.6, TILES.BOOK_BLUE, -6.0, 1.2, -8.85, this.dynamicBookGroup);
    this.makeAtlasBox(3.8, 0.65, 0.6, TILES.BOOK_RED, -6.0, 2.1, -8.85, this.dynamicBookGroup);
    this.makeAtlasBox(3.8, 0.55, 0.6, TILES.BOOK_GREEN, -6.0, 2.95, -8.85, this.dynamicBookGroup);

    // Coding Workstation Desk at (-9.9, -4.5)
    this.makeAtlasBox(1.6, 0.9, 3.3, TILES.WOOD_OAK, -9.9, 0.45, -4.5);
    // Dual Pixel Monitors, Keyboard, Mouse & Desk Lamp
    this.makeAtlasBox(0.2, 0.85, 1.2, [TILES.MONITOR_CODE, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK], -10.2, 1.45, -3.7);
    this.makeAtlasBox(0.2, 0.85, 1.2, [TILES.MONITOR_CODE, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK], -10.2, 1.45, -5.3);
    this.makeAtlasBox(0.32, 0.06, 0.95, TILES.METAL_DARK, -9.55, 0.93, -4.5);
    this.makeAtlasBox(0.16, 0.55, 0.16, TILES.METAL_ACCENT, -10.3, 1.18, -5.85);
    this.makeAtlasBox(0.35, 0.25, 0.35, TILES.LANTERN_GLOW, -10.2, 1.5, -5.85);
    // Study Whiteboard on NW wall
    this.makeAtlasBox(2.2, 1.4, 0.12, TILES.SUNDIAL_STONE, -9.8, 2.55, -9.62);
    // Desk chair
    this.makeAtlasBox(0.8, 0.6, 0.8, TILES.SOFA_FABRIC, -8.6, 0.35, -4.5);

    // === 2. AI & ROBOTICS LAB (NE) ===
    // Drone & CV Workbench at (6.0, -8.9)
    this.makeAtlasBox(4.1, 1.0, 1.2, TILES.METAL_DARK, 6.0, 0.5, -8.9);
    this.makeAtlasBox(4.2, 0.14, 1.3, TILES.METAL_ACCENT, 6.0, 1.05, -8.9);
    // Lab monitor on bench (YOLOv8 CV display)
    this.makeAtlasBox(1.2, 0.85, 0.18, [TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.MONITOR_CODE, TILES.METAL_DARK], 5.1, 1.55, -9.1);
    // Rover chassis on bench
    this.makeAtlasBox(1.1, 0.35, 0.8, TILES.DRONE_BODY, 6.6, 1.32, -8.8);
    // Articulating Robotic Arm on Workbench
    this.robotArmBase = new THREE.Group();
    this.robotArmBase.position.set(7.65, 1.12, -8.85);
    this.makeAtlasBox(0.36, 0.18, 0.36, TILES.METAL_DARK, 0, 0.09, 0, this.robotArmBase);
    this.makeAtlasBox(0.16, 0.65, 0.16, TILES.DRONE_BODY, 0, 0.45, 0, this.robotArmBase);
    this.robotArmUpper = new THREE.Group();
    this.robotArmUpper.position.set(0, 0.72, 0);
    this.makeAtlasBox(0.14, 0.14, 0.65, TILES.METAL_ACCENT, 0, 0, 0.28, this.robotArmUpper);
    this.makeAtlasBox(0.24, 0.14, 0.16, TILES.LANTERN_GLOW, 0, -0.04, 0.62, this.robotArmUpper);
    this.robotArmBase.add(this.robotArmUpper);
    this.root.add(this.robotArmBase);

    // AI Server Rack at (10.8, -4.8)
    this.makeAtlasBox(1.1, 2.8, 2.4, [TILES.METAL_DARK, TILES.SERVER_RACK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.SERVER_RACK, TILES.METAL_DARK], 10.8, 1.4, -4.8);

    // Hovering Low-Poly UAV Quadcopter over Test Pad (6.0, -4.2)
    this.makeAtlasBox(1.5, 0.18, 1.5, TILES.METAL_ACCENT, 6.0, 0.15, -4.2);
    this.droneRotorGroup = new THREE.Group();
    this.droneRotorGroup.position.set(6.0, 1.45, -4.2);
    this.root.add(this.droneRotorGroup);
    this.makeAtlasBox(0.55, 0.22, 0.55, TILES.DRONE_BODY, 0, 0, 0, this.droneRotorGroup);
    this.makeAtlasBox(1.4, 0.08, 0.12, TILES.METAL_DARK, 0, 0.04, 0, this.droneRotorGroup);
    this.makeAtlasBox(0.12, 0.08, 1.4, TILES.METAL_DARK, 0, 0.04, 0, this.droneRotorGroup);
    for (const [rx, rz] of [[-0.65, 0], [0.65, 0], [0, -0.65], [0, 0.65]]) {
      const prop = this.makeAtlasBox(0.42, 0.04, 0.14, TILES.LANTERN_GLOW, rx, 0.12, rz, this.droneRotorGroup);
      this.dronePropellers.push(prop);
    }

    // === 3. LIVING LOUNGE (SW) ===
    // Cozy Pixel Sofa at (-5.4, 5.0) facing West
    this.makeAtlasBox(1.4, 0.55, 3.6, TILES.SOFA_FABRIC, -5.4, 0.32, 5.0);
    this.makeAtlasBox(0.38, 1.15, 3.6, TILES.SOFA_FABRIC, -4.85, 0.72, 5.0);
    this.makeAtlasBox(1.4, 0.85, 0.36, TILES.SOFA_FABRIC, -5.4, 0.52, 3.35);
    this.makeAtlasBox(1.4, 0.85, 0.36, TILES.SOFA_FABRIC, -5.4, 0.52, 6.65);
    this.makeAtlasBox(0.45, 0.45, 0.55, TILES.SOFA_PILLOW, -5.2, 0.75, 4.0);
    this.makeAtlasBox(0.45, 0.45, 0.55, TILES.SOFA_PILLOW, -5.2, 0.75, 6.0);

    // Coffee Table at (-7.8, 5.0) with Pixel Laptop & Coffee Mug
    this.makeAtlasBox(1.05, 0.42, 2.0, TILES.WOOD_OAK, -7.8, 0.28, 5.0);
    this.makeAtlasBox(0.45, 0.06, 0.58, TILES.METAL_DARK, -7.8, 0.52, 4.7);
    this.makeAtlasBox(0.06, 0.38, 0.58, TILES.MONITOR_CODE, -8.0, 0.72, 4.7);
    this.makeAtlasBox(0.18, 0.2, 0.18, TILES.SOFA_PILLOW, -7.75, 0.58, 5.45);
    // Warm Lamp next to Sofa
    this.makeAtlasBox(0.35, 1.6, 0.35, TILES.WOOD_WALNUT, -4.8, 0.8, 2.6);
    this.makeAtlasBox(0.7, 0.55, 0.7, TILES.LANTERN_GLOW, -4.8, 1.75, 2.6);

    // Retro TV Media Console at (-10.9, 5.0)
    this.makeAtlasBox(0.95, 0.75, 3.0, TILES.WOOD_WALNUT, -10.9, 0.4, 5.0);
    this.makeAtlasBox(0.35, 1.35, 2.2, [TILES.TV_SCREEN, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK], -10.95, 1.48, 5.0);

    // Avatar Wardrobe Mirror at (-3.2, 9.1)
    this.makeAtlasBox(1.6, 2.5, 0.45, TILES.WOOD_WALNUT, -3.2, 1.3, 9.1);
    this.makeAtlasBox(1.2, 1.9, 0.48, TILES.MIRROR_GLASS, -3.2, 1.35, 9.05);

    // === 4. ARCADE & TROPHY DEN (SE) ===
    // Dual Retro Arcade Cabinets at (10.1, 4.6) and (10.1, 6.7)
    this.makeAtlasBox(1.3, 1.4, 1.5, TILES.ARCADE_SIDE, 10.1, 0.7, 4.6);
    this.makeAtlasBox(1.0, 1.15, 1.4, [TILES.ARCADE_SIDE, TILES.ARCADE_SCREEN, TILES.ARCADE_SIDE, TILES.ARCADE_SIDE, TILES.ARCADE_SIDE, TILES.ARCADE_SIDE], 10.2, 1.85, 4.6);
    this.makeAtlasBox(1.3, 0.35, 1.5, TILES.ARCADE_SIDE, 10.1, 2.55, 4.6);

    this.makeAtlasBox(1.3, 1.4, 1.4, TILES.ARCADE_SIDE, 10.1, 0.7, 6.6);
    this.makeAtlasBox(1.0, 1.15, 1.3, [TILES.ARCADE_SIDE, TILES.ARCADE_SCREEN, TILES.ARCADE_SIDE, TILES.ARCADE_SIDE, TILES.ARCADE_SIDE, TILES.ARCADE_SIDE], 10.2, 1.85, 6.6);
    this.makeAtlasBox(1.3, 0.35, 1.4, TILES.ARCADE_SIDE, 10.1, 2.55, 6.6);

    // Arcade Synth Keyboard & Cozy Beanbag
    this.makeAtlasBox(1.6, 0.16, 0.6, TILES.METAL_DARK, 2.4, 0.85, 8.9);
    this.makeAtlasBox(0.16, 0.8, 0.45, TILES.METAL_ACCENT, 1.75, 0.42, 8.9);
    this.makeAtlasBox(0.16, 0.8, 0.45, TILES.METAL_ACCENT, 3.05, 0.42, 8.9);
    this.makeAtlasBox(1.3, 0.55, 1.3, TILES.SOFA_PILLOW, 3.3, 0.32, 4.8);

    // Hackathon Trophy Shelf at (6.0, 9.1)
    this.makeAtlasBox(3.4, 1.5, 0.8, TILES.WOOD_WALNUT, 6.0, 0.75, 9.1);
    this.makeAtlasBox(0.5, 0.65, 0.5, TILES.TROPHY_GOLD, 5.0, 1.85, 9.1, this.trophyGroup);
    this.makeAtlasBox(0.55, 0.85, 0.55, TILES.TROPHY_GOLD, 6.0, 1.95, 9.1, this.trophyGroup);
    this.makeAtlasBox(0.5, 0.65, 0.5, TILES.TROPHY_GOLD, 7.0, 1.85, 9.1, this.trophyGroup);

    // Front Porch Flower Planter Boxes
    this.makeAtlasBox(2.4, 0.48, 0.55, TILES.WALL_BRICK, -5.8, 0.25, 10.55);
    this.makeAtlasBox(2.2, 0.38, 0.45, TILES.GRASS_FLOWER, -5.8, 0.62, 10.55);
    this.makeAtlasBox(2.4, 0.48, 0.55, TILES.WALL_BRICK, 5.8, 0.25, 10.55);
    this.makeAtlasBox(2.2, 0.38, 0.45, TILES.GRASS_FLOWER, 5.8, 0.62, 10.55);
  }

  buildGardenProps() {
    // Environment Sundial / Lantern at (-4.5, 13.0)
    this.makeAtlasBox(1.2, 0.35, 1.2, TILES.SUNDIAL_STONE, -4.5, 0.18, 13.0);
    this.makeAtlasBox(0.55, 1.25, 0.55, TILES.SUNDIAL_STONE, -4.5, 0.95, 13.0);
    this.makeAtlasBox(0.75, 0.6, 0.75, TILES.LANTERN_GLOW, -4.5, 1.8, 13.0);

    // GitHub Mailbox at (4.2, 13.5)
    this.makeAtlasBox(0.28, 1.0, 0.28, TILES.WOOD_WALNUT, 4.2, 0.5, 13.5);
    this.makeAtlasBox(0.7, 0.55, 0.9, TILES.MAILBOX_BLUE, 4.2, 1.25, 13.5);

    // Low-poly Pixel Oak Trees
    const treePositions = [
      [-14.8, 14.2],
      [14.8, 14.2],
      [-15.2, -7.5],
      [15.2, -7.5],
    ];
    for (const [tx, tz] of treePositions) {
      this.makeAtlasBox(0.9, 2.2, 0.9, TILES.TRUNK_BARK, tx, 1.1, tz);
      const canopy = new THREE.Group();
      canopy.position.set(tx, 2.2, tz);
      this.root.add(canopy);
      this.makeAtlasBox(2.9, 2.0, 2.9, TILES.LEAF_OAK, 0, 0.8, 0, canopy);
      this.makeAtlasBox(2.0, 1.3, 2.0, TILES.LEAF_OAK, 0, 2.2, 0, canopy);
      this.swayCanopies.push({ group: canopy, phase: tx * 0.5 + tz * 0.3 });
    }

    // Reflective Pixel Koi Pond on West Patio Lawn
    this.makeAtlasBox(4.0, 0.25, 2.8, TILES.STONE_PATH, -10.5, 0.08, 12.6, this.root, false);
    this.pondWaterMesh = this.makeAtlasBox(3.4, 0.28, 2.2, TILES.WATER_POND, -10.5, 0.09, 12.6, this.root, false);

    // Traditional Onam Pookalam Mosaic on Front Porch (mohil-c-mbc-pookalam-24)
    this.makeAtlasBox(2.4, 0.06, 2.4, TILES.POOKALAM_TILE, 0, 0.08, 12.2, this.root, false);

    // Potted Pixel Plants inside Living Lounge & Study
    const plantSpots = [
      [-10.8, 1.4],
      [-1.4, -8.8],
      [10.8, 8.8],
    ];
    for (const [px, pz] of plantSpots) {
      this.makeAtlasBox(0.6, 0.55, 0.6, TILES.WALL_BRICK, px, 0.35, pz);
      const leaves = this.makeAtlasBox(0.85, 0.75, 0.85, TILES.LEAF_OAK, px, 0.95, pz);
      this.swayCanopies.push({ group: leaves, phase: px + pz });
    }

    // Dynamic Physics Props (linked to PhysicsSystem)
    this.physicsPropMeshes = {
      'patio-soccer-ball': this.makeAtlasBox(0.72, 0.72, 0.72, TILES.SOCCER_BALL, 2.4, 0.42, 15.2),
      'patio-crate-1': this.makeAtlasBox(0.85, 0.85, 0.85, TILES.CRATE_WOOD, -7.2, 0.42, 13.8),
      'lab-rover-cube': this.makeAtlasBox(0.7, 0.7, 0.7, TILES.DRONE_BODY, 7.5, 0.45, -2.4),
      'park-soccer-ball': this.makeAtlasBox(0.72, 0.72, 0.72, TILES.SOCCER_BALL, -34.0, 0.42, 4.0),
    };
  }

  buildHouseAnimations() {
    // 1. Auto-Swinging Double Front Doors on hinges at Z = 10
    this.frontDoorLeft = new THREE.Group();
    this.frontDoorLeft.position.set(-1.82, 0, 10.0);
    this.makeAtlasBox(1.8, 2.7, 0.22, TILES.DOOR_WOOD, 0.9, 1.35, 0, this.frontDoorLeft);
    this.root.add(this.frontDoorLeft);

    this.frontDoorRight = new THREE.Group();
    this.frontDoorRight.position.set(1.82, 0, 10.0);
    this.makeAtlasBox(1.8, 2.7, 0.22, TILES.DOOR_WOOD, -0.9, 1.35, 0, this.frontDoorRight);
    this.root.add(this.frontDoorRight);

    // 2. Living Lounge Hearth / Fireplace under portrait at (-2.3, 0.55)
    this.makeAtlasBox(1.7, 1.25, 0.7, TILES.SUNDIAL_STONE, -2.3, 0.65, 0.55);
    this.makeAtlasBox(1.9, 0.16, 0.82, TILES.WOOD_WALNUT, -2.3, 1.32, 0.55);
    const flameColors = [0xf97316, 0xfacc15, 0xef4444];
    for (let i = 0; i < 3; i += 1) {
      const f = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.42, 0.24),
        new THREE.MeshBasicMaterial({ color: flameColors[i] })
      );
      f.position.set(-2.55 + i * 0.25, 0.45, 0.85);
      f.userData.phase = i * 2.1;
      this.root.add(f);
      this.hearthFlames.push(f);
    }
    this.hearthLight = new THREE.PointLight(0xff7b29, 1.4, 7.5, 1.8);
    this.hearthLight.position.set(-2.3, 0.9, 1.2);
    this.root.add(this.hearthLight);

    // 3. Oscillating Pixel Standing Fan in Lounge (-4.2, 2.0)
    this.makeAtlasBox(0.55, 0.12, 0.55, TILES.METAL_DARK, -4.2, 0.16, 2.0);
    this.makeAtlasBox(0.14, 1.25, 0.14, TILES.METAL_ACCENT, -4.2, 0.8, 2.0);
    this.fanHead = new THREE.Group();
    this.fanHead.position.set(-4.2, 1.5, 2.0);
    this.root.add(this.fanHead);
    this.makeAtlasBox(0.32, 0.32, 0.32, TILES.METAL_DARK, 0, 0, 0, this.fanHead);
    this.fanBlades = new THREE.Group();
    this.fanBlades.position.set(0, 0, 0.22);
    this.makeAtlasBox(0.75, 0.12, 0.05, TILES.LANTERN_GLOW, 0, 0, 0, this.fanBlades);
    this.makeAtlasBox(0.12, 0.75, 0.05, TILES.LANTERN_GLOW, 0, 0, 0, this.fanBlades);
    this.fanHead.add(this.fanBlades);

    // 4. Grandfather / Wall Pendulum Clock on Center Divider (-0.32, -1.4 facing Study)
    this.makeAtlasBox(0.22, 1.9, 0.72, TILES.WOOD_WALNUT, -0.32, 1.4, -1.4);
    this.makeAtlasBox(0.26, 0.5, 0.5, TILES.SUNDIAL_STONE, -0.34, 2.05, -1.4);
    this.clockPendulum = new THREE.Group();
    this.clockPendulum.position.set(-0.46, 1.65, -1.4);
    const rod = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.65, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    rod.position.y = -0.35;
    this.clockPendulum.add(rod);
    this.root.add(this.clockPendulum);

    // 5. Blinking Lab Server Rack LEDs
    const ledColors = [0x22c55e, 0x38bdf8, 0xf43f5e, 0xfacc15];
    for (let i = 0; i < 4; i += 1) {
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.14, 0.14),
        new THREE.MeshBasicMaterial({ color: ledColors[i] })
      );
      led.position.set(10.22, 0.8 + i * 0.48, -4.3 - (i % 2) * 0.8);
      led.userData.phase = i * 1.4;
      this.root.add(led);
      this.serverLeds.push(led);
    }

    // 6. Swimming Pixel Koi Fish in Backyard/Patio Pond (-10.5, 0.24, 12.6)
    const koiColors = [0xf97316, 0xf8fafc];
    for (let i = 0; i < 2; i += 1) {
      const fish = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.12, 0.16),
        new THREE.MeshBasicMaterial({ color: koiColors[i] })
      );
      fish.userData.phase = i * Math.PI;
      this.root.add(fish);
      this.koiFish.push(fish);
    }
  }

  /**
   * Adjusts wall cutaway heights and roof visibility dynamically based on camera mode
   * and camera orbit angle so the isometric viewer never has rooms occluded by outer walls!
   */
  updateCutaway(cameraMode, cameraYaw) {
    if (cameraMode === 'firstPerson') {
      this.roofGroup.visible = true;
      for (const group of Object.values(this.wallMeshes)) {
        for (const m of group) {
          m.scale.y = 1;
          m.position.y = m.userData.fullHeight / 2;
        }
      }
      for (const m of [...(this.northAttachments || []), ...(this.southAttachments || [])]) {
        m.visible = true;
      }
      return;
    }

    // Isometric cutaway: hide roof so all 4 rooms shine clearly
    this.roofGroup.visible = false;

    // Camera view vector points from camera to target; determine which side camera sits on
    const camOffsetX = Math.sin(cameraYaw);
    const camOffsetZ = Math.cos(cameraYaw);

    const lowerWall = (meshes, shouldCut) => {
      const targetScale = shouldCut ? 0.14 : 1.0;
      for (const m of meshes) {
        m.scale.y += (targetScale - m.scale.y) * 0.22;
        m.position.y = (m.userData.fullHeight * m.scale.y) / 2;
      }
    };

    const cutSouth = camOffsetZ > -0.2;
    const cutNorth = camOffsetZ < -0.35;
    lowerWall(this.wallMeshes.south, cutSouth);
    lowerWall(this.wallMeshes.north, cutNorth);
    lowerWall(this.wallMeshes.east, camOffsetX > 0.25);
    lowerWall(this.wallMeshes.west, camOffsetX < -0.25);
    lowerWall(this.wallMeshes.interior, false);

    for (const m of this.northAttachments || []) m.visible = !cutNorth;
    for (const m of this.southAttachments || []) m.visible = !cutSouth;
  }

  updateAnimations(elapsed, avatarPos = null, dt = 0.016) {
    if (this.droneRotorGroup) {
      this.droneRotorGroup.position.y = 1.48 + Math.sin(elapsed * 3.2) * 0.14;
      this.droneRotorGroup.rotation.y = elapsed * 0.7;
      for (const prop of this.dronePropellers) {
        prop.rotation.y += dt * 22;
      }
    }

    if (this.pondWaterMesh) {
      this.pondWaterMesh.position.y = 0.09 + Math.sin(elapsed * 2.1) * 0.015;
    }

    // Proximity-activated swinging front doors
    if (this.frontDoorLeft && this.frontDoorRight) {
      const distToDoor = avatarPos
        ? Math.hypot(avatarPos.x - 0, avatarPos.z - 10.0)
        : 99;
      const openAngle = distToDoor < 4.2 ? 1.35 : 0;
      const lerp = Math.min(1, dt * 7);
      this.frontDoorLeft.rotation.y += (openAngle - this.frontDoorLeft.rotation.y) * lerp;
      this.frontDoorRight.rotation.y += (-openAngle - this.frontDoorRight.rotation.y) * lerp;
    }

    // Lounge oscillating fan
    if (this.fanHead && this.fanBlades) {
      this.fanHead.rotation.y = -Math.PI * 0.35 + Math.sin(elapsed * 1.1) * 0.55;
      this.fanBlades.rotation.z = elapsed * 14;
    }

    // Clock pendulum swing
    if (this.clockPendulum) {
      this.clockPendulum.rotation.x = Math.sin(elapsed * 3.14) * 0.28;
    }

    // Hearth flickering flames + warm light
    for (const f of this.hearthFlames) {
      const pulse = 0.75 + Math.sin(elapsed * 12 + f.userData.phase) * 0.35;
      f.scale.y = Math.max(0.45, pulse);
    }
    if (this.hearthLight) {
      this.hearthLight.intensity = 1.1 + Math.sin(elapsed * 15) * 0.28;
    }

    // Lab server LED telemetry pulse
    for (const led of this.serverLeds) {
      led.visible = Math.sin(elapsed * 5 + led.userData.phase) > -0.2;
    }

    // Swimming Koi fish figure-8 in pond (-10.5, 12.6)
    for (const fish of this.koiFish) {
      const t = elapsed * 1.15 + fish.userData.phase;
      const fx = -10.5 + Math.cos(t) * 1.05;
      const fz = 12.6 + Math.sin(t * 2) * 0.48;
      const dx = -Math.sin(t) * 1.05;
      const dz = Math.cos(t * 2) * 0.96;
      fish.position.set(fx, 0.25, fz);
      fish.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    }

    // Gentle tree & potted plant breeze sway
    for (const item of this.swayCanopies) {
      item.group.rotation.z = Math.sin(elapsed * 1.6 + item.phase) * 0.035;
    }

    // Lab Articulating Robotic Arm
    if (this.robotArmBase && this.robotArmUpper) {
      this.robotArmBase.rotation.y = Math.sin(elapsed * 1.2) * 0.65;
      this.robotArmUpper.rotation.x = -0.25 + Math.sin(elapsed * 2.4) * 0.35;
    }
  }
}
