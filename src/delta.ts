import { PlacedTile, PlacedTiles } from "./state";

export type PlacedTilesDelta = {
  added: PlacedTile[];
  removed: { x: number; y: number; tileId: string }[];
};

export const diffPlacedTiles = (
  before: PlacedTiles,
  after: PlacedTiles
): PlacedTilesDelta => {
  const added: PlacedTile[] = [];
  const removed: { x: number; y: number; tileId: string }[] = [];
  const afterKeys = new Set<string>();

  // Find added or changed tiles
  for (const [key, afterCell] of after.entries()) {
    afterKeys.add(key);
    const beforeCell = before.get(key);

    for (const [zIndex, afterTile] of afterCell.entries()) {
      const beforeTile = beforeCell?.get(zIndex);

      if (!beforeTile && afterTile) {
        added.push(afterTile);
      } else if (
        beforeTile &&
        afterTile &&
        beforeTile.tileId !== afterTile.tileId
      ) {
        removed.push({
          x: beforeTile.x,
          y: beforeTile.y,
          tileId: beforeTile.tileId,
        });
        added.push(afterTile);
      } else if (beforeTile && !afterTile) {
        removed.push({
          x: beforeTile.x,
          y: beforeTile.y,
          tileId: beforeTile.tileId,
        });
      }
    }

    if (beforeCell) {
      for (const [zIndex, beforeTile] of beforeCell.entries()) {
        if (beforeTile && !afterCell.has(zIndex)) {
          removed.push({
            x: beforeTile.x,
            y: beforeTile.y,
            tileId: beforeTile.tileId,
          });
        }
      }
    }
  }

  // Find removed cells
  for (const [key, beforeCell] of before.entries()) {
    if (!afterKeys.has(key)) {
      for (const beforeTile of beforeCell.values()) {
        if (beforeTile) {
          removed.push({
            x: beforeTile.x,
            y: beforeTile.y,
            tileId: beforeTile.tileId,
          });
        }
      }
    }
  }

  return { added, removed };
};
