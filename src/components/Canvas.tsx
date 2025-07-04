import React, { useRef, MouseEvent, useState, useMemo } from "react";
import { useEditor } from "../EditorContext";
import { Tile } from "./Tile";
import { Background } from "./Background";

export const Canvas = () => {
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
  } = useEditor();
  const [isDragging, setIsDragging] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const lastPaintedCell = useRef<{ x: number; y: number } | null>(null);

  const cursor = useMemo(() => {
    if (isDragging || isPainting) {
      return "grabbing";
    }

    switch (selectedTool) {
      case "drag":
        return "grab";
      case "erase":
      case "place":
        return "none";
      case "magic-wand":
        return "pointer";
      default:
        return "default";
    }
  }, [selectedTool, isDragging, isPainting]);

  const applyToolAt = (gridX: number, gridY: number) => {
    if (
      lastPaintedCell.current?.x === gridX &&
      lastPaintedCell.current?.y === gridY
    ) {
      return;
    }

    if (selectedTool === "place" && selectedTile) {
      dispatch({
        type: "ADD_TILE",
        payload: { x: gridX, y: gridY, tileId: selectedTile.displayName },
      });
    } else if (selectedTool === "erase") {
      dispatch({ type: "REMOVE_TILE", payload: { x: gridX, y: gridY } });
    }

    lastPaintedCell.current = { x: gridX, y: gridY };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (selectedTool === "drag") {
      setIsDragging(true);
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    } else if (selectedTool === "place" || selectedTool === "erase") {
      setIsPainting(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor(
        (e.clientX - rect.left - camera.x) / (config.gridSize * camera.zoom)
      );
      const y = Math.floor(
        (e.clientY - rect.top - camera.y) / (config.gridSize * camera.zoom)
      );
      applyToolAt(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPainting(false);
    lastPaintedCell.current = null;
  };

  const handleMouseMove = (e: MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const gridX = Math.floor(
      (e.clientX - rect.left - camera.x) / (config.gridSize * camera.zoom)
    );
    const gridY = Math.floor(
      (e.clientY - rect.top - camera.y) / (config.gridSize * camera.zoom)
    );

    const snappedX =
      gridX * (config.gridSize * camera.zoom) + camera.x + rect.left;
    const snappedY =
      gridY * (config.gridSize * camera.zoom) + camera.y + rect.top;

    setMouse({ x: snappedX, y: snappedY });

    if (isPainting) {
      applyToolAt(gridX, gridY);
      return;
    }

    if (isDragging && selectedTool === "drag") {
      setMouse(null);
      const dx = e.clientX - lastMousePosition.current.x;
      const dy = e.clientY - lastMousePosition.current.y;
      setCamera({ ...camera, x: camera.x + dx, y: camera.y + dy });
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    } else {
      if (selectedTool === "place" && selectedTile) {
        const tileToReplace =
          state.placedTiles.find((pt) => {
            const existingTileDef = config.tiles[pt.tileId];
            return (
              pt.x === gridX &&
              pt.y === gridY &&
              existingTileDef?.zIndex === selectedTile.zIndex
            );
          }) || null;
        setTileToReplace(tileToReplace);
      } else {
        setTileToReplace(null);
      }
    }
  };

  const handleMouseEnter = (e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsPainting(false);
    lastPaintedCell.current = null;
    setMouse(null);
    setTileToReplace(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - camera.x) / camera.zoom;
    const worldY = (mouseY - camera.y) / camera.zoom;

    const newZoom = Math.max(0.1, camera.zoom - e.deltaY * 0.001);

    const newCameraX = mouseX - worldX * newZoom;
    const newCameraY = mouseY - worldY * newZoom;

    setCamera({
      zoom: newZoom,
      x: newCameraX,
      y: newCameraY,
    });
  };

  const mapSize =
    config.mapSize === "infinite"
      ? null
      : {
          width: config.mapSize.width * config.gridSize,
          height: config.mapSize.height * config.gridSize,
        };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      className="canvas-container"
      style={{ cursor }}
    >
      <div
        className="transform-container"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "top left",
          width: mapSize ? "max-content" : "100%",
          height: mapSize ? "max-content" : "100%",
        }}
      >
        <div
          className="map-boundary"
          style={
            mapSize
              ? {
                  ...mapSize,
                  position: "relative",
                  backgroundSize: `${config.gridSize}px ${config.gridSize}px`,
                }
              : {
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  backgroundSize: `${config.gridSize}px ${config.gridSize}px`,
                }
          }
        >
          <div
            className="background-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: -1,
            }}
          >
            <Background />
          </div>
          <div
            className="tile-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          >
            {state.placedTiles
              .filter(
                (placedTile) =>
                  config.tiles[placedTile.tileId]?.type === "tile" &&
                  !(
                    placedTile.x === state.tileToReplace?.x &&
                    placedTile.y === state.tileToReplace?.y &&
                    placedTile.tileId === state.tileToReplace?.tileId
                  )
              )
              .map((placedTile) => {
                const tileDef = config.tiles[placedTile.tileId];
                if (!tileDef) return null;
                return (
                  <div
                    key={`${placedTile.x}-${placedTile.y}-${placedTile.tileId}`}
                    style={{
                      position: "absolute",
                      left: placedTile.x * config.gridSize,
                      top: placedTile.y * config.gridSize,
                      zIndex: tileDef.zIndex,
                    }}
                  >
                    <Tile tile={tileDef} />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
