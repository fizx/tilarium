import React, { useRef, MouseEvent } from "react";
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
  } = useEditor();
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: MouseEvent) => {
    isDragging.current = true;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: MouseEvent) => {
    isDragging.current = false;
    // If not dragging, treat as a click
    if (e.target === e.currentTarget) {
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
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMousePosition.current.x;
      const dy = e.clientY - lastMousePosition.current.y;
      setCamera({ ...camera, x: camera.x + dx, y: camera.y + dy });
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const newZoom = camera.zoom - e.deltaY * 0.001;
    setCamera({ ...camera, zoom: Math.max(0.1, newZoom) });
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => (isDragging.current = false)}
      onWheel={handleWheel}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#f0f0f0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        className="background-container"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "top left",
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
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "top left",
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
  );
};
