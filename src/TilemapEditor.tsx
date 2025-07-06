import React, {
  useReducer,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { TileConfig, TileDefinition } from "./config";
import { TilemapState, PlacedTile, TilemapAction, PlacedTiles } from "./state";
import { TilePalette } from "./components/TilePalette";
import { Canvas } from "./components/Canvas";
import { Toolbar } from "./components/Toolbar";
import { EditorContext, Camera, Tool, Mouse } from "./EditorContext";
import { CustomCursor } from "./components/CustomCursor";
import {
  createAutotileLookup,
  updateSurroundingTiles,
  bitmaskToNeighbors,
  getPlacedTileFromCell,
  chooseTileVariant,
} from "./autotile";
import "./TilemapEditor.css";

export interface EditorActions {
  getState: () => TilemapState;
  loadState: (stateOrDelta: TilemapState | TilemapAction) => void;
  applyRemoteDelta: (delta: TilemapAction) => void;
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
  const autotileLookup = useMemo(() => createAutotileLookup(config), [config]);

  const reducer = (
    state: TilemapState,
    action: TilemapAction
  ): TilemapState => {
    switch (action.type) {
      case "ADD_TILE": {
        const { x, y, tileId, source } = action.payload;
        const newTileDef = config.tiles[tileId];
        if (!newTileDef || newTileDef.type === "background") return state;

        let finalTileId = tileId;
        const newPlacedTiles = new Map(state.placedTiles);

        if (newTileDef.autotile) {
          const autotileGroup = newTileDef.autotile.group;
          const groupLookup = autotileLookup.get(autotileGroup);

          if (groupLookup) {
            const bitmask = 15; // SWEN
            const validTileIds = groupLookup.get(bitmask);
            if (validTileIds && validTileIds.length > 0) {
              finalTileId = chooseTileVariant(validTileIds);
            }
          }
        }

        const key = `${x}-${y}`;
        const cell = new Map(newPlacedTiles.get(key));
        cell.set(newTileDef.zIndex, { x, y, tileId: finalTileId, source });
        newPlacedTiles.set(key, cell);

        const finalPlacedTiles = updateSurroundingTiles(
          newPlacedTiles,
          x,
          y,
          autotileLookup,
          config
        );

        return { ...state, placedTiles: finalPlacedTiles };
      }
      case "REMOVE_TILE": {
        const { x, y, tileId, source } = action.payload;
        const tileDef = config.tiles[tileId];
        if (!tileDef) return state;

        const newPlacedTiles = new Map(state.placedTiles);
        const key = `${x}-${y}`;
        const cell = new Map(newPlacedTiles.get(key));

        if (cell.get(tileDef.zIndex)?.tileId === tileId) {
          cell.set(tileDef.zIndex, null);
          newPlacedTiles.set(key, cell);
        }

        const finalPlacedTiles = updateSurroundingTiles(
          newPlacedTiles,
          x,
          y,
          autotileLookup,
          config
        );

        return { ...state, placedTiles: finalPlacedTiles };
      }
      case "SET_BACKGROUND":
        return {
          ...state,
          backgroundTileId: action.payload,
        };
      case "LOAD_STATE": {
        const loadedState = action.payload;
        if (Array.isArray(loadedState.placedTiles)) {
          const placedTilesMap: PlacedTiles = new Map();
          for (const tile of loadedState.placedTiles as PlacedTile[]) {
            const tileDef = config.tiles[tile.tileId];
            if (tileDef) {
              const key = `${tile.x}-${tile.y}`;
              if (!placedTilesMap.has(key)) {
                placedTilesMap.set(key, new Map());
              }
              placedTilesMap
                .get(key)!
                .set(tileDef.zIndex, { ...tile, source: "initial" });
            }
          }
          return { ...loadedState, placedTiles: placedTilesMap };
        }
        return loadedState;
      }
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(
    reducer,
    initialState
      ? reducer({ placedTiles: new Map() } as TilemapState, {
          type: "LOAD_STATE",
          payload: initialState,
        })
      : {
          placedTiles: new Map(),
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
  const lastPaintedCell = useRef<{ x: number; y: number } | null>(null);
  stateRef.current = state;

  const dispatchRemote = useCallback((action: TilemapAction) => {
    dispatch(action);
  }, []);

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
        applyRemoteDelta: (delta: TilemapAction) => {
          console.log("[client] Received remote delta:", delta);
          const remoteDelta = {
            ...delta,
            payload: { ...(delta.payload as any), source: "remote" },
          } as TilemapAction;
          dispatchRemote(remoteDelta);
        },
      });
    }
    isReady.current = true;
  }, [onReady, dispatchAndNotify, dispatchRemote]);

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

  const applyToolAt = useCallback(
    (gridX: number, gridY: number) => {
      if (
        lastPaintedCell.current?.x === gridX &&
        lastPaintedCell.current?.y === gridY
      ) {
        return;
      }

      if (config.mapSize !== "infinite") {
        if (
          gridX < 0 ||
          gridX >= config.mapSize.width ||
          gridY < 0 ||
          gridY >= config.mapSize.height
        ) {
          return;
        }
      }

      if (selectedTool === "place" && selectedTile) {
        dispatchAndNotify({
          type: "ADD_TILE",
          payload: {
            x: gridX,
            y: gridY,
            tileId: selectedTile.displayName,
            source: "local",
          },
        });
      } else if (selectedTool === "erase") {
        const key = `${gridX}-${gridY}`;
        const cell = stateRef.current.placedTiles.get(key);
        if (!cell) return;

        const tilesAtLocation = [...cell.values()].filter(
          (t) => t
        ) as PlacedTile[];

        if (tilesAtLocation.length === 0) return;

        const topTile = tilesAtLocation.sort(
          (a, b) =>
            config.tiles[b.tileId].zIndex - config.tiles[a.tileId].zIndex
        )[0];

        if (topTile) {
          const action = {
            type: "REMOVE_TILE" as const,
            payload: {
              x: gridX,
              y: gridY,
              tileId: topTile.tileId,
              source: "local" as const,
            },
          };
          dispatchAndNotify(action);
        }
      }

      lastPaintedCell.current = { x: gridX, y: gridY };
    },
    [dispatchAndNotify, selectedTile, selectedTool, config.mapSize]
  );

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
          autotileLookup,
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
