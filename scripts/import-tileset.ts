import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import path from "path";
import { TileConfig, TileDefinition, TileGroup } from "../src/config";

const getZIndex = (name: string): number => {
  // Background terrain and liquids
  if (
    name.startsWith("terrain_") ||
    name.startsWith("water") ||
    name.startsWith("lava") ||
    name === "grass" ||
    name === "snow"
  ) {
    return 0;
  }
  // Scenery and large static objects
  if (
    name.startsWith("bush") ||
    name.startsWith("cactus") ||
    name.startsWith("fence") ||
    name.startsWith("hill") ||
    name.startsWith("mushroom") ||
    name.startsWith("rock")
  ) {
    return 1;
  }
  // Platforms, blocks, and other solid, interactive structures
  if (
    name.startsWith("block_") ||
    name.startsWith("brick") ||
    name.startsWith("bridge") ||
    name.startsWith("ladder") ||
    name.startsWith("ramp")
  ) {
    return 2;
  }
  // Small items, collectibles, and interactables that sit on top of other things
  if (
    name.startsWith("coin_") ||
    name.startsWith("door_") ||
    name.startsWith("gem_") ||
    name.startsWith("heart") ||
    name.startsWith("key_") ||
    name.startsWith("lever") ||
    name.startsWith("lock_") ||
    name.startsWith("sign") ||
    name.startsWith("spikes") ||
    name.startsWith("spring") ||
    name.startsWith("star") ||
    name.startsWith("switch") ||
    name.startsWith("torch")
  ) {
    return 3;
  }
  if (name.startsWith("character") || name.startsWith("enemy")) {
    return 4;
  }
  return 5; // Default for HUD or other foreground elements
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
    src: path.join(path.dirname(inputFile), imagePath).replace("example/", ""),
    zIndex: getZIndex(name),
    spritesheet: {
      x: parseInt(subTexture.x, 10),
      y: parseInt(subTexture.y, 10),
      width: parseInt(subTexture.width, 10),
      height: parseInt(subTexture.height, 10),
    },
    scale: 0.5,
  };
}

tileConfig.groups[groupName] = newGroup;

fs.writeFileSync(outputFile, JSON.stringify(tileConfig, null, 2));

console.log(`Successfully merged ${inputFile} into ${outputFile}`);
