import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import path from "path";
import { glob } from "glob";
import { TileConfig, TileDefinition, TileTabGroup } from "../src/config";

const getZIndex = (name: string): number => {
  // Layer 0: Background terrain and liquids
  if (
    name.startsWith("background") ||
    name.startsWith("terrain_") ||
    name.startsWith("water") ||
    name.startsWith("lava")
  ) {
    return 0;
  }
  // Layer 1: Scenery and large static objects
  if (
    name.startsWith("bush") ||
    name.startsWith("cactus") ||
    name.startsWith("fence") ||
    name.startsWith("hill") ||
    name.startsWith("mushroom") ||
    name.startsWith("rock") ||
    name.startsWith("window") ||
    name.startsWith("grass") ||
    name.startsWith("snow") ||
    name.startsWith("sign")
  ) {
    return 1;
  }
  // Layer 2: Platforms, blocks, and other solid, interactive structures
  if (
    name.startsWith("block_") ||
    name.startsWith("brick") ||
    name.startsWith("bridge") ||
    name.startsWith("chain") ||
    name.startsWith("conveyor") ||
    name.startsWith("ladder") ||
    name.startsWith("ramp") ||
    name.startsWith("rop") ||
    name.startsWith("door_")
  ) {
    return 2;
  }
  // Layer 3: Small items, collectibles, and interactables
  if (
    name.startsWith("bomb") ||
    name.startsWith("coin_") ||
    name.startsWith("fireball") ||
    name.startsWith("flag") ||
    name.startsWith("gem_") ||
    name.startsWith("heart") ||
    name.startsWith("key_") ||
    name.startsWith("lever") ||
    name.startsWith("lock_") ||
    name.startsWith("star") ||
    name.startsWith("switch") ||
    name.startsWith("torch") ||
    name.startsWith("weight") ||
    name.startsWith("spring")
  ) {
    return 3;
  }
  // Layer 4: Hazards
  if (
    name.startsWith("saw") ||
    name.startsWith("spikes") ||
    name.startsWith("enemy") ||
    name.startsWith("fish") ||
    name.startsWith("fly") ||
    name.startsWith("frog") ||
    name.startsWith("ladybug") ||
    name.startsWith("mouse") ||
    name.startsWith("slime") ||
    name.startsWith("snail") ||
    name.startsWith("worm") ||
    name.startsWith("barnacle") ||
    name.startsWith("bee")
  ) {
    return 4;
  }
  // Layer 5: Player characters
  if (name.startsWith("character")) {
    return 5;
  }
  // Layer 6: HUD and other foreground elements
  if (name.startsWith("hud_")) {
    return 6;
  }

  throw new Error(`No z-index defined for tile: ${name}`);
};

const getGroupKey = (name: string): string => {
  if (name.startsWith("terrain_")) return "Terrain";
  if (name.startsWith("block_") || name.startsWith("brick")) return "Blocks";
  if (
    name.startsWith("coin_") ||
    name.startsWith("gem_") ||
    name.startsWith("star") ||
    name.startsWith("heart") ||
    name.startsWith("key_")
  )
    return "Collectibles";
  if (
    name.startsWith("door_") ||
    name.startsWith("ladder") ||
    name.startsWith("switch") ||
    name.startsWith("lever") ||
    name.startsWith("lock_") ||
    name.startsWith("spring")
  )
    return "Mechanisms";
  if (
    name.startsWith("bomb") ||
    name.startsWith("spikes") ||
    name.startsWith("saw") ||
    name.startsWith("fireball") ||
    name.startsWith("lava")
  )
    return "Hazards";
  if (
    name.startsWith("bush") ||
    name.startsWith("cactus") ||
    name.startsWith("fence") ||
    name.startsWith("hill") ||
    name.startsWith("mushroom") ||
    name.startsWith("rock") ||
    name.startsWith("window") ||
    name.startsWith("grass") ||
    name.startsWith("bridge") ||
    name.startsWith("torch") ||
    name.startsWith("sign")
  )
    return "Scenery";
  if (name.startsWith("character")) return "Characters";
  if (name.startsWith("enemy") || name.startsWith("slime")) return "Enemies";
  if (name.startsWith("hud_")) return "HUD";
  if (name.startsWith("background")) {
    console.log(`[getGroupKey] Assigning "backgrounds" to ${name}`);
    return "backgrounds";
  }

  console.log(`[getGroupKey] Assigning "Misc" to ${name}`);
  return "Misc";
};

