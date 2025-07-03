import React, { useRef, MouseEvent, useState, useMemo } from "react";
import { useEditor } from "../EditorContext";
import { Tile } from "./Tile";

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
  } = useEditor();
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const cursor = useMemo(() => {
    if (isDragging) {
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
  }, [selectedTool, isDragging]);

  const handleMouseDown = (e: MouseEvent) => {
    if (selectedTool === "drag") {
      setIsDragging(true);
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    setIsDragging(false);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(
      (e.clientX - rect.left - camera.x) / (32 * camera.zoom)
    );
    const y = Math.floor(
      (e.clientY - rect.top - camera.y) / (32 * camera.zoom)
    );

    if (selectedTool === "place" && selectedTile) {
      dispatch({
        type: "ADD_TILE",
        payload: { x, y, tileId: selectedTile.displayName },
      });
    } else if (selectedTool === "erase") {
      dispatch({ type: "REMOVE_TILE", payload: { x, y } });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && selectedTool === "drag") {
      setMouse(null);
      const dx = e.clientX - lastMousePosition.current.x;
      const dy = e.clientY - lastMousePosition.current.y;
      setCamera({ ...camera, x: camera.x + dx, y: camera.y + dy });
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor(
        (e.clientX - rect.left - camera.x) / (32 * camera.zoom)
      );
      const y = Math.floor(
        (e.clientY - rect.top - camera.y) / (32 * camera.zoom)
      );

      const snappedX = x * (32 * camera.zoom) + camera.x + rect.left;
      const snappedY = y * (32 * camera.zoom) + camera.y + rect.top;

      setMouse({ x: snappedX, y: snappedY });
    }
  };

  const handleMouseEnter = (e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setMouse(null);
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
          width: config.mapSize.width * 32,
          height: config.mapSize.height * 32,
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
                }
              : {
                  width: "100%",
                  height: "100%",
                  position: "relative",
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
            }}
          >
            {state.placedTiles
              .filter(
                (placedTile) =>
                  config.tiles[placedTile.tileId]?.type === "background"
              )
              .map((placedTile) => {
                const tileDef = config.tiles[placedTile.tileId];
                if (!tileDef) return null;
                return (
                  <img
                    key={placedTile.tileId}
                    src={tileDef.src}
                    alt={tileDef.displayName}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      zIndex: tileDef.zIndex,
                    }}
                  />
                );
              })}
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
                (placedTile) => config.tiles[placedTile.tileId]?.type === "tile"
              )
              .map((placedTile) => {
                const tileDef = config.tiles[placedTile.tileId];
                if (!tileDef) return null;
                return (
                  <div
                    key={`${placedTile.x}-${placedTile.y}`}
                    style={{
                      position: "absolute",
                      left: placedTile.x * 32, // Assuming a grid size of 32 for now
                      top: placedTile.y * 32,
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
