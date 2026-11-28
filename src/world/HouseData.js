/**
 * Authoritative layout for the entire open world themed around Mohilc's GitHub repositories:
 * - Homestead (4 interior rooms + Pookalam Patio)
 * - VisionSafe AI Avenue & Crosswalks
 * - West AgriVision AI Farm, Neighbor Cottage & Sports Park
 * - East Hoshiko Byte Cafe & Rescue Rover Test Arena
 * - South Central Fountain Plaza, NASA Space Observatory & GitHub Innovation Tower
 * - North Munnar Tea Hills & Scenic Gazebo
 */
export const WORLD_BOUNDS = {
  minX: -66,
  maxX: 66,
  minZ: -56,
  maxZ: 66,
};

export const ROOMS = [
  {
    id: 'patio',
    name: 'GARDEN PATIO',
    subtitle: 'Mohilc Homestead & Pookalam Yard',
    bounds: { minX: -18, maxX: 18, minZ: 10, maxZ: 18 },
    spawn: { x: 0, z: 14.5 },
  },
  {
    id: 'living',
    name: 'LIVING LOUNGE',
    subtitle: 'About Mohilc, Hearth & Media TV',
    bounds: { minX: -12, maxX: 0, minZ: 0, maxZ: 10 },
    spawn: { x: -3.2, z: 4.5 },
  },
  {
    id: 'study',
    name: 'STUDY & LIBRARY',
    subtitle: 'GitHub Repositories & Stack',
    bounds: { minX: -12, maxX: 0, minZ: -10, maxZ: 0 },
    spawn: { x: -5.8, z: -4.2 },
  },
  {
    id: 'lab',
    name: 'AI & ROBOTICS LAB',
    subtitle: 'Computer Vision, UAV & Embedded',
    bounds: { minX: 0, maxX: 12, minZ: -10, maxZ: 0 },
    spawn: { x: 4.2, z: -4.5 },
  },
  {
    id: 'arcade',
    name: 'ARCADE & TROPHY DEN',
    subtitle: 'Mini-Games & Hackathons',
    bounds: { minX: 0, maxX: 12, minZ: 0, maxZ: 10 },
    spawn: { x: 5.5, z: 4.6 },
  },
  {
    id: 'city-plaza',
    name: 'CITY FOUNTAIN PLAZA',
    subtitle: 'Downtown Central Square',
    bounds: { minX: -18, maxX: 18, minZ: 30, maxZ: 56 },
    spawn: { x: 0, z: 33.5 },
  },
  {
    id: 'byte-cafe',
    name: 'HOSHIKO CAFÉ & ROVER LAB',
    subtitle: 'East Food Web & Rescue Rover Arena',
    bounds: { minX: 18, maxX: 66, minZ: -16, maxZ: 18 },
    spawn: { x: 31, z: 15.0 },
  },
  {
    id: 'city-park',
    name: 'AGRIVISION FARM & PARK',
    subtitle: 'Crop AI Greenhouse & Sports Pitch',
    bounds: { minX: -66, maxX: -18, minZ: -16, maxZ: 18 },
    spawn: { x: -34, z: 14.0 },
  },
  {
    id: 'avenue',
    name: 'VISIONSAFE AI AVENUE',
    subtitle: 'Smart Road Safety & Crosswalks',
    bounds: { minX: -66, maxX: 66, minZ: 18, maxZ: 30 },
    spawn: { x: 0, z: 20.0 },
  },
  {
    id: 'downtown-skyline',
    name: 'DOWNTOWN SKYLINE',
    subtitle: 'NASA Observatory & GitHub Tower',
    bounds: { minX: -66, maxX: 66, minZ: 30, maxZ: 66 },
    spawn: { x: 32, z: 35.5 },
  },
  {
    id: 'meadow',
    name: 'MUNNAR TEA HILLS',
    subtitle: 'Terraced Hills & Earth Bloom Overlook',
    bounds: { minX: -66, maxX: 66, minZ: -56, maxZ: 18 },
    spawn: { x: 0, z: -21.5 },
  },
];

