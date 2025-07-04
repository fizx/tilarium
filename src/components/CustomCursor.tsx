import React from "react";
import { useEditor } from "../EditorContext";
import { Tile } from "./Tile";

export const CustomCursor = () => {
  const { selectedTool, selectedTile, mouse, camera, config } = useEditor();

  if (!mouse) {
    return null;
  }

  const cursorStyle: React.CSSProperties = {
    position: "fixed",
    left: mouse.x,
    top: mouse.y,
    pointerEvents: "none",
    zIndex: 1000,
    opacity: selectedTool === "erase" ? 1 : 0.5,
    transform: `scale(${camera.zoom})`,
    transformOrigin: "top left",
  };

  const renderContent = () => {
    switch (selectedTool) {
      case "erase":
        return (
          <div
            style={{
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
          return <Tile tile={selectedTile} />;
        }
        return null;
      default:
        return null;
    }
  };

  return <div style={cursorStyle}>{renderContent()}</div>;
};