const outputFile = process.argv[2];
const inputPatterns = process.argv.slice(3);

if (!outputFile || inputPatterns.length === 0) {
  console.error(
    "Usage: ts-node scripts/import-tileset.ts <output.json> <input1.xml> [input2.xml]..."
  );
  process.exit(1);
}

const tileConfig: TileConfig = {
  gridSize: 32,
  mapSize: { width: 32, height: 32 },
  tiles: {},
  groups: {},
  defaultZoom: 0.5,
};

const nameSuffixToNeighbors: Record<string, string> = {
  block_top_left: "SE",
  block_top: "SWE",
  block_top_right: "SW",
  block_left: "NSE",
  block_center: "NSWE",
  block_right: "NSW",
  block_bottom_left: "NE",
  block_bottom: "NWE",
  block_bottom_right: "NW",
  horizontal_left: "E",
  horizontal_middle: "WE",
  horizontal_right: "W",
  vertical_top: "S",
  vertical_middle: "NS",
  vertical_bottom: "N",
  cloud_left: "E",
  cloud_middle: "WE",
  cloud_right: "W",
};

const inputFiles = inputPatterns.flatMap((pattern) => glob.sync(pattern));

for (const inputFile of inputFiles) {
  const xmlData = fs.readFileSync(inputFile, "utf-8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const result = parser.parse(xmlData);
  const textureAtlas = result.TextureAtlas;
  const imagePath = textureAtlas.imagePath;

  for (const subTexture of textureAtlas.SubTexture) {
    const name = subTexture.name.replace(".png", "");
    const groupKey = getGroupKey(name);

    if (!tileConfig.groups[groupKey]) {
      console.log(`[Main Loop] Creating new group: ${groupKey}`);
      tileConfig.groups[groupKey] = {
        displayName: groupKey,
        tileIds: [],
        autotileGroups: [],
      };
    }

    if (!tileConfig.tiles[name]) {
      tileConfig.groups[groupKey].tileIds.push(name);

      const tileDefinition: TileDefinition = {
        displayName: name,
        src: path
          .join(path.dirname(inputFile), imagePath)
          .replace("example/public/", ""),
        zIndex: getZIndex(name),
        type:
          getGroupKey(name).toLowerCase() === "backgrounds"
            ? "background"
            : "tile",
        spritesheet: {
          x: parseInt(subTexture.x, 10),
          y: parseInt(subTexture.y, 10),
          width: parseInt(subTexture.width, 10),
          height: parseInt(subTexture.height, 10),
        },
      };

      const terrainMatch = name.match(/terrain_(?<group>[^_]+)_(?<variant>.+)/);
      if (terrainMatch?.groups) {
        console.log(`[Main Loop] Found terrain tile: ${name}`);
        const { group, variant } = terrainMatch.groups;
        const neighbors = nameSuffixToNeighbors[variant];
        if (neighbors) {
          console.log(
            `[Main Loop] Assigning autotile property to ${name} with group ${group}`
          );
          (tileDefinition as any).autotile = {
            group,
            neighbors,
          };
          if (!tileConfig.groups["Terrain"]) {
            console.error(
              "[Main Loop] CRITICAL: 'Terrain' group does not exist when trying to add autotile group."
            );
          } else {
            if (!tileConfig.groups["Terrain"].autotileGroups.includes(group)) {
              console.log(
                `[Main Loop] Adding autotile group '${group}' to Terrain tab.`
              );
              tileConfig.groups["Terrain"].autotileGroups.push(group);
            } else {
              console.log(
                `[Main Loop] Autotile group '${group}' already exists in Terrain tab.`
              );
            }
          }
        }
      }

      tileConfig.tiles[name] = tileDefinition;
    }
  }
}

fs.writeFileSync(outputFile, JSON.stringify(tileConfig, null, 2));

console.log(
  `Successfully processed ${inputFiles.length} files into ${outputFile}`
);
