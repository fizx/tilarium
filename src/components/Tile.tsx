import React from "react";
import { TileDefinition } from "../config";

interface TileProps {
  tile: TileDefinition;
}

export const Tile: React.FC<TileProps> = ({ tile }) => {
  if (!tile.spritesheet) {
    return <img src={tile.src} alt={tile.displayName} className="tile-image" />;
  }

  const wrapperStyle: React.CSSProperties = {
    width: tile.spritesheet.width,
    height: tile.spritesheet.height,
    overflow: "hidden",
    position: "relative",
  };

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    left: -tile.spritesheet.x,
    top: -tile.spritesheet.y,
  };

  return (
    <div style={wrapperStyle}>
      <img src={tile.src} alt={tile.displayName} style={imageStyle} />
    </div>
  );
};
