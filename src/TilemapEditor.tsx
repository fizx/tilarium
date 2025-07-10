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
import {
  EditorContext,
  Camera,
  Tool,
  Mouse,
  SelectedTile,
} from "./EditorContext";
import { CustomCursor } from "./components/CustomCursor";
import {
  createAutotileLookup,
  updateSurroundingTiles,
  bitmaskToNeighbors,
  getPlacedTileFromCell,
  chooseTileVariant,
  getBestFitTileIds,
  calculateBitmask,
} from "./autotile";
import "./TilemapEditor.css";
import { HelpModal } from "./components/HelpModal";
import { TilemapDelta, createDelta, applyDelta } from "./delta";

export interface EditorActions {
  getState: () => TilemapState;
  loadState: (stateOrDelta: TilemapState | TilemapAction) => void;
  applyRemoteDelta: (delta: TilemapDelta) => void;
}

export interface TilemapEditorProps {
  config: TileConfig;
  initialState?: TilemapState;
  onReady?: (actions: EditorActions) => void;
  onStateChange?: (newState: TilemapState) => void;
  onCameraChange?: (camera: Camera) => void;
  onToolSelect?: (tool: Tool) => void;
  onTileSelect?: (tile?: TileDefinition) => void;
  canvasStyle?: React.CSSProperties;
}

