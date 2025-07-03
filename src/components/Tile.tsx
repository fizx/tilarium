import React from "react";
import { TileDefinition } from "../config";

interface TileProps {
  tile: TileDefinition;
  onClick: () => void;
  isSelected: boolean;
}

export const Tile: React.FC<TileProps> = ({ tile, onClick, isSelected }) => {
  const wrapperClasses = `tile-wrapper ${isSelected ? "selected" : ""}`;

  const imageContainerStyle: React.CSSProperties = {
    width: tile.spritesheet
      ? tile.spritesheet.width * (tile.scale ?? 1)
      : "100%",
    height: tile.spritesheet
      ? tile.spritesheet.height * (tile.scale ?? 1)
      : "100%",
    overflow: "hidden",
    position: "relative",
  };

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    transform: `scale(${tile.scale ?? 1})`,
    left: tile.spritesheet ? -tile.spritesheet.x * (tile.scale ?? 1) : 0,
    top: tile.spritesheet ? -tile.spritesheet.y * (tile.scale ?? 1) : 0,
  };

  return (
    <div onClick={onClick} className={wrapperClasses}>
      <div style={imageContainerStyle}>
        <img
          src={tile.src}
          alt={tile.displayName}
          className="tile-image"
          style={imageStyle}
        />
      </div>
      <div className="tile-caption">{tile.displayName}</div>
    </div>
  );
};
