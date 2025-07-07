import { TileConfig } from "./config";
import { PlacedTile, PlacedTiles } from "./state";

export type AutotileLookup = Map<string, Map<number, string[]>>;

const directionToBitmask: Record<string, number> = {
  N: 1,
  E: 2,
  S: 4,
  W: 8,
};

export const bitmaskToNeighbors: [number, number, number][] = [
  [0, -1, 1], // N
  [1, 0, 2], // E
  [0, 1, 4], // S
  [-1, 0, 8], // W
];

export const createAutotileLookup = (config: TileConfig): AutotileLookup => {
  const lookup: AutotileLookup = new Map();

  for (const tileId in config.tiles) {
    const tile = config.tiles[tileId];
    if (tile.autotile) {
      const { group, neighbors } = tile.autotile;

      if (!lookup.has(group)) {
        lookup.set(group, new Map());
      }

      let bitmask = 0;
      for (const char of neighbors) {
        if (directionToBitmask[char]) {
          bitmask |= directionToBitmask[char];
        }
      }

      const groupMap = lookup.get(group)!;
      if (!groupMap.has(bitmask)) {
        groupMap.set(bitmask, []);
      }
      groupMap.get(bitmask)!.push(tileId);
    }
  }

  return lookup;
};

export const chooseTileVariant = (validTileIds: string[]): string => {
  if (validTileIds.length <= 1) {
    return validTileIds[0];
  }

  const chance = Math.random();
  if (chance < 0.8) {
    // 80% chance to return the default tile
    return validTileIds[0];
  } else {
    // 20% chance to return a random variant from the rest of the tiles
    const variants = validTileIds.slice(1);
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  }
};

const countSetBits = (n: number): number => {
  let count = 0;
  while (n > 0) {
    n &= n - 1;
    count++;
  }
  return count;
};

const getRulePriority = (bitmask: number): number => {
  const bitCount = countSetBits(bitmask);

  if (bitCount === 4) return 4; // Fill (SWEN)
  if (bitCount === 3) return 3; // T-Junctions
  if (bitCount === 2) {
    if (bitmask === 5 || bitmask === 10) return 2; // Straight Lines (NS or EW)
    return 1; // Corners
  }
  if (bitCount === 1) return 0; // End Caps
  return -1;
};

export const getStrictlyValidTileIds = (
  groupLookup: Map<number, string[]>,
  bitmask: number
): string[] | undefined => {
  // 1. Exact match
  const primaryIds = groupLookup.get(bitmask);
  if (primaryIds && primaryIds.length > 0) {
    return primaryIds;
  }

  // 2. Best partial match
  let bestMatchMask = -1;
  let bestMatchIds: string[] | undefined;
  let bestMatchPriority = -1;

  for (const [ruleBitmask, tileIds] of groupLookup.entries()) {
    if ((bitmask & ruleBitmask) === ruleBitmask) {
      const currentBitCount = countSetBits(ruleBitmask);
      const bestBitCount = countSetBits(bestMatchMask);

      if (currentBitCount > bestBitCount) {
        bestMatchMask = ruleBitmask;
        bestMatchIds = tileIds;
        bestMatchPriority = getRulePriority(ruleBitmask);
      } else if (currentBitCount === bestBitCount) {
        const currentPriority = getRulePriority(ruleBitmask);
        if (currentPriority > bestMatchPriority) {
          bestMatchMask = ruleBitmask;
          bestMatchIds = tileIds;
          bestMatchPriority = currentPriority;
        }
      }
    }
  }

  if (bestMatchIds) {
    return bestMatchIds;
  }

  // 3. Fallback to the rule that requires the fewest neighbors that are not present.
  let bestFallbackMask = -1;
  let minMissingNeighbors = Infinity;
  let fallbackIds: string[] | undefined;
  let bestFallbackPriority = -1;

  for (const [ruleBitmask, tileIds] of groupLookup.entries()) {
    const missingNeighbors = countSetBits(ruleBitmask & ~bitmask);
    const currentBitCount = countSetBits(ruleBitmask);
    const bestBitCount = countSetBits(bestFallbackMask);

    if (missingNeighbors < minMissingNeighbors) {
      minMissingNeighbors = missingNeighbors;
      bestFallbackMask = ruleBitmask;
      fallbackIds = tileIds;
      bestFallbackPriority = getRulePriority(ruleBitmask);
    } else if (missingNeighbors === minMissingNeighbors) {
      if (currentBitCount > bestBitCount) {
        bestFallbackMask = ruleBitmask;
        fallbackIds = tileIds;
        bestFallbackPriority = getRulePriority(ruleBitmask);
      } else if (currentBitCount === bestBitCount) {
        const currentPriority = getRulePriority(ruleBitmask);
        if (currentPriority > bestFallbackPriority) {
          bestFallbackMask = ruleBitmask;
          fallbackIds = tileIds;
          bestFallbackPriority = currentPriority;
        }
      }
    }
  }

  return fallbackIds;
};