export const WALL_SEGMENTS = [
  { id: 'wall-north', x: 0, z: -10, w: 24.6, d: 0.6, h: 4.6, group: 'north' },
  { id: 'wall-west', x: -12, z: 0, w: 0.6, d: 20.6, h: 4.6, group: 'west' },
  { id: 'wall-east', x: 12, z: 0, w: 0.6, d: 20.6, h: 4.6, group: 'east' },
  { id: 'wall-south-left', x: -7.15, z: 10, w: 10.3, d: 0.6, h: 4.6, group: 'south' },
  { id: 'wall-south-right', x: 7.15, z: 10, w: 10.3, d: 0.6, h: 4.6, group: 'south' },

  { id: 'int-ns-north', x: 0, z: -8.1, w: 0.45, d: 3.8, h: 4.2, group: 'interior' },
  { id: 'int-ns-mid', x: 0, z: 0, w: 0.45, d: 5.6, h: 4.2, group: 'interior' },
  { id: 'int-ns-south', x: 0, z: 6.2, w: 0.45, d: 1.8, h: 4.2, group: 'interior' },

  { id: 'int-ew-west', x: -9.9, z: 0, w: 4.2, d: 0.45, h: 4.2, group: 'interior' },
  { id: 'int-ew-mid', x: 0, z: 0, w: 8.8, d: 0.45, h: 4.2, group: 'interior' },
  { id: 'int-ew-east', x: 9.9, z: 0, w: 4.2, d: 0.45, h: 4.2, group: 'interior' },
];

export const FURNITURE_COLLIDERS = [
  // Study
  { id: 'col-bookshelf', x: -6.0, z: -9.0, w: 4.4, d: 1.0 },
  { id: 'col-desk', x: -9.9, z: -4.5, w: 1.7, d: 3.4 },
  // AI Lab
  { id: 'col-workbench', x: 6.0, z: -8.9, w: 4.2, d: 1.2 },
  { id: 'col-server', x: 10.8, z: -4.8, w: 1.2, d: 2.8 },
  { id: 'col-drone-pad', x: 6.0, z: -4.2, w: 1.5, d: 1.5 },
  // Living Lounge
  { id: 'col-sofa', x: -5.4, z: 5.0, w: 1.5, d: 3.8 },
  { id: 'col-coffee-table', x: -7.8, z: 5.0, w: 1.1, d: 2.2 },
  { id: 'col-tv-stand', x: -10.9, z: 5.0, w: 1.1, d: 3.2 },
  { id: 'col-mirror', x: -3.2, z: 9.1, w: 1.8, d: 0.7 },
  { id: 'col-hearth', x: -2.3, z: 0.55, w: 1.8, d: 0.8 },
  // Arcade Den
  { id: 'col-arcade', x: 10.1, z: 4.6, w: 1.5, d: 1.8 },
  { id: 'col-trophies', x: 6.0, z: 9.1, w: 3.6, d: 0.9 },
  // Patio
  { id: 'col-sundial', x: -4.5, z: 13.0, w: 1.3, d: 1.3 },
  { id: 'col-mailbox', x: 4.2, z: 13.5, w: 0.9, d: 0.9 },
  { id: 'col-porch-photo', x: -2.9, z: 10.65, w: 1.6, d: 0.5 },
  { id: 'col-porch-sign', x: 2.9, z: 10.65, w: 2.8, d: 0.5 },
  { id: 'col-plaza-photo', x: -4.6, z: 34.0, w: 1.6, d: 0.5 },
  { id: 'col-tree-sw', x: -14.8, z: 14.2, w: 1.4, d: 1.4 },
  { id: 'col-tree-se', x: 14.8, z: 14.2, w: 1.4, d: 1.4 },

  // Homestead Picket Fences
  { id: 'fence-s-left', x: -10.75, z: 18.0, w: 14.5, d: 0.5 },
  { id: 'fence-s-right', x: 10.75, z: 18.0, w: 14.5, d: 0.5 },
  { id: 'fence-w-north', x: -18.0, z: -6.0, w: 0.5, d: 16.0 },
  { id: 'fence-w-south', x: -18.0, z: 13.0, w: 0.5, d: 10.0 },
  { id: 'fence-e-north', x: 18.0, z: -6.0, w: 0.5, d: 16.0 },
  { id: 'fence-e-south', x: 18.0, z: 13.0, w: 0.5, d: 10.0 },

  // Neighbor & Repo-Themed City Landmarks
  { id: 'col-neighbor-cottage', x: -54.0, z: 2.0, w: 11.0, d: 10.0 },
  { id: 'col-agrivision-shed', x: -34.0, z: -9.5, w: 6.5, d: 4.5 },
  { id: 'col-byte-cafe', x: 31.0, z: 6.0, w: 12.0, d: 9.0 },
  { id: 'col-drone-tower', x: 53.0, z: -2.0, w: 6.5, d: 6.5 },
  { id: 'col-city-fountain', x: 0.0, z: 40.0, w: 6.2, d: 6.2 },
  { id: 'col-nasa-dome', x: -32.0, z: 45.0, w: 12.0, d: 12.0 },
  { id: 'col-west-studio', x: -52.0, z: 44.0, w: 11.0, d: 11.0 },
  { id: 'col-github-tower', x: 32.0, z: 45.0, w: 12.0, d: 12.0 },
  { id: 'col-east-office', x: 52.0, z: 46.0, w: 11.0, d: 11.0 },
  { id: 'col-munnar-gazebo', x: 0.0, z: -28.0, w: 5.0, d: 5.0 },
];

