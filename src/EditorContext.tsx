import React, { createContext, useContext } from "react";
import { TileConfig, TileDefinition } from "./config";
import { TilemapAction, TilemapState, PlacedTile } from "./state";
import { AutotileLookup } from "./autotile";

export type Tool = "place" | "drag" | "erase" | "eyedropper";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Mouse {
  x: number;
  y: number;
}

export interface EditorContextType {
  config: TileConfig;
  state: TilemapState;
  dispatch: React.Dispatch<TilemapAction>;
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
  hoveredTile: PlacedTile | null;
  setHoveredTile: (tile: PlacedTile | null) => void;
  autotileLookup: AutotileLookup;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
};
