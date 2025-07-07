import { PlacedTile, PlacedTiles } from "./state";

// The key is a string in the format "x-y-zIndex".
// The value is either a tileId string or null to remove a tile.
export type TilemapDelta = {
  [key: string]: string | null;
};

export const createDelta = (
  before: PlacedTiles,
  after: PlacedTiles
): TilemapDelta => {
  const delta: TilemapDelta = {};
  const afterKeys = new Set<string>();

  // Find added or changed tiles
  for (const [key, afterCell] of after.entries()) {
    afterKeys.add(key);
    const beforeCell = before.get(key);
    const [x, y] = key.split("-").map(Number);

    for (const [zIndex, afterTile] of afterCell.entries()) {
      const beforeTile = beforeCell?.get(zIndex);
      const deltaKey = `${x}-${y}-${zIndex}`;

      if (!beforeTile && afterTile) {
        // added
        delta[deltaKey] = afterTile.tileId;
      } else if (
        beforeTile &&
        afterTile &&
        beforeTile.tileId !== afterTile.tileId
      ) {
        // changed
        delta[deltaKey] = afterTile.tileId;
      } else if (beforeTile && !afterTile) {
        // removed
        delta[deltaKey] = null;
      }
    }

    if (beforeCell) {
      for (const [zIndex, beforeTile] of beforeCell.entries()) {
        if (beforeTile && !afterCell.has(zIndex)) {
          const [x, y] = key.split("-").map(Number);
          const deltaKey = `${x}-${y}-${zIndex}`;
          // removed
          delta[deltaKey] = null;
        }
      }
    }
  }

  // Find removed cells
  for (const [key, beforeCell] of before.entries()) {
    if (!afterKeys.has(key)) {
      const [x, y] = key.split("-").map(Number);
      for (const [zIndex] of beforeCell.entries()) {
        const deltaKey = `${x}-${y}-${zIndex}`;
        delta[deltaKey] = null;
      }
    }
  }

  return delta;
};

export const applyDelta = (
  tiles: PlacedTiles,
  delta: TilemapDelta,
  source: "local" | "remote" | "initial" = "remote"
): PlacedTiles => {
  const newTiles = new Map(
    [...tiles].map(([key, value]) => [key, new Map(value)])
  );

  for (const key in delta) {
    const tileId = delta[key];
    const [x, y, zIndex] = key.split("-").map(Number);
    const cellKey = `${x}-${y}`;

    if (!newTiles.has(cellKey)) {
      newTiles.set(cellKey, new Map());
    }
    const cell = newTiles.get(cellKey)!;

    if (tileId === null) {
      cell.delete(zIndex);
    } else {
      cell.set(zIndex, { x, y, tileId, source });
    }
  }
  // Clean up empty cells
  for (const [key, cell] of newTiles.entries()) {
    if (cell.size === 0) {
      newTiles.delete(key);
    }
  }

  return newTiles;
};
