export interface PlacedTile {
  x: number;
  y: number;
  tileId: string;
}

export interface TilemapState {
  placedTiles: PlacedTile[];
  tileToReplace: PlacedTile | null;
  backgroundTileId: string | null;
}

export interface AddTileAction {
  type: "ADD_TILE";
  payload: PlacedTile;
}

export interface RemoveTileAction {
  type: "REMOVE_TILE";
  payload: {
    x: number;
    y: number;
    tileId: string;
  };
}

export interface SetBackgroundAction {
  type: "SET_BACKGROUND";
  payload: string;
}

export interface LoadStateAction {
  type: "LOAD_STATE";
  payload: TilemapState;
}

export type TilemapAction =
  | AddTileAction
  | RemoveTileAction
  | SetBackgroundAction
  | LoadStateAction;
