import React from "react";
import { useEditor } from "../EditorContext";
import { Tile } from "./Tile";

const Tooltip = () => {
  const { hoveredTile, config } = useEditor();
  if (!hoveredTile) return null;

  const tileDef = config.tiles[hoveredTile.tileId];
  if (!tileDef) return null;

  return (
    <div
      style={{
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "2px 5px",
        borderRadius: "3px",
        fontSize: "12px",
        whiteSpace: "nowrap",
        transform: "translateY(-100%)",
      }}
    >
      {tileDef.displayName}
    </div>
  );
};

export const CustomCursor = () => {
  const {
    selectedTool,
    selectedTile,
    mouse,
    camera,
    config,
    hoveredTile,
    zoomMode,
    isMouseOverUI,
  } = useEditor();

  if (!mouse || isMouseOverUI) {
    return null;
  }

  const shouldSnapToGrid = selectedTool === "place" || selectedTool === "erase";

  let cursorX = mouse.x;
  let cursorY = mouse.y;

  if (shouldSnapToGrid) {
    const gridX = Math.floor(
      (mouse.x - camera.x) / (config.gridSize * camera.zoom)
    );
    const gridY = Math.floor(
      (mouse.y - camera.y) / (config.gridSize * camera.zoom)
    );
    cursorX = gridX * config.gridSize * camera.zoom + camera.x;
    cursorY = gridY * config.gridSize * camera.zoom + camera.y;
  }

  const cursorStyle: React.CSSProperties = {
    position: "fixed",
    left: cursorX,
    top: cursorY,
    pointerEvents: "none",
    zIndex: 1000,
  };

  const renderCursorContent = () => {
    const contentStyle: React.CSSProperties = {
      transformOrigin: "top left",
    };

    switch (selectedTool) {
      case "zoom":
        return (
          <div
            style={{
              ...contentStyle,
              fontSize: "24px",
              transform: "translate(-50%, -50%)", // Center the emoji on the cursor
            }}
          >
            {zoomMode === "in" ? "🔍➕" : "🔍➖"}
          </div>
        );
      case "erase":
        return (
          <div
            style={{
              ...contentStyle,
              width: config.gridSize * camera.zoom,
              height: config.gridSize * camera.zoom,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: config.gridSize * camera.zoom,
              opacity: 1,
            }}
          >
            🧼
          </div>
        );
      case "place":
        if (selectedTile) {
          return (
            <div
              style={{
                ...contentStyle,
                opacity: 0.5,
                transform: `scale(${camera.zoom})`,
                transformOrigin: "top left",
              }}
            >
              <Tile tile={{ ...selectedTile.definition, source: "local" }} />
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div style={cursorStyle}>
      {selectedTool === "eyedropper" && hoveredTile && <Tooltip />}
      {renderCursorContent()}
    </div>
  );
};
