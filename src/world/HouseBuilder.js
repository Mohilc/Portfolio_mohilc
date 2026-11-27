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
    // Dual Pixel Monitors
    this.makeAtlasBox(0.2, 0.85, 1.2, [TILES.MONITOR_CODE, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK], -10.2, 1.45, -3.7);
    this.makeAtlasBox(0.2, 0.85, 1.2, [TILES.MONITOR_CODE, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK], -10.2, 1.45, -5.3);
    // Desk chair
    this.makeAtlasBox(0.8, 0.6, 0.8, TILES.SOFA_FABRIC, -8.6, 0.35, -4.5);

    // === 2. AI & ROBOTICS LAB (NE) ===
    // Drone & CV Workbench at (6.0, -8.9)
    this.makeAtlasBox(4.1, 1.0, 1.2, TILES.METAL_DARK, 6.0, 0.5, -8.9);
    this.makeAtlasBox(4.2, 0.14, 1.3, TILES.METAL_ACCENT, 6.0, 1.05, -8.9);
    // Lab monitor on bench
    this.makeAtlasBox(1.2, 0.85, 0.18, [TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.METAL_DARK, TILES.MONITOR_CODE, TILES.METAL_DARK], 5.1, 1.55, -9.1);
    // Rover chassis on bench
    this.makeAtlasBox(1.1, 0.35, 0.8, TILES.DRONE_BODY, 7.0, 1.32, -8.8);

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
      this.makeAtlasBox(0.36, 0.04, 0.36, TILES.LANTERN_GLOW, rx, 0.12, rz, this.droneRotorGroup);
    }

    // === 3. LIVING LOUNGE (SW) ===
    // Cozy Pixel Sofa at (-5.4, 5.0) facing West
    this.makeAtlasBox(1.4, 0.55, 3.6, TILES.SOFA_FABRIC, -5.4, 0.32, 5.0);
    this.makeAtlasBox(0.38, 1.15, 3.6, TILES.SOFA_FABRIC, -4.85, 0.72, 5.0);
    this.makeAtlasBox(1.4, 0.85, 0.36, TILES.SOFA_FABRIC, -5.4, 0.52, 3.35);
    this.makeAtlasBox(1.4, 0.85, 0.36, TILES.SOFA_FABRIC, -5.4, 0.52, 6.65);
    this.makeAtlasBox(0.45, 0.45, 0.55, TILES.SOFA_PILLOW, -5.2, 0.75, 4.0);
    this.makeAtlasBox(0.45, 0.45, 0.55, TILES.SOFA_PILLOW, -5.2, 0.75, 6.0);

    // Coffee Table at (-7.8, 5.0)
    this.makeAtlasBox(1.05, 0.42, 2.0, TILES.WOOD_OAK, -7.8, 0.28, 5.0);
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
    // Retro Arcade Cabinet at (10.1, 4.6) facing West
    this.makeAtlasBox(1.3, 1.4, 1.5, TILES.ARCADE_SIDE, 10.1, 0.7, 4.6);
    this.makeAtlasBox(1.0, 1.15, 1.4, [TILES.ARCADE_SIDE, TILES.ARCADE_SCREEN, TILES.ARCADE_SIDE, TILES.ARCADE_SIDE, TILES.ARCADE_SIDE, TILES.ARCADE_SIDE], 10.2, 1.85, 4.6);
    this.makeAtlasBox(1.3, 0.35, 1.5, TILES.ARCADE_SIDE, 10.1, 2.55, 4.6);

    // Hackathon Trophy Shelf at (6.0, 9.1)
    this.makeAtlasBox(3.4, 1.5, 0.8, TILES.WOOD_WALNUT, 6.0, 0.75, 9.1);
    this.makeAtlasBox(0.5, 0.65, 0.5, TILES.TROPHY_GOLD, 5.0, 1.85, 9.1, this.trophyGroup);
    this.makeAtlasBox(0.55, 0.85, 0.55, TILES.TROPHY_GOLD, 6.0, 1.95, 9.1, this.trophyGroup);
    this.makeAtlasBox(0.5, 0.65, 0.5, TILES.TROPHY_GOLD, 7.0, 1.85, 9.1, this.trophyGroup);
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
      this.makeAtlasBox(2.9, 2.0, 2.9, TILES.LEAF_OAK, tx, 3.0, tz);
      this.makeAtlasBox(2.0, 1.3, 2.0, TILES.LEAF_OAK, tx, 4.4, tz);
    }

    // Reflective Pixel Koi Pond on West Patio Lawn
    this.makeAtlasBox(4.0, 0.25, 2.8, TILES.STONE_PATH, -10.5, 0.08, 12.6, this.root, false);
    this.pondWaterMesh = this.makeAtlasBox(3.4, 0.28, 2.2, TILES.WATER_POND, -10.5, 0.09, 12.6, this.root, false);

    // Potted Pixel Plants inside Living Lounge & Study
    const plantSpots = [
      [-10.8, 1.4],
      [-1.4, -8.8],
      [10.8, 8.8],
    ];
    for (const [px, pz] of plantSpots) {
      this.makeAtlasBox(0.6, 0.55, 0.6, TILES.WALL_BRICK, px, 0.35, pz);
      this.makeAtlasBox(0.85, 0.75, 0.85, TILES.LEAF_OAK, px, 0.95, pz);
    }

    // Dynamic Physics Props (linked to PhysicsSystem)
    this.physicsPropMeshes = {
      'patio-soccer-ball': this.makeAtlasBox(0.72, 0.72, 0.72, TILES.SOCCER_BALL, 2.4, 0.42, 15.2),
      'patio-crate-1': this.makeAtlasBox(0.85, 0.85, 0.85, TILES.CRATE_WOOD, -7.2, 0.42, 13.8),
      'lab-rover-cube': this.makeAtlasBox(0.7, 0.7, 0.7, TILES.DRONE_BODY, 7.5, 0.45, -2.4),
      'park-soccer-ball': this.makeAtlasBox(0.72, 0.72, 0.72, TILES.SOCCER_BALL, -34.0, 0.42, 4.0),
    };
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
      const targetScale = shouldCut ? 0.22 : 1.0;
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

  updateAnimations(elapsed) {
    if (this.droneRotorGroup) {
      this.droneRotorGroup.position.y = 1.48 + Math.sin(elapsed * 3.2) * 0.14;
      this.droneRotorGroup.rotation.y = elapsed * 0.8;
    }
    if (this.pondWaterMesh) {
      this.pondWaterMesh.position.y = 0.09 + Math.sin(elapsed * 2.1) * 0.015;
    }
  }
}
