export interface TileDefinition {
  displayName: string;
  src: string;
  zIndex: number;
  spritesheet?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scale?: number;
}

export interface TileGroup {
  displayName: string;
  tileIds: string[];
}

export interface TileConfig {
  tiles: Record<string, TileDefinition>;
  groups: Record<string, TileGroup>;
  mapSize: { width: number; height: number } | "infinite";
}
