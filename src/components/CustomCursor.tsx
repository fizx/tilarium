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
    opacity: 0.5,
    transform: `scale(${camera.zoom})`,
    transformOrigin: "top left",
  };

  const renderContent = () => {
    switch (selectedTool) {
      case "erase":
        return (
          <span style={{ fontSize: `${config.gridSize / camera.zoom}px` }}>
            🧼
          </span>
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
