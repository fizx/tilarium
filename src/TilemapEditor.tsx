import React, {
  useReducer,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { TileConfig, TileDefinition } from "./config";
import { TilemapState, PlacedTile, TilemapAction } from "./state";
import { TilePalette } from "./components/TilePalette";
import { Canvas } from "./components/Canvas";
import { Toolbar } from "./components/Toolbar";
import { EditorContext, Camera, Tool, Mouse } from "./EditorContext";
import { CustomCursor } from "./components/CustomCursor";
import "./TilemapEditor.css";

export interface EditorActions {
  getState: () => TilemapState;
  loadState: (stateOrDelta: TilemapState | TilemapAction) => void;
}

export interface TilemapEditorProps {
  config: TileConfig;
  initialState?: TilemapState;
  onReady?: (actions: EditorActions) => void;
  onStateChange?: (newState: TilemapState, delta: TilemapAction) => void;
  onCameraChange?: (camera: Camera) => void;
  onToolSelect?: (tool: Tool) => void;
  onTileSelect?: (tile?: TileDefinition) => void;
  canvasStyle?: React.CSSProperties;
}

export const TilemapEditor: React.FC<TilemapEditorProps> = ({
  config,
  initialState,
  onReady,
  onStateChange,
  onCameraChange,
  onToolSelect,
  onTileSelect,
  canvasStyle,
}) => {
  const reducer = (
    state: TilemapState,
    action: TilemapAction
  ): TilemapState => {
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
      case "LOAD_STATE":
        return action.payload;
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(
    reducer,
    initialState || {
      placedTiles: [],
      backgroundTileId: null,
      tileToReplace: null,
    }
  );

  const [selectedTile, rawSetSelectedTile] = useState<
    TileDefinition | undefined
  >();
  const [selectedTool, rawSetSelectedTool] = useState<Tool>("drag");
  const [camera, rawSetCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [mouse, setMouse] = useState<Mouse | null>(null);
  const [tileToReplace, setTileToReplace] = useState<PlacedTile | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isReady = useRef(false);
  const actionsRef = useRef<EditorActions | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Wrapped dispatch to notify of state changes
  const dispatchAndNotify = useCallback(
    (action: TilemapAction) => {
      const newState = reducer(stateRef.current, action);
      dispatch(action);
      if (onStateChange && isReady.current) {
        onStateChange(newState, action);
      }
    },
    [onStateChange]
  );

  // Wrapped state setters to fire hooks
  const setCamera = (newCamera: Camera) => {
    rawSetCamera(newCamera);
    if (onCameraChange) onCameraChange(newCamera);
  };
  const setSelectedTool = (newTool: Tool) => {
    rawSetSelectedTool(newTool);
    if (onToolSelect) onToolSelect(newTool);
  };
  const setSelectedTile = (newTile?: TileDefinition) => {
    rawSetSelectedTile(newTile);
    if (onTileSelect) onTileSelect(newTile);
  };

  useEffect(() => {
    if (onReady) {
      onReady({
        getState: () => stateRef.current,
        loadState: (stateOrDelta: TilemapState | TilemapAction) => {
          const action =
            "type" in stateOrDelta && stateOrDelta.type
              ? stateOrDelta
              : ({
                  type: "LOAD_STATE",
                  payload: stateOrDelta,
                } as TilemapAction);
          dispatchAndNotify(action);
        },
      });
    }
    isReady.current = true;
  }, [onReady, dispatchAndNotify]);

  useEffect(() => {
    if (canvasRef.current && config.mapSize !== "infinite") {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const zoom = 1;
      const mapWidth = config.mapSize.width * config.gridSize * zoom;
      const mapHeight = config.mapSize.height * config.gridSize * zoom;
      setCamera({
        zoom,
        x: (canvasRect.width - mapWidth) / 2,
        y: (canvasRect.height - mapHeight) / 2,
      });
    }
  }, [config]);

  const handleSelectTile = (tile?: TileDefinition) => {
    if (!tile) {
      setSelectedTile(undefined);
      return;
    }

    if (tile.type === "background") {
      dispatchAndNotify({ type: "SET_BACKGROUND", payload: tile.displayName });
      setSelectedTile(undefined);
    } else {
      setSelectedTile(tile);
      if (selectedTool !== "drag") {
        setSelectedTool("place");
      }
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
          state: { ...state, tileToReplace },
          dispatch: dispatchAndNotify,
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
