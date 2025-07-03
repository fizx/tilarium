import React, { useReducer, useState } from "react";
import { TileConfig } from "./config";
import { TilemapState, PlacedTile } from "./state";
import { TilePalette } from "./components/TilePalette";
import { Canvas } from "./components/Canvas";
import { Toolbar } from "./components/Toolbar";
import { EditorContext, Camera, Tool, Mouse } from "./EditorContext";
import { CustomCursor } from "./components/CustomCursor";
import "./TilemapEditor.css";

interface TilemapEditorProps {
  config: TileConfig;
  initialState?: TilemapState;
  onChange?: (state: TilemapState) => void;
}

// A simple reducer for managing the placed tiles
const tilesReducer = (state: PlacedTile[], action: any): PlacedTile[] => {
  switch (action.type) {
    case "ADD_TILE":
      // Prevent adding a tile at the same position and z-index
      // A more robust solution would check z-index from the config
      return [...state, action.payload];
    case "REMOVE_TILE":
      return state.filter(
        (tile) => !(tile.x === action.payload.x && tile.y === action.payload.y)
      );
    default:
      return state;
  }
};

export const TilemapEditor: React.FC<TilemapEditorProps> = ({
  config,
  initialState,
  onChange,
}) => {
  const [placedTiles, dispatch] = useReducer(
    tilesReducer,
    initialState?.placedTiles || []
  );
  const [selectedTile, setSelectedTile] = useState<any>();
  const [selectedTool, setSelectedTool] = useState<Tool>("drag");
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [mouse, setMouse] = useState<Mouse | null>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null!);

  const editorState: TilemapState = {
    placedTiles,
  };

  const handleSelectTile = (tile: any) => {
    setSelectedTile(tile);
    setSelectedTool("place");
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <EditorContext.Provider
        value={{
          config,
          state: editorState,
          dispatch,
          selectedTile,
          setSelectedTile: handleSelectTile,
          selectedTool,
          setSelectedTool,
          camera,
          setCamera,
          canvasRef,
          mouse,
          setMouse,
        }}
      >
        <div className="editor-container">
          <div className="canvas-container">
            <Canvas />
            <Toolbar />
          </div>
          <TilePalette />
        </div>
        <CustomCursor />
      </EditorContext.Provider>
    </div>
  );
};
