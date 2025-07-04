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

export const TilemapEditor: React.FC<TilemapEditorProps> = ({
  config,
  initialState,
  onChange,
}) => {
  const tilesReducer = (state: PlacedTile[], action: any): PlacedTile[] => {
    switch (action.type) {
      case "ADD_TILE": {
        const newTile = action.payload;
        const newTileDef = config.tiles[newTile.tileId];
        if (!newTileDef) return state;

        // Remove any existing tile with the same zIndex at the same position
        const filteredState = state.filter((tile) => {
          const existingTileDef = config.tiles[tile.tileId];
          if (!existingTileDef) return true;

          return !(
            tile.x === newTile.x &&
            tile.y === newTile.y &&
            existingTileDef.zIndex === newTileDef.zIndex
          );
        });

        return [...filteredState, newTile];
      }
      case "REMOVE_TILE":
        return state.filter(
          (tile) =>
            !(tile.x === action.payload.x && tile.y === action.payload.y)
        );
      default:
        return state;
    }
  };

  const [placedTiles, dispatch] = useReducer(
    tilesReducer,
    initialState?.placedTiles || []
  );
  const [selectedTile, setSelectedTile] = useState<any>();
  const [selectedTool, setSelectedTool] = useState<Tool>("drag");
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [mouse, setMouse] = useState<Mouse | null>(null);
  const [tileToReplace, setTileToReplace] = useState<PlacedTile | null>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null!);

  const editorState: TilemapState = {
    placedTiles,
    tileToReplace,
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
          tileToReplace,
          setTileToReplace,
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
