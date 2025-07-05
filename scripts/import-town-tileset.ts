import fs from "fs";
import path from "path";
import { TileConfig, TileDefinition, TileTabGroup } from "../src/config";

const TILE_WIDTH = 16;
const TILE_HEIGHT = 16;
const TILE_SPACING = 0;
const TILES_PER_ROW = 12;
const IMAGE_PATH = "assets/kenney_tiny-town/Tilemap/tilemap_packed.png";
const TILESHEET_PATH = "example/public/assets/kenney_tiny-town/Tilesheet.txt";

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
  if (name.startsWith("forest")) {
    return 1;
  }

  // default z-index
  return 1;
};

const getGroupKey = (name: string): string => {
  const groupNameMatch = name.match(/^([a-zA-Z_]+?)(?::|-|$)/);
  let groupKey = (groupNameMatch ? groupNameMatch[1] : "other").toLowerCase();

  const groupMappings: { [key: string]: string } = {
    // Terrain
    grass: "Terrain",
    dirt: "Terrain",
    forest_green: "Terrain",
    forest_fall: "Terrain",
    tree_fall: "Terrain",
    tree_green: "Terrain",
    vines: "Terrain",
    mushrooms: "Terrain",

    // Structures
    roof_slate: "Structures",
    roof_tile: "Structures",
    wall_wood: "Structures",
    wall_stone: "Structures",
    parapet: "Structures",
    arch: "Structures",
    well: "Structures",
    castle_wall: "Structures",
    castle_window: "Structures",

    // Fences & Walls
    fence: "Fences & Walls",

    // Decorations
    sign: "Decorations",
    beehive: "Decorations",
    wheelbarrow: "Decorations",
    archery_target: "Decorations",
    log: "Decorations",

    // Items
    coin: "Items",
    bomb: "Items",
    jar: "Items",
    key: "Items",
    bow: "Items",
    arrow: "Items",
    pickaxe: "Items",
    pitchfork: "Items",
    axe: "Items",
    shovel: "Items",
    scythe: "Items",
    water_jug_empty: "Items",
    water_jug_full: "Items",
  };

  const aGroupKey = Object.keys(groupMappings).find(
    (k) => groupKey === k || groupKey.startsWith(k)
  );
  if (aGroupKey) {
    return groupMappings[aGroupKey];
  }

  throw new Error(
    `No group found for tile: ${name} (parsed group key: ${groupKey})`
  );
};

const scriptDir = path.dirname(__filename);
const tilariumRoot = path.resolve(scriptDir, "..");

const inputFile = path.join(
  tilariumRoot,
  "example/public/assets/kenney_tiny-town/tiles.txt"
);
const outputFile = path.join(tilariumRoot, "example/src/tileset-town.json");

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

  const autotileMatch = name.match(
    /^(?<group>[a-zA-Z_]+?)(?::(?<variant>[a-zA-Z_]+))?(?:-(?<neighbors>[NESW]+))?$/
  );

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

  if (autotileMatch && autotileMatch.groups) {
    const { group, neighbors } = autotileMatch.groups;
    if (group && neighbors) {
      tileDefinition.autotile = {
        group: group,
        neighbors: neighbors as any,
      };
    }
  }

  const tileId = name;
  tileConfig.tiles[tileId] = tileDefinition;

  const groupKey = getGroupKey(name);

  if (!tileConfig.groups[groupKey]) {
    tileConfig.groups[groupKey] = {
      displayName: groupKey.replace(/_/g, " "),
      tileIds: [],
      autotileGroups: [],
    };
  }
  if (tileDefinition.autotile) {
    if (
      !tileConfig.groups[groupKey].autotileGroups.includes(
        tileDefinition.autotile.group
      )
    ) {
      tileConfig.groups[groupKey].autotileGroups.push(
        tileDefinition.autotile.group
      );
    }
  } else {
    tileConfig.groups[groupKey].tileIds.push(tileId);
  }
}

// Sort groups
const sortedGroups = Object.keys(tileConfig.groups).sort();
const newGroups: { [key: string]: TileTabGroup } = {};
for (const groupName of sortedGroups) {
  newGroups[groupName] = tileConfig.groups[groupName];
  // sort tiles within group
  newGroups[groupName].tileIds.sort();
}
tileConfig.groups = newGroups;

fs.writeFileSync(outputFile, JSON.stringify(tileConfig, null, 2));

console.log(`Successfully created ${outputFile} from ${inputFile}`);