const getTopTile = (
  cell: Map<number, PlacedTile | null> | undefined,
  config: TileConfig
): PlacedTile | null => {
  if (!cell) return null;
  const tiles = [...cell.values()].filter((t) => t) as PlacedTile[];
  if (tiles.length === 0) return null;
  return tiles.reduce((top, current) => {
    const topZ = config.tiles[top.tileId]?.zIndex ?? -Infinity;
    const currentZ = config.tiles[current.tileId]?.zIndex ?? -Infinity;
    return currentZ > topZ ? current : top;
  });
};

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
      case "APPLY_DELTA": {
        const delta = action.payload as TilemapDelta;
        const newPlacedTiles = applyDelta(state.placedTiles, delta, "remote");
        return {
          ...state,
          placedTiles: newPlacedTiles,
          sourceOfChange: "remote",
        };
      }
      case "ADD_TILE": {
        const { x, y, tileId, source, isAutotileRep } = action.payload;
        const newTileDef = config.tiles[tileId];
        if (!newTileDef || newTileDef.type === "background") return state;

        const newPlacedTiles = new Map(state.placedTiles);
        const key = `${x}-${y}`;
        const cell = new Map(newPlacedTiles.get(key));
        const existingTile = cell.get(newTileDef.zIndex);
        const existingTileDef = existingTile
          ? config.tiles[existingTile.tileId]
          : undefined;

        let finalTileId = tileId;

        // Check if this is a cycle operation
        if (
          isAutotileRep &&
          existingTile &&
          existingTileDef?.autotile &&
          newTileDef.autotile &&
          existingTileDef.autotile.group === newTileDef.autotile.group
        ) {
          // --- Cycle logic ---
          const autotileGroup = newTileDef.autotile.group;
          const groupLookup = autotileLookup.get(autotileGroup);
          if (groupLookup) {
            let bitmask = 0;
            for (const [dx, dy, mask] of bitmaskToNeighbors) {
              const nx = x + dx;
              const ny = y + dy;
              const neighborCell = newPlacedTiles.get(`${nx}-${ny}`);
              const neighborTile = getPlacedTileFromCell(
                neighborCell,
                autotileGroup,
                config
              );
              if (neighborTile) {
                bitmask |= mask;
              }
            }
            const validTileIds = getBestFitTileIds(groupLookup, bitmask);

            if (validTileIds && validTileIds.length > 1) {
              const currentIndex = validTileIds.indexOf(existingTile.tileId);
              if (currentIndex !== -1) {
                const nextIndex = (currentIndex + 1) % validTileIds.length;
                finalTileId = validTileIds[nextIndex];
              } else {
                finalTileId = validTileIds[0];
              }
            } else if (validTileIds) {
              finalTileId = validTileIds[0];
            }
          }
        } else if (isAutotileRep && newTileDef.autotile) {
          // --- Probabilistic placement logic for new tiles ---
          const autotileGroup = newTileDef.autotile.group;
          const groupLookup = autotileLookup.get(autotileGroup);

          if (groupLookup) {
            const bitmask = calculateBitmask(
              x,
              y,
              newPlacedTiles,
              autotileGroup,
              config
            );
            const validTileIds = getBestFitTileIds(groupLookup, bitmask);
            if (validTileIds && validTileIds.length > 0) {
              finalTileId = chooseTileVariant(validTileIds);
            }
          }
        }

        cell.set(newTileDef.zIndex, { x, y, tileId: finalTileId, source });
        newPlacedTiles.set(key, cell);

        const finalPlacedTiles = updateSurroundingTiles(
          newPlacedTiles,
          x,
          y,
          autotileLookup,
          config,
          {
            mode: isAutotileRep ? "best-fit" : "strict",
            updateCenterTile: isAutotileRep,
          }
        );

        return {
          ...state,
          placedTiles: finalPlacedTiles,
          sourceOfChange: "local",
        };
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
          config,
          {
            mode: "best-fit",
            updateCenterTile: true,
          }
        );

        return {
          ...state,
          placedTiles: finalPlacedTiles,
          sourceOfChange: "local",
        };
      }
      case "SET_BACKGROUND":
        return {
          ...state,
          backgroundTileId: action.payload,
          sourceOfChange: "local",
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
          return {
            ...loadedState,
            placedTiles: placedTilesMap,
            sourceOfChange: "load",
          };
        }
        return { ...loadedState, sourceOfChange: "load" };
      }
      case "FILL_RECTANGLE": {
        const { startX, startY, endX, endY, tileId } = action.payload;
        const tileDef = config.tiles[tileId];
        if (!tileDef) return state;

        let newPlacedTiles = new Map(state.placedTiles);

        // First pass: Place all the tiles without updating neighbors
        for (let x = startX; x <= endX; x++) {
          for (let y = startY; y <= endY; y++) {
            const key = `${x}-${y}`;
            const cell = new Map(newPlacedTiles.get(key));
            cell.set(tileDef.zIndex, { x, y, tileId, source: "local" });
            newPlacedTiles.set(key, cell);
          }
        }

        // Second pass: Update autotiles for the entire filled area
        for (let x = startX; x <= endX; x++) {
          for (let y = startY; y <= endY; y++) {
            newPlacedTiles = updateSurroundingTiles(
              newPlacedTiles,
              x,
              y,
              autotileLookup,
              config,
              { mode: "best-fit", updateCenterTile: true }
            );
          }
        }

        return {
          ...state,
          placedTiles: newPlacedTiles,
          sourceOfChange: "local",
        };
      }
      case "WAND_ERASE": {
        const { x, y } = action.payload;
        const cell = state.placedTiles.get(`${x}-${y}`);
        if (!cell) return state;

        const topTile = getTopTile(cell, config);
        if (!topTile) return state;

        const targetGroup = config.tiles[topTile.tileId].autotile?.group;
        if (!targetGroup) return state; // Only wand erase autotiles for now

        let newPlacedTiles = new Map(state.placedTiles);
        const queue = [{ x, y }];
        const visited = new Set([`${x}-${y}`]);

        while (queue.length > 0) {
          const { x: currentX, y: currentY } = queue.shift()!;
          const key = `${currentX}-${currentY}`;
          const currentCell = newPlacedTiles.get(key);
          if (!currentCell) continue;

          const currentTopTile = getTopTile(currentCell, config);
          if (
            currentTopTile &&
            config.tiles[currentTopTile.tileId].autotile?.group === targetGroup
          ) {
            // Erase all tiles at this location that match the group
            const tilesToKeep = new Map();
            for (const [zIndex, tile] of currentCell.entries()) {
              if (
                tile &&
                config.tiles[tile.tileId].autotile?.group !== targetGroup
              ) {
                tilesToKeep.set(zIndex, tile);
              }
            }
            if (tilesToKeep.size > 0) {
              newPlacedTiles.set(key, tilesToKeep);
            } else {
              newPlacedTiles.delete(key);
            }

            // Check neighbors
            for (const [dx, dy] of [
              [0, -1],
              [1, 0],
              [0, 1],
              [-1, 0],
            ]) {
              const nx = currentX + dx;
              const ny = currentY + dy;
              const neighborKey = `${nx}-${ny}`;
              if (!visited.has(neighborKey)) {
                visited.add(neighborKey);
                queue.push({ x: nx, y: ny });
              }
            }
          }
        }

        // Update surroundings for all affected tiles after the erase
        for (const visitedKey of visited) {
          const [vx, vy] = visitedKey.split("-").map(Number);
          newPlacedTiles = updateSurroundingTiles(
            newPlacedTiles,
            vx,
            vy,
            autotileLookup,
            config,
            { mode: "best-fit", updateCenterTile: true }
          );
        }

        return {
          ...state,
          placedTiles: newPlacedTiles,
          sourceOfChange: "local",
        };
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

  const [selectedTile, rawSetSelectedTile] = useState<SelectedTile | null>(
    null
  );
  const [selectedTool, rawSetSelectedTool] = useState<"place" | "erase">(
    "place"
  );
  const [placeMode, setPlaceMode] = useState<
    "autotile" | "manual" | "rectangle"
  >("autotile");
  const [eraseMode, setEraseMode] = useState<"single" | "wand" | "rectangle">(
    "single"
  );
  const [camera, rawSetCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [mouse, setMouse] = useState<Mouse | null>(null);
  const [tileToReplace, setTileToReplace] = useState<PlacedTile | null>(null);
  const [hoveredTile, setHoveredTile] = useState<PlacedTile | null>(null);
  const [isHelpModalOpen, setHelpModalOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isReady = useRef(false);
  const actionsRef = useRef<EditorActions | null>(null);
  const previousStateRef = useRef<TilemapState>(state);
  const lastPaintedCell = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    console.log("Initial mouse state on load:", mouse);
  }, []);

  // Rectangle drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // This runs after every render, so `state` is guaranteed to be up-to-date.
    const beforeState = previousStateRef.current;
    const afterState = state;

    if (
      onStateChange &&
      isReady.current &&
      afterState.sourceOfChange === "local"
    ) {
      const delta = createDelta(
        beforeState.placedTiles,
        afterState.placedTiles
      );
      const backgroundChanged =
        beforeState.backgroundTileId !== afterState.backgroundTileId;
      if (Object.keys(delta).length > 0 || backgroundChanged) {
        onStateChange(afterState);
      }
    }

    // Update the previous state for the next render.
    previousStateRef.current = state;
  }, [state, onStateChange]);

  useEffect(() => {
    if (onReady) {
      onReady({
        getState: () => state,
        loadState: (stateOrDelta: TilemapState | TilemapAction) => {
          const action =
            "type" in stateOrDelta && stateOrDelta.type
              ? stateOrDelta
              : ({
                  type: "LOAD_STATE",
                  payload: stateOrDelta,
                } as TilemapAction);
          dispatch(action);
        },
        applyRemoteDelta: (delta: TilemapDelta) => {
          console.log("[client] Received remote delta:", delta);
          if (!delta || typeof delta !== "object") {
            console.warn(
              "Received invalid delta format in applyRemoteDelta, ignoring.",
              delta
            );
            return;
          }

          dispatch({
            type: "APPLY_DELTA",
            payload: delta,
          } as TilemapAction);
        },
      });
    }
    isReady.current = true;
  }, [onReady, dispatch]);

  useEffect(() => {
    if (canvasRef.current && config.mapSize !== "infinite") {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const zoom = 1;
      const mapWidth = config.mapSize.width * config.gridSize * zoom;
      const mapHeight = config.mapSize.height * config.gridSize * zoom;
      rawSetCamera({
        zoom,
        x: (canvasRect.width - mapWidth) / 2,
        y: (canvasRect.height - mapHeight) / 2,
      });
    }
  }, [config]);

  const handleSelectTile = (tile: TileDefinition, isAutotileRep: boolean) => {
    if (tile.type === "background") {
      dispatch({ type: "SET_BACKGROUND", payload: tile.displayName });
      rawSetSelectedTile(null);
    } else {
      rawSetSelectedTile({ definition: tile, isAutotileRep });
      rawSetSelectedTool("place");
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
        dispatch({
          type: "ADD_TILE",
          payload: {
            x: gridX,
            y: gridY,
            tileId: selectedTile.definition.displayName,
            source: "local",
            isAutotileRep: selectedTile.isAutotileRep,
          },
        });
      } else if (selectedTool === "erase" && eraseMode === "single") {
        const key = `${gridX}-${gridY}`;
        const cell = state.placedTiles.get(key);
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
          dispatch(action);
        }
      } else if (selectedTool === "erase" && eraseMode === "wand") {
        dispatch({ type: "WAND_ERASE", payload: { x: gridX, y: gridY } });
      }

      lastPaintedCell.current = { x: gridX, y: gridY };
    },
    [
      dispatch,
      selectedTile,
      selectedTool,
      config.mapSize,
      state.placedTiles,
      eraseMode,
    ]
  );

  const getGridCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const gridX = Math.floor(
        (x - camera.x) / (config.gridSize * camera.zoom)
      );
      const gridY = Math.floor(
        (y - camera.y) / (config.gridSize * camera.zoom)
      );
      return { x: gridX, y: gridY };
    },
    [camera, config.gridSize]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Handle rectangle drawing modes for both place and erase
      if (
        (selectedTool === "place" &&
          placeMode === "rectangle" &&
          selectedTile) ||
        (selectedTool === "erase" && eraseMode === "rectangle")
      ) {
        const coords = getGridCoordinates(e.clientX, e.clientY);
        if (coords) {
          setIsDrawing(true);
          setDrawStart(coords);
          setDrawEnd(coords);
        }
      } else {
        // Handle all single-tile modes
        const coords = getGridCoordinates(e.clientX, e.clientY);
        if (coords) {
          applyToolAt(coords.x, coords.y);
        }
      }
    },
    [
      placeMode,
      eraseMode,
      selectedTool,
      selectedTile,
      getGridCoordinates,
      applyToolAt,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return;
      const coords = getGridCoordinates(e.clientX, e.clientY);
      if (coords) {
        setDrawEnd(coords);
      }
    },
    [isDrawing, getGridCoordinates]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing && drawStart && drawEnd) {
      const startX = Math.min(drawStart.x, drawEnd.x);
      const endX = Math.max(drawStart.x, drawEnd.x);
      const startY = Math.min(drawStart.y, drawEnd.y);
      const endY = Math.max(drawStart.y, drawEnd.y);

      if (placeMode === "rectangle" && selectedTile) {
        dispatch({
          type: "FILL_RECTANGLE",
          payload: {
            startX,
            startY,
            endX,
            endY,
            tileId: selectedTile.definition.displayName,
          },
        });
      } else if (eraseMode === "rectangle") {
        for (let x = startX; x <= endX; x++) {
          for (let y = startY; y <= endY; y++) {
            const key = `${x}-${y}`;
            const cell = state.placedTiles.get(key);
            if (cell) {
              const topTile = getTopTile(cell, config);
              if (topTile) {
                dispatch({
                  type: "REMOVE_TILE",
                  payload: { x, y, tileId: topTile.tileId, source: "local" },
                });
              }
            }
          }
        }
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);
  }, [
    isDrawing,
    drawStart,
    drawEnd,
    selectedTile,
    dispatch,
    placeMode,
    eraseMode,
    state.placedTiles,
    config,
  ]);

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
          dispatch,
          selectedTile,
          setSelectedTile: rawSetSelectedTile,
          selectedTool,
          setSelectedTool: rawSetSelectedTool,
          placeMode,
          setPlaceMode,
          eraseMode,
          setEraseMode,
          applyToolAt,
          camera,
          setCamera: rawSetCamera,
          canvasRef,
          mouse,
          setMouse,
          tileToReplace,
          setTileToReplace,
          hoveredTile,
          setHoveredTile,
          autotileLookup,
          openHelpModal: () => setHelpModalOpen(true),
        }}
      >
        <div className="editor-container">
          <div
            className="canvas-container"
            style={canvasStyle}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Canvas />
            <Toolbar />
            {isDrawing && drawStart && drawEnd && (
              <div
                className="drawing-rectangle"
                style={{
                  left:
                    Math.min(drawStart.x, drawEnd.x) *
                      config.gridSize *
                      camera.zoom +
                    camera.x,
                  top:
                    Math.min(drawStart.y, drawEnd.y) *
                      config.gridSize *
                      camera.zoom +
                    camera.y,
                  width:
                    (Math.abs(drawStart.x - drawEnd.x) + 1) *
                    config.gridSize *
                    camera.zoom,
                  height:
                    (Math.abs(drawStart.y - drawEnd.y) + 1) *
                    config.gridSize *
                    camera.zoom,
                }}
              />
            )}
          </div>
          <TilePalette onSelectTile={handleSelectTile} />
        </div>
        <CustomCursor />
        {isHelpModalOpen && (
          <HelpModal onClose={() => setHelpModalOpen(false)} />
        )}
      </EditorContext.Provider>
    </div>
  );
};
