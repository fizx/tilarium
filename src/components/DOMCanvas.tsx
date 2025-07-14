import React, {
  useRef,
  useState,
  useMemo,
  TouchEvent,
  MouseEvent,
  useEffect,
  useCallback,
} from "react";
import { useEditor } from "../EditorContext";
import { PlacedTile } from "../state";
import { Tile } from "./Tile";
import { Background } from "./Background";

export const DOMCanvas = () => {
  const {
    config,
    state,
    dispatch,
    selectedTile,
    selectedTool,
    camera,
    setCamera,
    canvasRef,
    setMouse,
    setTileToReplace,
    setSelectedTool,
    setHoveredTile,
    hoveredTile,
    setSelectedTile,
    placeMode,
    eraseMode,
    zoomMode,
    applyToolAt,
    mapBounds,
  } = useEditor();
  const isDragging = useRef(false);
  const configRef = useRef(config);
  const stateRef = useRef(state);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const pinchDist = useRef(0);
  const justTouched = useRef(false);
  const [isOverMap, setIsOverMap] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeout = useRef<number | null>(null);

  // State for drawing rectangles
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cursor = useMemo(() => {
    if (!isOverMap) return "default";
    if (selectedTool === "drag") return "grab";
    if (selectedTool === "zoom")
      return zoomMode === "in" ? "zoom-in" : "zoom-out";
    return "none"; // Hide default cursor for place/erase to show custom one
  }, [selectedTool, isOverMap, zoomMode]);

  const getEventCoords = useCallback((e: MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }, []);

  const getGridCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const gridX = Math.floor(
        (x - camera.x) / (configRef.current.gridSize * camera.zoom)
      );
      const gridY = Math.floor(
        (y - camera.y) / (configRef.current.gridSize * camera.zoom)
      );
      return { x: gridX, y: gridY };
    },
    [camera, canvasRef]
  );

  const handleZoomAtPoint = useCallback(
    (zoomFactor: number, pointX: number, pointY: number) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const worldX = (pointX - rect.left - camera.x) / camera.zoom;
      const worldY = (pointY - rect.top - camera.y) / camera.zoom;
      const newZoom = Math.max(0.1, camera.zoom * zoomFactor);
      const newCameraX = pointX - rect.left - worldX * newZoom;
      const newCameraY = pointY - rect.top - worldY * newZoom;

      setCamera({
        zoom: newZoom,
        x: newCameraX,
        y: newCameraY,
      });
    },
    [camera, setCamera, canvasRef]
  );

  const mapDimensions = useMemo(() => {
    if (config.mapSize !== "infinite") {
      return {
        width: config.mapSize.width * config.gridSize,
        height: config.mapSize.height * config.gridSize,
        left: 0,
        top: 0,
      };
    }
    return {
      width: (mapBounds.maxX - mapBounds.minX + 1) * config.gridSize,
      height: (mapBounds.maxY - mapBounds.minY + 1) * config.gridSize,
      left: mapBounds.minX * config.gridSize,
      top: mapBounds.minY * config.gridSize,
    };
  }, [mapBounds, config.mapSize, config.gridSize]);

  const handleInteractionMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const { clientX, clientY } = getEventCoords(e);
      const coords = getGridCoordinates(clientX, clientY);

      if (!coords) {
        setMouse(null);
        setHoveredTile(null);
        setIsOverMap(false);
        return;
      }

      if (configRef.current.mapSize !== "infinite") {
        if (
          coords.x < 0 ||
          coords.x >= configRef.current.mapSize.width ||
          coords.y < 0 ||
          coords.y >= configRef.current.mapSize.height
        ) {
          setMouse(null);
          setHoveredTile(null);
          setIsOverMap(false);
          return;
        }
      }

      setIsOverMap(true);

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const snappedX =
        coords.x * (configRef.current.gridSize * camera.zoom) +
        camera.x +
        rect.left;
      const snappedY =
        coords.y * (configRef.current.gridSize * camera.zoom) +
        camera.y +
        rect.top;

      setMouse({ x: snappedX, y: snappedY });

      const key = `${coords.x}-${coords.y}`;
      const cell = stateRef.current.placedTiles.get(key);

      if (cell) {
        const tilesAtLocation = [...cell.values()].filter(
          (t) => t
        ) as PlacedTile[];
        if (tilesAtLocation.length > 0) {
          const topTile = tilesAtLocation.reduce((top, current) => {
            const topZ =
              configRef.current.tiles[top.tileId]?.zIndex ?? -Infinity;
            const currentZ =
              configRef.current.tiles[current.tileId]?.zIndex ?? -Infinity;
            return currentZ > topZ ? current : top;
          });
          setHoveredTile(topTile);
        } else {
          setHoveredTile(null);
        }
      } else {
        setHoveredTile(null);
      }

      if (isDrawing) {
        setDrawEnd(coords);
      } else if (isDragging.current) {
        setMouse(null);
        const dx = clientX - lastMousePosition.current.x;
        const dy = clientY - lastMousePosition.current.y;
        setCamera({ ...camera, x: camera.x + dx, y: camera.y + dy });
        lastMousePosition.current = { x: clientX, y: clientY };
      } else if (
        ("buttons" in e && e.buttons === 1) ||
        (e.type === "touchmove" &&
          (selectedTool === "place" || selectedTool === "erase") &&
          placeMode !== "rectangle" &&
          eraseMode !== "rectangle")
      ) {
        applyToolAt(coords.x, coords.y);
      }
    },
    [
      camera,
      getEventCoords,
      setMouse,
      setHoveredTile,
      isDrawing,
      setDrawEnd,
      isDragging,
      setCamera,
      selectedTool,
      placeMode,
      eraseMode,
      applyToolAt,
    ]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const { clientX, clientY } = getEventCoords(e);
      const coords = getGridCoordinates(clientX, clientY);

      if (selectedTool === "zoom") {
        const zoomFactor = zoomMode === "in" ? 1.2 : 1 / 1.2;
        handleZoomAtPoint(zoomFactor, clientX, clientY);
        return;
      }

      if (selectedTool === "drag") {
        isDragging.current = true;
        lastMousePosition.current = { x: clientX, y: clientY };
        return;
      }

      if (selectedTool === "eyedropper") {
        if (hoveredTile) {
          const tileDef = configRef.current.tiles[hoveredTile.tileId];
          if (tileDef) {
            setSelectedTile({
              definition: tileDef,
              isAutotileRep: !!tileDef.autotile,
            });
            setSelectedTool("place");
          }
        }
        return;
      }

      if (!coords) return;

      // Handle rectangle drawing modes for both place and erase
      if (
        (selectedTool === "place" &&
          placeMode === "rectangle" &&
          selectedTile) ||
        (selectedTool === "erase" && eraseMode === "rectangle")
      ) {
        setIsDrawing(true);
        setDrawStart(coords);
        setDrawEnd(coords);
      } else {
        // Handle all single-tile modes
        applyToolAt(coords.x, coords.y);
      }
    },
    [
      getEventCoords,
      getGridCoordinates,
      selectedTool,
      zoomMode,
      handleZoomAtPoint,
      isDragging,
      placeMode,
      eraseMode,
      selectedTile,
      applyToolAt,
      hoveredTile,
      setSelectedTile,
      setSelectedTool,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing && drawStart && drawEnd) {
      const startX = Math.min(drawStart.x, drawEnd.x);
      const endX = Math.max(drawStart.x, drawEnd.x);
      const startY = Math.min(drawStart.y, drawEnd.y);
      const endY = Math.max(drawStart.y, drawEnd.y);

      if (
        selectedTool === "place" &&
        placeMode === "rectangle" &&
        selectedTile
      ) {
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
      } else if (selectedTool === "erase" && eraseMode === "rectangle") {
        dispatch({
          type: "ERASE_RECTANGLE",
          payload: { startX, startY, endX, endY },
        });
      }
    }

    isDragging.current = false;
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
    selectedTool,
  ]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (justTouched.current) return;
      handleInteractionMove(e);
    },
    [handleInteractionMove]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // pinch
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchDist.current = Math.sqrt(dx * dx + dy * dy);
      } else if (e.touches.length === 1) {
        if (selectedTool === "drag") {
          isDragging.current = true;
          const { clientX, clientY } = getEventCoords(e);
          lastMousePosition.current = { x: clientX, y: clientY };
        } else {
          const { clientX, clientY } = getEventCoords(e);
          const coords = getGridCoordinates(clientX, clientY);
          if (coords) {
            applyToolAt(coords.x, coords.y);
          }
        }
      }
    },
    [selectedTool, getEventCoords, getGridCoordinates, applyToolAt]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        // pinch
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newPinchDist = Math.sqrt(dx * dx + dy * dy);
        const delta = newPinchDist - pinchDist.current;
        pinchDist.current = newPinchDist;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        const c1 = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
        const c2 = {
          x: e.touches[1].clientX - rect.left,
          y: e.touches[1].clientY - rect.top,
        };

        const midX = (c1.x + c2.x) / 2;
        const midY = (c1.y + c2.y) / 2;

        const worldX = (midX - camera.x) / camera.zoom;
        const worldY = (midY - camera.y) / camera.zoom;

        const newZoom = Math.max(0.1, camera.zoom + delta * 0.01);

        const newCameraX = midX - worldX * newZoom;
        const newCameraY = midY - worldY * newZoom;

        setCamera({
          zoom: newZoom,
          x: newCameraX,
          y: newCameraY,
        });
      } else {
        handleInteractionMove(e);
      }
    },
    [camera.x, camera.y, camera.zoom, handleInteractionMove, setCamera]
  );

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    isDragging.current = false;
    pinchDist.current = 0;
    // A brief flag to prevent ghost mousemove events on touch devices.
    justTouched.current = true;
    setTimeout(() => {
      justTouched.current = false;
    }, 200);
  }, []);

  const handleMouseEnter = useCallback(
    (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
      setIsOverMap(true);
    },
    [setMouse]
  );

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
    setIsDrawing(false);
    setMouse(null);
    setHoveredTile(null);
    setIsOverMap(false);
  }, [setMouse, setHoveredTile]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      setIsInteracting(true);

      if (interactionTimeout.current) {
        clearTimeout(interactionTimeout.current);
      }
      interactionTimeout.current = window.setTimeout(
        () => setIsInteracting(false),
        500
      );

      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - camera.x) / camera.zoom;
      const worldY = (mouseY - camera.y) / camera.zoom;

      const unconstrainedZoom = camera.zoom - e.deltaY * 0.001;
      let newZoom: number;

      if (config.mapSize === "infinite") {
        // Calculate minimum zoom to fit the map to the canvas
        const minZoomX = rect.width / mapDimensions.width;
        const minZoomY = rect.height / mapDimensions.height;
        const minZoom = Math.max(minZoomX, minZoomY);
        newZoom = Math.max(minZoom, unconstrainedZoom);
      } else {
        newZoom = Math.max(0.1, unconstrainedZoom);
      }

      const newCameraX = mouseX - worldX * newZoom;
      const newCameraY = mouseY - worldY * newZoom;

      setCamera({
        zoom: newZoom,
        x: newCameraX,
        y: newCameraY,
      });
    },
    [camera, setCamera, mapDimensions, config.mapSize]
  );

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const options = { passive: false };

    const handleTouchStartNative = handleTouchStart as unknown as EventListener;
    const handleTouchMoveNative = handleTouchMove as unknown as EventListener;
    const handleTouchEndNative = handleTouchEnd as unknown as EventListener;
    const handleWheelNative = handleWheel as unknown as EventListener;

    canvasElement.addEventListener(
      "touchstart",
      handleTouchStartNative,
      options
    );
    canvasElement.addEventListener("touchmove", handleTouchMoveNative, options);
    canvasElement.addEventListener("touchend", handleTouchEndNative, options);
    canvasElement.addEventListener("wheel", handleWheelNative, options);

    return () => {
      canvasElement.removeEventListener("touchstart", handleTouchStartNative);
      canvasElement.removeEventListener("touchmove", handleTouchMoveNative);
      canvasElement.removeEventListener("touchend", handleTouchEndNative);
      canvasElement.removeEventListener("wheel", handleWheelNative);
    };
  }, [
    canvasRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  ]);

  const centerGridCoords = useMemo(() => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const gridX = Math.floor(
      (centerX - camera.x) / (config.gridSize * camera.zoom)
    );
    const gridY = Math.floor(
      (centerY - camera.y) / (config.gridSize * camera.zoom)
    );

    return { x: gridX, y: gridY };
  }, [camera, config.gridSize, canvasRef]);

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="canvas-container"
      style={{ cursor }}
    >
      <div
        className="transform-container"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "top left",
          width: "100%",
          height: "100%",
        }}
      >
        <div
          className="map-boundary"
          style={{
            width: mapDimensions.width,
            height: mapDimensions.height,
            left: mapDimensions.left,
            top: mapDimensions.top,
            position: "absolute",
            backgroundColor: "#f0f0f0",
          }}
        >
          <div
            className="background-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1,
            }}
          >
            <Background
              mapSize={{
                width: mapDimensions.width,
                height: mapDimensions.height,
              }}
            />
          </div>
          <div
            className="grid-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)`,
              backgroundSize: `${config.gridSize}px ${config.gridSize}px`,
              backgroundPosition: `${-mapDimensions.left % config.gridSize}px ${
                -mapDimensions.top % config.gridSize
              }px`,
              zIndex: 2,
            }}
          />
          <div
            className="tile-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 3,
            }}
          >
            {Array.from(state.placedTiles.entries()).flatMap(
              ([cellKey, cell]) =>
                Array.from(cell.entries()).map(([zIndex, placedTile]) => {
                  const [x, y] = cellKey.split("-").map(Number);

                  return (
                    <div
                      key={`${cellKey}-${zIndex}`}
                      style={{
                        position: "absolute",
                        left: x * config.gridSize - mapDimensions.left,
                        top: y * config.gridSize - mapDimensions.top,
                        zIndex: zIndex,
                      }}
                    >
                      <Tile
                        tile={
                          placedTile
                            ? {
                                ...config.tiles[placedTile.tileId],
                                ...placedTile,
                              }
                            : null
                        }
                      />
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
      {isDrawing && drawStart && drawEnd && (
        <div
          className="drawing-rectangle"
          style={{
            position: "absolute",
            left:
              Math.min(drawStart.x, drawEnd.x) * config.gridSize * camera.zoom +
              camera.x,
            top:
              Math.min(drawStart.y, drawEnd.y) * config.gridSize * camera.zoom +
              camera.y,
            width:
              (Math.abs(drawStart.x - drawEnd.x) + 1) *
              config.gridSize *
              camera.zoom,
            height:
              (Math.abs(drawStart.y - drawEnd.y) + 1) *
              config.gridSize *
              camera.zoom,
            border:
              selectedTool === "place"
                ? "2px solid rgba(52, 152, 219, 0.8)"
                : "2px solid rgba(231, 76, 60, 0.8)",
            backgroundColor:
              selectedTool === "place"
                ? "rgba(52, 152, 219, 0.2)"
                : "rgba(231, 76, 60, 0.2)",
            zIndex: 100,
            pointerEvents: "none",
          }}
        />
      )}
      {isInteracting && config.mapSize === "infinite" && (
        <div className="center-coords-overlay">
          {`x: ${centerGridCoords.x}, y: ${centerGridCoords.y}`}
        </div>
      )}
    </div>
  );
};
