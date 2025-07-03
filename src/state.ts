export interface PlacedTile {
  x: number;
  y: number;
  tileId: string;
}

export interface TilemapState {
  placedTiles: PlacedTile[];
}
