import React from "react";
import { TileDefinition } from "../config";
import { useEditor } from "../EditorContext";

interface TileProps {
  tile: TileDefinition;
}

export const Tile: React.FC<TileProps> = ({ tile }) => {
  const { config } = useEditor();
  const { gridSize } = config;

  if (!tile.spritesheet) {
    return (
      <img
        src={tile.src}
        alt={tile.displayName}
        className="tile-image"
        style={{ width: gridSize, height: gridSize }}
        onDragStart={(e) => e.preventDefault()}
      />
    );
  }

  const scale = gridSize / tile.spritesheet.width;

  const wrapperStyle: React.CSSProperties = {
    width: gridSize,
    height: gridSize,
    overflow: "hidden",
    position: "relative",
  };

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    left: -tile.spritesheet.x * scale,
    top: -tile.spritesheet.y * scale,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  return (
    <div style={wrapperStyle} onDragStart={(e) => e.preventDefault()}>
      <img
        src={tile.src}
        alt={tile.displayName}
        style={imageStyle}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
};
