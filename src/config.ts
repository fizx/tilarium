type Direction = "N" | "E" | "S" | "W";

// Helper to generate all permutations of direction strings without duplicates
type Permutations<T extends string, U extends string = T> = [T] extends [never]
  ? ""
  : T extends any
  ? `${T}${"" | Permutations<Exclude<U, T>>}`
  : never;

type DirectionCombo = Permutations<Direction>;

export interface TileDefinition {
  displayName: string;
  autotile?: {
    group: string;
    neighbors: DirectionCombo;
  };
  groupName?: string;
  src: string;
  zIndex: number;
  type: "tile" | "background";
  spritesheet?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TileTabGroup {
  displayName: string;
  tileIds: string[];
  autotileGroups: string[];
}

export interface TileConfig {
  tiles: Record<string, TileDefinition>;
  groups: Record<string, TileTabGroup>;
  mapSize: { width: number; height: number } | "infinite"; // in tiles, not pixels
  defaultZoom: number;
  gridSize: number;
}
