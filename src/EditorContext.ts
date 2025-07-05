import React from "react";
import { TileConfig, TileDefinition } from "./config";
import { TilemapAction, TilemapState, PlacedTile } from "./state";

export type Tool = "place" | "drag" | "erase" | "magic-wand";

export interface FlashedTile {
  x: number;
  y: number;
  id: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Mouse {
  x: number;
  y: number;
}

export interface FadingTile {
  x: number;
  y: number;
  tileId: string;
  id: number;
}

export interface FadingCoords {
  x: number;
  y: number;
  id: number;
}

export interface EditorContextType {
  config: TileConfig;
  state: TilemapState;
  fadingOutTiles: FadingTile[];
  fadingInCoords: FadingCoords[];
  dispatch: (action: TilemapAction) => void;
  selectedTile?: TileDefinition;
  setSelectedTile: (tile?: TileDefinition) => void;
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;
  camera: Camera;
  setCamera: (camera: Camera) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  mouse: Mouse | null;
  setMouse: (mouse: Mouse | null) => void;
  tileToReplace: PlacedTile | null;
  setTileToReplace: (tile: PlacedTile | null) => void;
}

export const EditorContext = React.createContext<EditorContextType | null>(
  null
);