export const INTERACTIVE_TRIGGERS = [
  {
    id: 'bookshelf',
    roomId: 'study',
    title: 'GITHUB BOOKSHELF',
    prompt: 'Browse all 49 GitHub repositories & READMEs',
    kind: 'github_repos',
    x: -6.0,
    z: -7.5,
    radius: 2.3,
    markerPos: [-6.0, 2.9, -9.0],
  },
  {
    id: 'workstation',
    roomId: 'study',
    title: 'CODING WORKSTATION',
    prompt: 'Inspect tech stack, languages & commit activity',
    kind: 'stack_activity',
    x: -8.1,
    z: -4.5,
    radius: 2.2,
    markerPos: [-9.9, 2.6, -4.5],
  },
  {
    id: 'sofa',
    roomId: 'living',
    title: 'LOUNGE SOFA & HEARTH',
    prompt: 'Developer Bio, Photo, GitHub Profile & Stats',
    kind: 'profile_bio',
    x: -6.65,
    z: 5.0,
    radius: 2.6,
    markerPos: [-5.4, 2.2, 5.0],
  },
  {
    id: 'retro-tv',
    roomId: 'living',
    title: 'MEDIA CONSOLE TV',
    prompt: 'Watch live Vercel web demos & embedded previews',
    kind: 'embedded_media',
    x: -9.4,
    z: 5.0,
    radius: 2.2,
    markerPos: [-10.9, 2.6, 5.0],
  },
  {
    id: 'vanity-mirror',
    roomId: 'living',
    title: 'AVATAR WARDROBE MIRROR',
    prompt: 'Customize avatar style & upload portrait photo',
    kind: 'avatar_customizer',
    x: -3.2,
    z: 7.7,
    radius: 2.0,
    markerPos: [-3.2, 2.9, 9.1],
  },
  {
    id: 'workbench',
    roomId: 'lab',
    title: 'DRONE & CV WORKBENCH',
    prompt: 'CrackWise AI / UAV repos + Play Drone Scanner',
    kind: 'drone_lab',
    x: 6.0,
    z: -7.3,
    radius: 2.3,
    markerPos: [6.0, 2.6, -8.9],
  },
  {
    id: 'ai-terminal',
    roomId: 'lab',
    title: 'AI SERVER TERMINAL',
    prompt: 'Query MeiyonPersonalAI & live GitHub via CLI',
    kind: 'cli_terminal',
    x: 9.2,
    z: -4.8,
    radius: 2.1,
    markerPos: [10.8, 2.9, -4.8],
  },
  {
    id: 'arcade-cabinet',
    roomId: 'arcade',
    title: 'RETRO ARCADE & USELESS LAB',
    prompt: 'Play Git Snake & explore Useless Projects / Hackathons',
    kind: 'snake_game',
    x: 8.4,
    z: 4.6,
    radius: 2.2,
    markerPos: [10.1, 2.9, 4.6],
  },
  {
    id: 'trophy-shelf',
    roomId: 'arcade',
    title: 'HACKATHON TROPHY SHELF',
    prompt: 'HackSphere 3.0, TinkerHub, NASA & FOSS bots',
    kind: 'hackathons',
    x: 6.0,
    z: 7.6,
    radius: 2.1,
    markerPos: [6.0, 2.7, 9.1],
  },
  {
    id: 'sundial',
    roomId: 'patio',
    title: 'GARDEN SUNDIAL',
    prompt: 'Toggle Day / Sunset / Night & Retro Pixel Scale',
    kind: 'environment_panel',
    x: -4.5,
    z: 14.3,
    radius: 2.4,
    markerPos: [-4.5, 2.4, 13.0],
  },
  {
    id: 'mailbox',
    roomId: 'patio',
    title: 'GITHUB & HOUSE-PRICE SIGN',
    prompt: 'Switch GitHub user or inspect House-Price ML',
    kind: 'github_connect',
    x: 4.2,
    z: 14.6,
    radius: 2.2,
    markerPos: [4.2, 2.3, 13.5],
  },
  // Repo-Themed World Landmarks
  {
    id: 'agrivision-farm',
    roomId: 'city-park',
    title: 'AGRIVISION AI FARM LAB',
    prompt: 'Crop Damage Intelligence & Eco Web Projects',
    kind: 'agri_eco',
    x: -34.0,
    z: -6.2,
    radius: 2.8,
    markerPos: [-34.0, 2.8, -8.5],
  },
  {
    id: 'munnar-overlook',
    roomId: 'meadow',
    title: 'MUNNAR TEA HILLS GAZEBO',
    prompt: 'Explore Munnar Tourism, Earth Bloom & Pookalam',
    kind: 'agri_eco',
    x: 0.0,
    z: -24.2,
    radius: 2.8,
    markerPos: [0.0, 3.2, -28.0],
  },
  {
    id: 'cafe-counter',
    roomId: 'byte-cafe',
    title: 'HOSHIKO & BYTE CAFÉ',
    prompt: 'Hoshiko, Food-Order, EmojiStories & House-Price ML',
    kind: 'cafe_food',
    x: 31.0,
    z: 12.2,
    radius: 2.8,
    markerPos: [31.0, 3.2, 10.6],
  },
  {
    id: 'rover-arena',
    roomId: 'byte-cafe',
    title: 'RESCUE ROVER TEST ARENA',
    prompt: 'Inspect RescueRoverMain, CrackWise AI & UAV Tech',
    kind: 'drone_lab',
    x: 45.5,
    z: 9.0,
    radius: 2.8,
    markerPos: [49.0, 2.8, 9.0],
  },
  {
    id: 'city-fountain',
    roomId: 'city-plaza',
    title: 'CITY PLAZA & VISIONSAFE AVE',
    prompt: 'Inspect VisionSafe AI Road Safety & Stack Metrics',
    kind: 'space_vision',
    x: 0.0,
    z: 35.6,
    radius: 2.8,
    markerPos: [0.0, 3.8, 40.0],
  },
  {
    id: 'nasa-observatory',
    roomId: 'downtown-skyline',
    title: 'NASA SPACE OBSERVATORY',
    prompt: 'LoopTroop NASA Space Apps 2025 & Vision AI',
    kind: 'space_vision',
    x: -32.0,
    z: 37.5,
    radius: 3.0,
    markerPos: [-32.0, 3.8, 39.0],
  },
  {
    id: 'innovation-tower',
    roomId: 'downtown-skyline',
    title: 'GITHUB INNOVATION TOWER',
    prompt: 'Open Full 49-Repo Explorer & Portfolio Source',
    kind: 'github_repos',
    x: 32.0,
    z: 37.5,
    radius: 3.0,
    markerPos: [32.0, 3.8, 39.0],
  },
];

export function detectRoomAt(x, z) {
  for (const room of ROOMS) {
    const b = room.bounds;
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
      return room;
    }
  }
  return ROOMS[0];
}
