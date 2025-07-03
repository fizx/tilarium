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

export interface TileConfig {
  tiles: Record<string, TileDefinition>;
  mapSize: { width: number; height: number } | "infinite";
}
