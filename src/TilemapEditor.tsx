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
  canvasStyle?: React.CSSProperties;
}

export const TilemapEditor: React.FC<TilemapEditorProps> = ({
  config,
  initialState,
  onChange,
  canvasStyle,
}) => {
  const editorReducer = (state: TilemapState, action: any): TilemapState => {
    switch (action.type) {
      case "ADD_TILE": {
        const newTile = action.payload;
        const newTileDef = config.tiles[newTile.tileId];
        if (!newTileDef || newTileDef.type === "background") return state;

        // Remove any existing tile with the same zIndex at the same position
        const filteredState = state.placedTiles.filter((tile) => {
          const existingTileDef = config.tiles[tile.tileId];
          if (!existingTileDef) return true;

          return !(
            tile.x === newTile.x &&
            tile.y === newTile.y &&
            existingTileDef.zIndex === newTileDef.zIndex
          );
        });

        return { ...state, placedTiles: [...filteredState, newTile] };
      }
      case "REMOVE_TILE":
        return {
          ...state,
          placedTiles: state.placedTiles.filter(
            (tile) =>
              !(tile.x === action.payload.x && tile.y === action.payload.y)
          ),
        };
      case "SET_BACKGROUND":
        return {
          ...state,
          backgroundTileId: action.payload,
        };
      default:
        return state;
    }
  };

  const [editorState, dispatch] = useReducer(
    editorReducer,
    initialState || {
      placedTiles: [],
      tileToReplace: null,
      backgroundTileId: null,
    }
  );

  const [selectedTile, setSelectedTile] = useState<any>();
  const [selectedTool, setSelectedTool] = useState<Tool>("drag");
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [mouse, setMouse] = useState<Mouse | null>(null);
  const [tileToReplace, setTileToReplace] = useState<PlacedTile | null>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null!);

  const handleSelectTile = (tile: any) => {
    if (tile.type === "background") {
      dispatch({ type: "SET_BACKGROUND", payload: tile.displayName });
      setSelectedTile(undefined);
    } else {
      setSelectedTile(tile);
      setSelectedTool("place");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <EditorContext.Provider
        value={{
          config,
          state: { ...editorState, tileToReplace },
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
          <div className="canvas-container" style={canvasStyle}>
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
