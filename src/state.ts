import { TilemapDelta } from "./delta";

export type TileSource = "initial" | "local" | "remote";

export interface PlacedTile {
  source: TileSource;
  x: number;
  y: number;
  tileId: string;
}

export type PlacedTiles = Map<string, Map<number, PlacedTile | null>>;

export interface TilemapState {
  placedTiles: PlacedTiles;
  tileToReplace: PlacedTile | null;
  backgroundTileId: string | null;
  sourceOfChange?: "local" | "remote" | "load";
}

export interface AddTileAction {
  type: "ADD_TILE";
  payload: {
    x: number;
    y: number;
    tileId: string;
    source: TileSource;
    isAutotileRep: boolean;
  };
}

export interface RemoveTileAction {
  type: "REMOVE_TILE";
  payload: {
    x: number;
    y: number;
    tileId: string;
    source: TileSource;
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

export interface ApplyDeltaAction {
  type: "APPLY_DELTA";
  payload: TilemapDelta;
}

export type TilemapAction =
  | AddTileAction
  | RemoveTileAction
  | SetBackgroundAction
  | LoadStateAction
  | ApplyDeltaAction
  | {
      type: "FILL_RECTANGLE";
      payload: {
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        tileId: string;
      };
    };
