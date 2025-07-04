import fs from "fs";
import path from "path";
import { TileConfig, TileDefinition, TileGroup } from "../src/config";

const TILE_WIDTH = 16;
const TILE_HEIGHT = 16;
const TILE_SPACING = 0;
const TILES_PER_ROW = 12;
const IMAGE_PATH = "assets/kenney_tiny-town/Tilemap/tilemap_packed.png";
const TILESHEET_PATH = "example/public/assets/kenney_tiny-town/Tilesheet.txt";
const OUTPUT_PATH = "example/src/tileset-town.json";

const getZIndex = (name: string): number => {
  if (
    name.startsWith("grass") ||
    name.startsWith("dirt") ||
    name.startsWith("cobblestone")
  ) {
    return 0;
  }
  if (
    name.startsWith("wall_") ||
    name.startsWith("fence_") ||
    name.startsWith("parapet_") ||
    name.startsWith("roof_")
  ) {
    return 2;
  }
  if (
    name.startsWith("tree_") ||
    name.startsWith("vines") ||
    name.startsWith("mushrooms") ||
    name.startsWith("well_")
  ) {
    return 1;
  }
  if (
    name.startsWith("door_") ||
    name.startsWith("window_") ||
    name.startsWith("porticulis_")
  ) {
    return 3;
  }
  if (
    name.startsWith("coin") ||
    name.startsWith("bomb") ||
    name.startsWith("log") ||
    name.startsWith("jar") ||
    name.startsWith("key") ||
    name.startsWith("arrow") ||
    name.startsWith("bow") ||
    name.startsWith("pickaxe") ||
    name.startsWith("pitchfork") ||
    name.startsWith("axe") ||
    name.startsWith("shovel") ||
    name.startsWith("scythe") ||
    name.startsWith("water_jug") ||
    name.startsWith("wheelbarrow") ||
    name.startsWith("beehive") ||
    name.startsWith("archery_target") ||
    name.startsWith("sign")
  ) {
    return 4;
  }

  // default z-index
  return 1;
};

const getGroupKey = (name: string): string => {
  const groupNameMatch = name.match(/^([a-zA-Z_]+?)_/);
  let groupKey = (groupNameMatch ? groupNameMatch[1] : "other").toLowerCase();

  const groupMappings: { [key: string]: string } = {
    dirt: "terrain",
    grass: "terrain",
    cobblestone: "terrain",
    castle: "castles",
    parapet: "castles",
    arch: "castles",
    porticulis: "castles",
    wall: "homes",
    roof: "homes",
    door: "homes",
    window: "homes",
    water: "other",
    well: "other",
    archery: "other",
  };

  return groupMappings[groupKey] || groupKey;
};

const inputFile = "example/public/assets/kenney_tiny-town/tiles.txt";
const outputFile = "example/src/tileset-town.json";

// Load existing config if it exists, otherwise create a new one
let tileConfig: TileConfig;
if (fs.existsSync(outputFile)) {
  const fileContent = fs.readFileSync(outputFile, "utf-8");
  tileConfig = JSON.parse(fileContent);
} else {
  tileConfig = {
    mapSize: "infinite",
    tiles: {},
    groups: {},
    defaultZoom: 1,
    gridSize: 16,
  };
}

// Clear existing tiles and groups to prevent duplicates on re-run
tileConfig.tiles = {};
tileConfig.groups = {};

const txtData = fs.readFileSync(inputFile, "utf-8");
const lines = txtData.split("\n").filter((line) => line.trim() !== "");

for (const line of lines) {
  const match = line.match(/^(\d+)\s+(.+)$/);
  if (!match) {
    console.warn(`Skipping invalid line: ${line}`);
    continue;
  }

  const [, idStr, name] = match;
  const id = parseInt(idStr, 10);

  const tileX = id % TILES_PER_ROW;
  const tileY = Math.floor(id / TILES_PER_ROW);

  const x = tileX * (TILE_WIDTH + TILE_SPACING);
  const y = tileY * (TILE_HEIGHT + TILE_SPACING);

  const tileDefinition: TileDefinition = {
    displayName: name,
    src: IMAGE_PATH,
    zIndex: getZIndex(name),
    type: "tile",
    spritesheet: {
      x,
      y,
      width: TILE_WIDTH,
      height: TILE_HEIGHT,
    },
  };

  tileConfig.tiles[name] = tileDefinition;

  const groupKey = getGroupKey(name);

  if (!tileConfig.groups[groupKey]) {
    tileConfig.groups[groupKey] = {
      displayName: groupKey.replace(/_/g, " "),
      tileIds: [],
    };
  }
  tileConfig.groups[groupKey].tileIds.push(name);
}

// Sort groups
const sortedGroups = Object.keys(tileConfig.groups).sort();
const newGroups: { [key: string]: TileGroup } = {};
for (const groupName of sortedGroups) {
  newGroups[groupName] = tileConfig.groups[groupName];
  // sort tiles within group
  newGroups[groupName].tileIds.sort();
}
tileConfig.groups = newGroups;

fs.writeFileSync(outputFile, JSON.stringify(tileConfig, null, 2));

console.log(`Successfully created ${outputFile} from ${inputFile}`);
