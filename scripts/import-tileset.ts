import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import path from "path";
import { TileConfig, TileDefinition, TileGroup } from "../src/config";

const getZIndex = (name: string): number => {
  // Layer 0: Background terrain and liquids
  if (
    name.startsWith("background") ||
    name.startsWith("terrain_") ||
    name.startsWith("water") ||
    name.startsWith("lava") ||
    name.startsWith("grass") ||
    name.startsWith("snow")
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
    name.startsWith("window")
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
    name.startsWith("rop")
  ) {
    return 2;
  }
  // Layer 3: Small items, collectibles, and interactables
  if (
    name.startsWith("bomb") ||
    name.startsWith("coin_") ||
    name.startsWith("door_") ||
    name.startsWith("fireball") ||
    name.startsWith("flag") ||
    name.startsWith("gem_") ||
    name.startsWith("heart") ||
    name.startsWith("key_") ||
    name.startsWith("lever") ||
    name.startsWith("lock_") ||
    name.startsWith("saw") ||
    name.startsWith("sign") ||
    name.startsWith("spikes") ||
    name.startsWith("spring") ||
    name.startsWith("star") ||
    name.startsWith("switch") ||
    name.startsWith("torch") ||
    name.startsWith("weight")
  ) {
    return 3;
  }
  // Layer 4: Enemies
  if (
    name.startsWith("barnacle") ||
    name.startsWith("bee") ||
    name.startsWith("block") ||
    name.startsWith("enemy") ||
    name.startsWith("fish") ||
    name.startsWith("fly") ||
    name.startsWith("frog") ||
    name.startsWith("ladybug") ||
    name.startsWith("mouse") ||
    name.startsWith("saw") ||
    name.startsWith("slime") ||
    name.startsWith("snail") ||
    name.startsWith("worm")
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

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error(
    "Usage: ts-node scripts/import-tileset.ts <input.xml> <output.json>"
  );
  process.exit(1);
}

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
    defaultZoom: 0.5,
  };
}

const xmlData = fs.readFileSync(inputFile, "utf-8");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});
const result = parser.parse(xmlData);

const textureAtlas = result.TextureAtlas;
const imagePath = textureAtlas.imagePath;
const groupName = path
  .basename(inputFile)
  .replace("spritesheet-", "")
  .replace("-default.xml", "")
  .replace(".xml", "");

const newGroup: TileGroup = {
  displayName: groupName,
  tileIds: [],
};

for (const subTexture of textureAtlas.SubTexture) {
  const name = subTexture.name.replace(".png", "");
  newGroup.tileIds.push(name);

  tileConfig.tiles[name] = {
    displayName: name,
    src: path
      .join(path.dirname(inputFile), imagePath)
      .replace("example/public/", ""),
    zIndex: getZIndex(name),
    type: groupName === "backgrounds" ? "background" : "tile",
    spritesheet: {
      x: parseInt(subTexture.x, 10),
      y: parseInt(subTexture.y, 10),
      width: parseInt(subTexture.width, 10),
      height: parseInt(subTexture.height, 10),
    },
  };
}

tileConfig.groups[groupName] = newGroup;

fs.writeFileSync(outputFile, JSON.stringify(tileConfig, null, 2));

console.log(`Successfully merged ${inputFile} into ${outputFile}`);
