import React, { createContext, useContext } from "react";
import { TilemapState, PlacedTile } from "./state";
import { TileConfig, TileDefinition } from "./config";

export type Tool = "place" | "drag" | "erase" | "magic-wand";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Mouse {
  x: number;
  y: number;
}

interface EditorContextType {
  config: TileConfig;
  state: TilemapState;
  dispatch: React.Dispatch<any>; // Using 'any' for now, will be replaced with specific action types
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

export const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
};
