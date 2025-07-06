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
  const { selectedTool, selectedTile, mouse, camera, config, hoveredTile } =
    useEditor();

  if (!mouse) {
    return null;
  }

  const cursorStyle: React.CSSProperties = {
    position: "fixed",
    left: mouse.x,
    top: mouse.y,
    pointerEvents: "none",
    zIndex: 1000,
  };

  const renderCursorContent = () => {
    const cursorStyle: React.CSSProperties = {
      opacity: selectedTool === "erase" ? 1 : 0.5,
      transform: `scale(${camera.zoom})`,
      transformOrigin: "top left",
    };

    switch (selectedTool) {
      case "erase":
        return (
          <div
            style={{
              ...cursorStyle,
              width: config.gridSize,
              height: config.gridSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: config.gridSize,
            }}
          >
            🧼
          </div>
        );
      case "place":
        if (selectedTile) {
          return (
            <div style={cursorStyle}>
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
