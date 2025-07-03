import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import path from "path";
import { TileConfig, TileDefinition } from "../src/config";

const getZIndexFromFilename = (filename: string): number => {
  const lowercased = filename.toLowerCase();
  if (lowercased.includes("background")) {
    return 0;
  }
  if (lowercased.includes("tiles")) {
    return 1;
  }
  if (lowercased.includes("enemies")) {
    return 2;
  }
  if (lowercased.includes("characters")) {
    return 3;
  }
  return 4; // Default for HUD or other foreground elements
};

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error(
    "Usage: ts-node scripts/import-tileset.ts <input.xml> <output.json>"
  );
  process.exit(1);
}

const baseZIndex = getZIndexFromFilename(path.basename(inputFile));
const xmlData = fs.readFileSync(inputFile, "utf-8");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});
const result = parser.parse(xmlData);

const textureAtlas = result.TextureAtlas;
const imagePath = textureAtlas.imagePath;
const tiles: Record<string, TileDefinition> = {};

for (const subTexture of textureAtlas.SubTexture) {
  const name = subTexture.name.replace(".png", "");

  tiles[name] = {
    displayName: name,
    src: path.join(path.dirname(inputFile), imagePath),
    zIndex: baseZIndex,
    spritesheet: {
      x: parseInt(subTexture.x, 10),
      y: parseInt(subTexture.y, 10),
      width: parseInt(subTexture.width, 10),
      height: parseInt(subTexture.height, 10),
    },
    scale: 0.5,
  };
}

const tileConfig: TileConfig = {
  mapSize: "infinite",
  tiles,
};

fs.writeFileSync(outputFile, JSON.stringify(tileConfig, null, 2));

console.log(`Successfully converted ${inputFile} to ${outputFile}`);
