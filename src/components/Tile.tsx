import React from "react";
import { TileDefinition } from "../config";

interface TileProps {
  tile: TileDefinition;
  onClick: () => void;
  isSelected: boolean;
}

export const Tile: React.FC<TileProps> = ({ tile, onClick, isSelected }) => {
  const wrapperClasses = `tile-wrapper ${isSelected ? "selected" : ""}`;

  const style: React.CSSProperties = {
    width: tile.spritesheet
      ? tile.spritesheet.width * (tile.scale ?? 1)
      : "100%",
    height: tile.spritesheet
      ? tile.spritesheet.height * (tile.scale ?? 1)
      : "100%",
  };

  const imageStyle: React.CSSProperties = {
    transform: `scale(${tile.scale ?? 1})`,
    left: tile.spritesheet ? -tile.spritesheet.x * (tile.scale ?? 1) : 0,
    top: tile.spritesheet ? -tile.spritesheet.y * (tile.scale ?? 1) : 0,
  };

  return (
    <div onClick={onClick} className={wrapperClasses} style={style}>
      <img
        src={tile.src}
        alt={tile.displayName}
        className="tile-image"
        style={imageStyle}
      />
    </div>
  );
};