export const getBestFitTileIds = (
  groupLookup: Map<number, string[]>,
  bitmask: number
): string[] | undefined => {
  // 1. Exact match
  const primaryIds = groupLookup.get(bitmask);
  if (primaryIds && primaryIds.length > 0) {
    return primaryIds;
  }

  // 2. Best partial match
  let bestMatchMask = -1;
  let bestMatchIds: string[] | undefined;
  let bestMatchPriority = -1;

  for (const [ruleBitmask, tileIds] of groupLookup.entries()) {
    if ((bitmask & ruleBitmask) === ruleBitmask) {
      const currentBitCount = countSetBits(ruleBitmask);
      const bestBitCount = countSetBits(bestMatchMask);

      if (currentBitCount > bestBitCount) {
        bestMatchMask = ruleBitmask;
        bestMatchIds = tileIds;
        bestMatchPriority = getRulePriority(ruleBitmask);
      } else if (currentBitCount === bestBitCount) {
        const currentPriority = getRulePriority(ruleBitmask);
        if (currentPriority > bestMatchPriority) {
          bestMatchMask = ruleBitmask;
          bestMatchIds = tileIds;
          bestMatchPriority = currentPriority;
        }
      }
    }
  }

  if (bestMatchIds) {
    return bestMatchIds;
  }

  // 3. Fallback to the rule that requires the fewest neighbors that are not present.
  let bestFallbackMask = -1;
  let minMissingNeighbors = Infinity;
  let fallbackIds: string[] | undefined;
  let bestFallbackPriority = -1;

  for (const [ruleBitmask, tileIds] of groupLookup.entries()) {
    const missingNeighbors = countSetBits(ruleBitmask & ~bitmask);
    const currentBitCount = countSetBits(ruleBitmask);
    const bestBitCount = countSetBits(bestFallbackMask);

    if (missingNeighbors < minMissingNeighbors) {
      minMissingNeighbors = missingNeighbors;
      bestFallbackMask = ruleBitmask;
      fallbackIds = tileIds;
      bestFallbackPriority = getRulePriority(ruleBitmask);
    } else if (missingNeighbors === minMissingNeighbors) {
      if (currentBitCount > bestBitCount) {
        bestFallbackMask = ruleBitmask;
        fallbackIds = tileIds;
        bestFallbackPriority = getRulePriority(ruleBitmask);
      } else if (currentBitCount === bestBitCount) {
        const currentPriority = getRulePriority(ruleBitmask);
        if (currentPriority > bestFallbackPriority) {
          bestFallbackMask = ruleBitmask;
          fallbackIds = tileIds;
          bestFallbackPriority = currentPriority;
        }
      }
    }
  }

  return fallbackIds;
};

export const getPlacedTileFromCell = (
  cell: Map<number, PlacedTile | null> | undefined,
  autotileGroup: string,
  config: TileConfig
): PlacedTile | null => {
  if (!cell) return null;
  for (const placedTile of cell.values()) {
    if (
      placedTile &&
      config.tiles[placedTile.tileId]?.autotile?.group === autotileGroup
    ) {
      return placedTile;
    }
  }
  return null;
};

