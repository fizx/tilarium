import React, { createContext, useContext } from "react";
import { TileConfig, TileDefinition } from "./config";
import { TilemapAction, TilemapState, PlacedTile } from "./state";
import { AutotileLookup } from "./autotile";

export type Tool = "place" | "drag" | "erase" | "eyedropper" | "zoom";

export interface SelectedTile {
  definition: TileDefinition;
  isAutotileRep: boolean;
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

export interface EditorContextType {
  config: TileConfig;
  state: TilemapState;
  dispatch: React.Dispatch<TilemapAction>;
  selectedTile: { definition: TileDefinition; isAutotileRep: boolean } | null;
  setSelectedTile: (
    tile: { definition: TileDefinition; isAutotileRep: boolean } | null
  ) => void;
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
  openHelpModal: () => void;
  placeMode: "autotile" | "manual" | "rectangle";
  setPlaceMode: (mode: "autotile" | "manual" | "rectangle") => void;
  eraseMode: "single" | "wand" | "rectangle";
  setEraseMode: (mode: "single" | "wand" | "rectangle") => void;
  preferredPlaceMode: "autotile" | "rectangle";
  setPreferredPlaceMode: (mode: "autotile" | "rectangle") => void;
  zoomMode: "in" | "out";
  setZoomMode: (mode: "in" | "out") => void;
  applyToolAt: (gridX: number, gridY: number) => void;
  isMouseOverUI: boolean;
  setIsMouseOverUI: (isOver: boolean) => void;
}

export const EditorContext = createContext<EditorContextType | undefined>(
  undefined
);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
};