export const calculateBitmask = (
  x: number,
  y: number,
  placedTiles: PlacedTiles,
  autotileGroup: string,
  config: TileConfig
): number => {
  let bitmask = 0;
  for (const [dx, dy, mask] of bitmaskToNeighbors) {
    const nx = x + dx;
    const ny = y + dy;

    const neighborCell = placedTiles.get(`${nx}-${ny}`);
    const neighborTile = getPlacedTileFromCell(
      neighborCell,
      autotileGroup,
      config
    );

    let hasNeighbor = !!neighborTile;

    if (!hasNeighbor && config.mapSize !== "infinite") {
      if (
        nx < 0 ||
        nx >= config.mapSize.width ||
        ny < 0 ||
        ny >= config.mapSize.height
      ) {
        hasNeighbor = true;
      }
    }

    if (hasNeighbor) {
      bitmask |= mask;
    }
  }
  return bitmask;
};

export const updateSurroundingTiles = (
  placedTiles: PlacedTiles,
  x: number,
  y: number,
  autotileLookup: AutotileLookup,
  config: TileConfig,
  options: {
    mode: "best-fit" | "strict";
    updateCenterTile: boolean;
  }
): PlacedTiles => {
  const newPlacedTiles = new Map(
    [...placedTiles].map(([key, value]) => [key, new Map(value)])
  );
  const queue: [number, number][] = [[x, y]];
  const visited = new Set<string>([`${x},${y}`]);
  const autotileGroupsAtXY = new Set<string>();

  // Check the initial tile and its direct neighbors to determine which autotile groups to process
  const initialTiles = [
    [x, y],
    [x, y - 1],
    [x + 1, y],
    [x, y + 1],
    [x - 1, y],
  ];

  for (const [ix, iy] of initialTiles) {
    const key = `${ix}-${iy}`;
    const cell = newPlacedTiles.get(key);
    if (cell) {
      for (const tile of cell.values()) {
        if (tile && config.tiles[tile.tileId]?.autotile) {
          autotileGroupsAtXY.add(config.tiles[tile.tileId].autotile!.group);
        }
      }
    }
  }

  if (autotileGroupsAtXY.size === 0) {
    return newPlacedTiles;
  }

  for (const [ix, iy] of initialTiles) {
    if (!visited.has(`${ix},${iy}`)) {
      queue.push([ix, iy]);
      visited.add(`${ix},${iy}`);
    }
  }

  let iteration = 0;
  const maxIterations = 1000;

  while (queue.length > 0) {
    iteration++;
    if (iteration > maxIterations) {
      console.error("Autotile update exceeded max iterations.");
      break;
    }

    const [cx, cy] = queue.shift()!;
    const isCenterTile = cx === x && cy === y;

    if (isCenterTile && !options.updateCenterTile) {
      continue;
    }

    for (const autotileGroup of autotileGroupsAtXY) {
      const groupLookup = autotileLookup.get(autotileGroup);
      if (!groupLookup) continue;

      const bitmask = calculateBitmask(
        cx,
        cy,
        newPlacedTiles,
        autotileGroup,
        config
      );

      const currentCell = newPlacedTiles.get(`${cx}-${cy}`);
      const currentTile = getPlacedTileFromCell(
        currentCell,
        autotileGroup,
        config
      );

      const validTileIds =
        options.mode === "best-fit"
          ? getBestFitTileIds(groupLookup, bitmask)
          : getStrictlyValidTileIds(groupLookup, bitmask);

      if (
        currentTile &&
        validTileIds &&
        !validTileIds.includes(currentTile.tileId)
      ) {
        // The current tile is no longer valid, so we need to replace it with the default for this bitmask
        const newTileId = chooseTileVariant(validTileIds);
        const newTileDef = config.tiles[newTileId];
        currentCell!.set(newTileDef.zIndex, {
          ...currentTile,
          tileId: newTileId,
        });

        // Since the tile changed, its neighbors might need to update
        for (const [dx, dy] of bitmaskToNeighbors.map((n) => [n[0], n[1]])) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (!visited.has(`${nx},${ny}`)) {
            queue.push([nx, ny]);
            visited.add(`${nx},${ny}`);
          }
        }
      }
    }
  }

  return newPlacedTiles;
};
